const { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');
require('dotenv').config();

class StorageService {
    constructor() {
        this.isCloudAvailable = false;
        this.initialized = false;
        this.mode = (process.env.STORAGE_MODE || 'cloud').trim();
        
        const rawEndpoint = this.mode === 'local_mock' 
            ? process.env.S3_MOCK_ENDPOINT 
            : process.env.S3_ENDPOINT;
        
        this.endpoint = (rawEndpoint || '').trim().replace(/\/$/, '');
        this.accessKey = (process.env.S3_ACCESS_KEY || '').trim();
        this.secretKey = (process.env.S3_SECRET_KEY || '').trim();
        this.bucket = process.env.S3_BUCKET;
        this.publicUrl = this.mode === 'local_mock' ? '/video-rental-app' : process.env.R2_PUBLIC_URL;

        console.log(`[STORAGE] Iniciando en modo: ${this.mode} -> Endpoint: ${this.endpoint}`);

        this.s3Client = new S3Client({
            region: 'auto',
            endpoint: this.endpoint,
            credentials: {
                accessKeyId: this.mode === 'local_mock' ? 'S3RVER' : this.accessKey,
                secretAccessKey: this.mode === 'local_mock' ? 'S3RVER' : this.secretKey,
            },
            forcePathStyle: true
        });
    }

    async checkConnectivity() {
        try {
            const command = new ListObjectsV2Command({ Bucket: this.bucket, MaxKeys: 1 });
            await this.s3Client.send(command);
            this.isCloudAvailable = true;
            console.log("✅ [STORAGE] Conexión exitosa a R2.");
        } catch (error) {
            console.warn(`⚠️ [STORAGE] Error de conexión: ${error.message}`);
            this.isCloudAvailable = this.mode === 'cloud'; 
        }
        this.initialized = true;
        return this.isCloudAvailable;
    }

    generatePresignedPutUrl(key, expiresIn = 3600) {
        const endpoint = new URL(this.endpoint);
        // Virtual host style: bucket en el hostname
        const host = `${this.bucket}.${endpoint.host}`;
        
        // Fecha manual para evitar bugs con regex
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const dateStamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth()+1)}${pad(now.getUTCDate())}`;
        const amzDate = `${dateStamp}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
        
        const region = 'auto';
        const service = 's3';
        const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
        const credential = `${this.accessKey}/${credentialScope}`;
        const encodedCredential = encodeURIComponent(credential);

        const path = `/${key}`;

        // Parámetros ordenados alfabéticamente (requerido por AWS Sig V4)
        const canonicalQueryString = [
            `X-Amz-Algorithm=AWS4-HMAC-SHA256`,
            `X-Amz-Credential=${encodedCredential}`,
            `X-Amz-Date=${amzDate}`,
            `X-Amz-Expires=${expiresIn}`,
            `X-Amz-SignedHeaders=host`,
        ].join('&');

        const canonicalHeaders = `host:${host}\n`;
        const signedHeaders = 'host';
        const payloadHash = 'UNSIGNED-PAYLOAD';

        const canonicalRequest = [
            'PUT',
            path,
            canonicalQueryString,
            canonicalHeaders,
            signedHeaders,
            payloadHash
        ].join('\n');

        const stringToSign = [
            'AWS4-HMAC-SHA256',
            amzDate,
            credentialScope,
            crypto.createHash('sha256').update(canonicalRequest).digest('hex')
        ].join('\n');

        const hmac = (k, d) => crypto.createHmac('sha256', k).update(d).digest();
        const signingKey = hmac(
            hmac(
                hmac(
                    hmac(`AWS4${this.secretKey}`, dateStamp),
                    region
                ),
                service
            ),
            'aws4_request'
        );
        const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

        const finalUrl = `https://${host}${path}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
        console.log(`[STORAGE] Presigned URL generada para: ${key}`);
        return finalUrl;
    }

    async getFileUrl(filename) {
        if (!this.initialized) await this.checkConnectivity();
        if (this.isCloudAvailable && filename && (filename.startsWith('raw/') || filename.startsWith('hls/') || filename.startsWith('thumbnails/'))) {
            try {
                const command = new GetObjectCommand({ Bucket: this.bucket, Key: filename });
                return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 * 6 });
            } catch (err) {
                console.error("[STORAGE] Error en URL firmada:", err.message);
            }
        }
        return `/uploads/${filename}`;
    }

    async getPresignedUploadUrl(key, contentType) {
        if (!this.initialized) await this.checkConnectivity();
        if (this.isCloudAvailable) {
            try {
                const url = this.generatePresignedPutUrl(key, 3600);
                return { url, method: 'PUT', isCloud: true };
            } catch (err) {
                console.error("[STORAGE] Error generando URL de subida:", err.message);
            }
        }
        return { url: `/api/upload/local?key=${encodeURIComponent(key)}`, method: 'POST', isCloud: false };
    }

    async getStreamingUrl(filename) {
        if (!this.initialized) await this.checkConnectivity();
        if (this.isCloudAvailable) {
            const command = new GetObjectCommand({ Bucket: this.bucket, Key: filename });
            return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 * 6 });
        }
        return `/uploads/${filename}`;
    }

    async uploadFileToCloud(filePath, key, contentType) {
        if (!this.initialized) await this.checkConnectivity();
        const fs = require('fs');
        const fileStream = fs.createReadStream(filePath);
        try {
            const command = new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: fileStream,
                ContentType: contentType
            });
            await this.s3Client.send(command);
            return true;
        } catch (error) {
            console.error("[STORAGE] Error proxy upload:", error.message);
            throw error;
        }
    }
}

module.exports = new StorageService();

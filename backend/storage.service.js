const { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
require('dotenv').config();

class StorageService {
    constructor() {
        this.isCloudAvailable = false;
        this.initialized = false;
        this.mode = (process.env.STORAGE_MODE || 'cloud').trim();
        
        const rawEndpoint = this.mode === 'local_mock' 
            ? process.env.S3_MOCK_ENDPOINT 
            : process.env.S3_ENDPOINT;
        
        const endpoint = (rawEndpoint || '').trim().replace(/\/$/, '');

        console.log(`[STORAGE] Iniciando en modo: ${this.mode} -> Endpoint: ${endpoint}`);

        this.s3Client = new S3Client({
            region: 'auto',
            endpoint: endpoint,
            credentials: {
                accessKeyId: this.mode === 'local_mock' ? 'S3RVER' : (process.env.S3_ACCESS_KEY || '').trim(),
                secretAccessKey: this.mode === 'local_mock' ? 'S3RVER' : (process.env.S3_SECRET_KEY || '').trim(),
            },
            forcePathStyle: true // ACTIVA EL MODO COMPATIBILIDAD TOTAL
        });

        this.bucket = process.env.S3_BUCKET;
        this.publicUrl = this.mode === 'local_mock' ? '/video-rental-app' : process.env.R2_PUBLIC_URL;
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
                const { PutObjectCommand } = require('@aws-sdk/client-s3');
                const command = new PutObjectCommand({ 
                    Bucket: this.bucket, 
                    Key: key
                });
                // FIRMA ULTRA-LIMPIA: Solo el host. Evita el Error 400.
                const url = await getSignedUrl(this.s3Client, command, { 
                    expiresIn: 3600,
                    signableHeaders: new Set(['host'])
                });
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

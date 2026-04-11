const { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
require('dotenv').config();

class StorageService {
    constructor() {
        this.isCloudAvailable = false;
        this.initialized = false;
        this.mode = (process.env.STORAGE_MODE || 'cloud').trim();
        
        // Determinar endpoint (Real R2 vs Mock Local)
        const rawEndpoint = this.mode === 'local_mock' 
            ? process.env.S3_MOCK_ENDPOINT 
            : process.env.S3_ENDPOINT;
        
        // Asegurarnos de que el endpoint sea una URL válida y limpia
        const endpoint = (rawEndpoint || '').trim().replace(/\/$/, '');

        console.log(`[STORAGE] Iniciando en modo: ${this.mode} -> Endpoint: ${endpoint}`);

        // Configuración persistente para el cliente S3
        this.s3Client = new S3Client({
            region: 'auto',
            endpoint: endpoint,
            credentials: {
                accessKeyId: this.mode === 'local_mock' ? 'S3RVER' : (process.env.S3_ACCESS_KEY || '').trim(),
                secretAccessKey: this.mode === 'local_mock' ? 'S3RVER' : (process.env.S3_SECRET_KEY || '').trim(),
            },
            requestChecksumCalculation: "WHEN_REQUIRED",
            responseChecksumValidation: "WHEN_REQUIRED",
            forcePathStyle: false // Probamos False: estilo Virtual Host (bucket en el nombre de host)
        });

        this.bucket = process.env.S3_BUCKET;
        this.publicUrl = this.mode === 'local_mock' ? '/video-rental-app' : process.env.R2_PUBLIC_URL;
    }

    /**
     * Verifica proactivamente si podemos hablar con Cloudflare R2
     */
    async checkConnectivity() {
        console.log(`[STORAGE] Verificando servicio de almacenamiento en bucket: ${this.bucket}...`);
        try {
            const command = new ListObjectsV2Command({
                Bucket: this.bucket,
                MaxKeys: 1
            });
            await this.s3Client.send(command);
            this.isCloudAvailable = true;
            console.log("✅ [STORAGE] Conexión exitosa. Modo Remoto/Nube activo.");
        } catch (error) {
            this.isCloudAvailable = this.mode === 'cloud' && error.name !== 'CredentialsError'; // Still try if it's cloud unless credentials are bad
            console.warn(`⚠️ [STORAGE] Error de conexión: ${error.name} - ${error.message}`);
            
            if (this.mode === 'cloud') {
                console.warn("⚠️ [STORAGE] MODO CLOUD FORZADO - Se intentará operar aunque la verificación falló.");
                this.isCloudAvailable = true; 
            } else {
                console.warn("⚠️ [STORAGE] Activando Modo Respaldo Local.");
                this.isCloudAvailable = false;
            }
        }
        this.initialized = true;
        return this.isCloudAvailable;
    }

    /**
     * Obtiene una URL para un archivo, decidiendo entre Cloud o Local
     */
    async getFileUrl(filename, type = 'video') {
        if (!this.initialized) await this.checkConnectivity();

        // Si el cloud está disponible y el archivo parece ser remoto
        if (this.isCloudAvailable && filename && (filename.startsWith('raw/') || filename.startsWith('hls/') || filename.startsWith('thumbnails/'))) {
            try {
                const { GetObjectCommand } = require('@aws-sdk/client-s3');
                const command = new GetObjectCommand({ Bucket: this.bucket, Key: filename });
                return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 * 6 });
            } catch (err) {
                console.error("[STORAGE] Error generando URL firmada, cayendo en fallback local:", err.message);
            }
        }

        // Fallback: URL local (servida desde /uploads)
        return `/uploads/${filename}`;
    }

    /**
     * Genera una URL de subida. Si el Cloud falla, indica modo local.
     */
    async getPresignedUploadUrl(key, contentType) {
        if (!this.initialized) await this.checkConnectivity();

        if (this.isCloudAvailable) {
            try {
                const { PutObjectCommand } = require('@aws-sdk/client-s3');
                const command = new PutObjectCommand({ 
                    Bucket: this.bucket, 
                    Key: key,
                    ContentType: contentType,
                    checksumAlgorithm: undefined
                });
                const url = await getSignedUrl(this.s3Client, command, { 
                    expiresIn: 3600,
                    signableHeaders: new Set(['host', 'x-amz-content-sha256'])
                });
                return { url, method: 'PUT', isCloud: true };
            } catch (err) {
                console.error("[STORAGE] Error generando presigned upload URL:", err.message);
            }
        }

        // Si el cloud falla, devolvemos una ruta para subida local
        return { 
            url: `/api/upload/local?key=${encodeURIComponent(key)}`, 
            method: 'POST', 
            isCloud: false 
        };
    }

    /**
     * Determina si debemos redirigir al cloud o servir local
     */
    async getStreamingUrl(filename, token) {
        if (!this.initialized) await this.checkConnectivity();

        if (this.isCloudAvailable) {
            const command = new GetObjectCommand({ Bucket: this.bucket, Key: filename });
            return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 * 6 });
        }

        // Si no hay cloud, servimos desde el controlador de stream local (si existe el archivo)
        // O redirigimos a la ruta estática directa de uploads
        return `/uploads/${filename}`;
    }

    /**
     * Sube un archivo físico al S3 directamente desde el backend (Proxy)
     */
    async uploadFileToCloud(filePath, key, contentType) {
        if (!this.initialized) await this.checkConnectivity();
        if (!this.isCloudAvailable) {
            throw new Error("No se puede subir al Cloud, el servicio de R2 no está disponible");
        }

        const fs = require('fs');
        const fileStream = fs.createReadStream(filePath);
        
        try {
            const { PutObjectCommand } = require('@aws-sdk/client-s3');
            const command = new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: fileStream,
                ContentType: contentType
            });
            await this.s3Client.send(command);
            console.log(`[STORAGE] Proxy Upload exitoso a Cloudflare R2: ${key}`);
            return true;
        } catch (error) {
            console.error("[STORAGE] Error subiendo archivo proxy:", error.message);
            throw error;
        }
    }
}

module.exports = new StorageService();

const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { NodeHttpHandler } = require("@smithy/node-http-handler");
const { Agent } = require("https");
require('dotenv').config();

async function test(name, config) {
    console.log(`\n>>> Testing: ${name}`);
    const client = new S3Client({
        region: 'auto',
        endpoint: process.env.S3_ENDPOINT,
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY.trim(),
            secretAccessKey: process.env.S3_SECRET_KEY.trim(),
        },
        ...config
    });

    try {
        const command = new ListObjectsV2Command({ Bucket: process.env.S3_BUCKET, MaxKeys: 1 });
        await client.send(command);
        console.log(`✅ [${name}] SUCCESS!`);
    } catch (err) {
        console.log(`❌ [${name}] FAILED: ${err.message}`);
        if (err.stack.includes('handshake failure')) {
            console.log(`   (Handshake failure detected)`);
        }
    }
}

async function runTests() {
    console.log("Starting Storage connectivity audit...");
    
    // Test 1: Minimal config (No custom agent)
    await test("Minimal Config", { forcePathStyle: true });

    // Test 2: Minimal config + PathStyle False
    await test("PathStyle False", { forcePathStyle: false });

    // Test 3: Standard Agent with SNI check
    await test("Standard Agent", {
        forcePathStyle: true,
        requestHandler: new NodeHttpHandler({
            httpsAgent: new Agent({ keepAlive: true })
        })
    });

    // Test 4: Force IPv4
    await test("Force IPv4", {
        forcePathStyle: true,
        requestHandler: new NodeHttpHandler({
            httpsAgent: new Agent({ family: 4 })
        })
    });
}

runTests();

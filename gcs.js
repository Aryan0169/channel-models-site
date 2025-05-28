// gcs.js
const { Storage } = require('@google-cloud/storage');

let storage;

if (process.env.GCP_SERVICE_ACCOUNT) {
  // ✅ Use in-memory credentials from environment variable
  const credentials = JSON.parse(process.env.GCP_SERVICE_ACCOUNT);
  storage = new Storage({ credentials });
} else {
  // 🔁 Fallback to local for development
  const path = require('path');
  const keyPath = path.join(__dirname, '/speedy-rhino-461119-f4-633794e02bc9.json');
  storage = new Storage({ keyFilename: keyPath });
}

const bucketName = 'wireless-channelmodel';
const bucket = storage.bucket(bucketName);

module.exports = bucket;

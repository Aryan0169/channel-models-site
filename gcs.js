// gcs.js
const { Storage } = require('@google-cloud/storage');
const path = require('path');

// Replace with your actual key filename
const keyPath = path.join(__dirname, '/speedy-rhino-461119-f4-662e1bb9343f.json');

const storage = new Storage({
  keyFilename: keyPath,
});

const bucketName = 'wireless-channelmodel'; // your bucket
const bucket = storage.bucket(bucketName);

module.exports = bucket;

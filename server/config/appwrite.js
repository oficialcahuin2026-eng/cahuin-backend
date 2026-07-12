const { Client, Storage, ID } = require('node-appwrite');
const { InputFile } = require('node-appwrite/file');
let storage = null;
let client = null;
let isConfigured = false;

if (process.env.APPWRITE_PROJECT && process.env.APPWRITE_KEY && process.env.APPWRITE_BUCKET_ID) {
  client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT)
    .setKey(process.env.APPWRITE_KEY);
  
  storage = new Storage(client);
  isConfigured = true;
  console.log('☁️ Appwrite Storage configurado.');
} else {
  console.log('⚠️ Appwrite Storage no configurado, cayendo al sistema secundario (Cloudinary).');
}

const getBucketId = () => process.env.APPWRITE_BUCKET_ID;
const getProjectId = () => process.env.APPWRITE_PROJECT;
const getEndpoint = () => process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';

module.exports = {
  client,
  storage,
  isConfigured,
  ID,
  InputFile,
  getBucketId,
  getProjectId,
  getEndpoint
};

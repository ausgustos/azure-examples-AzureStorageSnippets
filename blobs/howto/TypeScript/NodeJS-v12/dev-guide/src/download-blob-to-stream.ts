import { BlobServiceClient, BlockBlobUploadOptions } from '@azure/storage-blob';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
dotenv.config();

// Connection string
const connString = process.env.AZURE_STORAGE_CONNECTION_STRING as string;
if (!connString) throw Error('Azure Storage Connection string not found');

// Client
const client = BlobServiceClient.fromConnectionString(connString);

async function createBlobFromString(
  containerClient,
  blobName,
  fileContentsAsString,
  options: BlockBlobUploadOptions
) {
  const blockBlobClient = await containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.upload(
    fileContentsAsString,
    fileContentsAsString.length,
    options
  );
  console.log(`created blob ${blobName}`);
}
async function downloadBlobAsStream(containerClient, blobName, writableStream) {
  const blobClient = await containerClient.getBlobClient(blobName);

  const downloadResponse = await blobClient.download();

  downloadResponse.readableStreamBody.pipe(writableStream);
  console.log(`download of ${blobName} succeeded`);
}

async function main(blobServiceClient) {
  // create container
  const timestamp = Date.now();
  const containerName = `download-blob-to-string-${timestamp}`;
  console.log(`creating container ${containerName}`);

  const containerOptions = {
    access: 'container'
  };
  const { containerClient } = await blobServiceClient.createContainer(
    containerName,
    containerOptions
  );

  console.log('container creation success');

  // create blob
  const blobTags = {
    createdBy: 'YOUR-NAME',
    createdWith: `StorageSnippetsForDocs-${timestamp}`,
    createdOn: new Date().toDateString()
  };

  const blobName = `${containerName}-from-string.txt`;
  const blobContent = `Hello from a string`;
  const localFileNameWithPath = path.join(__dirname, blobName);
  const writableStream = fs.createWriteStream(localFileNameWithPath, {
    encoding: 'utf-8',
    autoClose: true
  });

  // create blob from string
  await createBlobFromString(containerClient, blobName, blobContent, {
    tags: blobTags
  });

  // download blob to string
  await downloadBlobAsStream(containerClient, blobName, writableStream);
}
main(client)
  .then(() => console.log('done'))
  .catch((err: unknown) => {
    if (err instanceof Error) {
      console.log(err.message);
    }
  });

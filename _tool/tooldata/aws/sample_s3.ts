import {
  S3Client,
  CreateBucketCommand,
  ListBucketsCommand,
  DeleteBucketCommand,
  PutObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand
} from "@aws-sdk/client-s3";

import fs from "fs";
import { pipeline } from "stream/promises";
import path from "path";

/* ================================
   S3 CLIENT (LocalStack)
================================ */
export const s3 = new S3Client({
  region: "us-east-1",
  endpoint: "http://localhost:4566",
  forcePathStyle: true,
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test"
  }
});

/* ================================
   BUCKET OPERATIONS
================================ */

// Create a bucket
export async function createBucket(bucketName: string) {
  await s3.send(new CreateBucketCommand({ Bucket: bucketName }));
  console.log("Bucket created:", bucketName);
}

// List all buckets
export async function listBuckets() {
  const res = await s3.send(new ListBucketsCommand({}));
  return res.Buckets || [];
}

// Delete a bucket (must be empty)
export async function deleteBucket(bucketName: string) {
  await s3.send(new DeleteBucketCommand({ Bucket: bucketName }));
  console.log("Bucket deleted:", bucketName);
}

/* ================================
   FILE (OBJECT) OPERATIONS
================================ */

// Upload file
export async function uploadFile(
  bucket: string,
  key: string,
  filePath: string
) {
  const fileStream = fs.createReadStream(filePath);

  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileStream,
    ContentType: "application/octet-stream"
  }));

  console.log("Uploaded:", key);
}

// List files in bucket
export async function listFiles(bucket: string) {
  const res = await s3.send(new ListObjectsV2Command({ Bucket: bucket }));
  return res.Contents || [];
}

// Download file
export async function downloadFile(bucket: string, key: string) {
  const res = await s3.send(new GetObjectCommand({
    Bucket: bucket,
    Key: key
  }));

  const downloadDir = path.join(process.cwd(), "downloads");
  if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir);

  const filePath = path.join(downloadDir, key);

  await pipeline(
    res.Body as NodeJS.ReadableStream,
    fs.createWriteStream(filePath)
  );

  console.log("Downloaded:", key);
  return filePath;
}

// Update file (overwrite)
export async function updateFile(
  bucket: string,
  key: string,
  newFilePath: string
) {
  return uploadFile(bucket, key, newFilePath);
}

// Delete file
export async function deleteFile(bucket: string, key: string) {
  await s3.send(new DeleteObjectCommand({
    Bucket: bucket,
    Key: key
  }));

  console.log("Deleted:", key);
}

/* ================================
   FULL TEST RUN
================================ */

async function test() {
  const bucket = "my-bucket";
  const key = "test.txt";

  await createBucket(bucket);

  console.log(await listBuckets());

  await uploadFile(bucket, key, "./test.txt");

  console.log(await listFiles(bucket));

  await downloadFile(bucket, key);

  await updateFile(bucket, key, "./test2.txt");

  await deleteFile(bucket, key);

  console.log(await listFiles(bucket));
}

// Run only if file is executed directly
if (require.main === module) {
  test().catch(console.error);
}


import mongoose, { Types } from 'mongoose';
import { GridFSBucket } from 'mongodb';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const bucketName = 'campusFiles';

const getUploadDir = (): string =>
  path.resolve(process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads'));

const getUploadBucket = (): GridFSBucket => {
  const database = mongoose.connection.db;
  if (!database) throw new Error('MongoDB must be connected before storing documents.');
  return new GridFSBucket(database, { bucketName });
};

const getGridFileId = async (storageKey: string): Promise<Types.ObjectId | null> => {
  const database = mongoose.connection.db;
  if (!database) throw new Error('MongoDB must be connected before accessing documents.');
  const file = await database.collection(`${bucketName}.files`).findOne(
    { 'metadata.storageKey': storageKey },
    { projection: { _id: 1 } }
  );
  return file?._id instanceof Types.ObjectId ? file._id : null;
};

export const generateStorageKey = (): string => `${uuidv4()}.pdf`;

export const saveFile = async (storageKey: string, buffer: Buffer): Promise<void> => {
  const uploadStream = getUploadBucket().openUploadStream(storageKey, {
    metadata: { storageKey },
    contentType: 'application/pdf',
  });
  await pipeline(Readable.from([buffer]), uploadStream);
};

export const readFile = async (storageKey: string): Promise<Buffer> => {
  const stream = await streamFile(storageKey);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
};

export const streamFile = async (storageKey: string): Promise<Readable> => {
  const fileId = await getGridFileId(storageKey);
  if (fileId) return getUploadBucket().openDownloadStream(fileId);

  const legacyFile = path.join(getUploadDir(), path.basename(storageKey));
  if (fs.existsSync(legacyFile)) return fs.createReadStream(legacyFile);
  throw new Error(`Stored document ${storageKey} could not be found.`);
};

export const deleteFile = async (storageKey: string): Promise<void> => {
  const fileId = await getGridFileId(storageKey);
  if (fileId) await getUploadBucket().delete(fileId);

  const legacyFile = path.join(getUploadDir(), path.basename(storageKey));
  try {
    await fs.promises.unlink(legacyFile);
  } catch (error: unknown) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') throw error;
  }
};

export const fileExists = async (storageKey: string): Promise<boolean> => {
  if (await getGridFileId(storageKey)) return true;
  return fs.existsSync(path.join(getUploadDir(), path.basename(storageKey)));
};

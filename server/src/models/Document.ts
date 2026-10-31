import mongoose, { Schema, Types } from 'mongoose';

export type DocumentStatus = 'uploading' | 'processing' | 'ready' | 'failed';

export interface IDocument extends mongoose.Document {
  owner: Types.ObjectId;
  title: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;          // bytes
  storageKey: string;        // internal UUID-based filename on disk
  extractedText: string;
  summary: string;
  status: DocumentStatus;
  pageCount: number;
  errorMessage: string;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [300, 'Title cannot exceed 300 characters'],
    },
    originalFileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileType: {
      type: String,
      default: 'application/pdf',
    },
    fileSize: {
      type: Number,
      required: true,
    },
    storageKey: {
      type: String,
      required: true,
      unique: true,
    },
    extractedText: {
      type: String,
      default: '',
    },
    summary: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['uploading', 'processing', 'ready', 'failed'],
      default: 'uploading',
      index: true,
    },
    pageCount: {
      type: Number,
      default: 0,
    },
    errorMessage: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Compound index: most queries filter by owner + sort by createdAt
documentSchema.index({ owner: 1, createdAt: -1 });
documentSchema.index({ owner: 1, status: 1 });

// Strip internal fields from JSON output
documentSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: unknown, ret: any) => {
    delete ret.__v;
    return ret;
  },
});

const DocumentModel = mongoose.model<IDocument>('Document', documentSchema);
export default DocumentModel;

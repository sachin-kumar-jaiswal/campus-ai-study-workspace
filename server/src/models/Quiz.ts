import mongoose, { Schema, Types } from 'mongoose';
import type { GeneratedQuizQuestion } from '../services/ai/aiService';

export interface IQuizAttempt {
  answers: number[];
  score: number;
  completedAt: Date;
}

export interface IQuiz extends mongoose.Document {
  owner: Types.ObjectId;
  title: string;
  sourceLabel: string;
  document?: Types.ObjectId;
  questions: GeneratedQuizQuestion[];
  attempts: IQuizAttempt[];
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<GeneratedQuizQuestion>(
  {
    prompt: { type: String, required: true },
    options: { type: [String], required: true, validate: (v: string[]) => v.length === 4 },
    correctIndex: { type: Number, required: true, min: 0, max: 3 },
    explanation: { type: String, required: true },
  },
  { _id: false }
);

const attemptSchema = new Schema<IQuizAttempt>(
  {
    answers: { type: [Number], required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    completedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const quizSchema = new Schema<IQuiz>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    sourceLabel: { type: String, required: true, trim: true, maxlength: 300 },
    document: { type: Schema.Types.ObjectId, ref: 'Document' },
    questions: { type: [questionSchema], required: true },
    attempts: { type: [attemptSchema], default: [] },
  },
  { timestamps: true }
);

quizSchema.index({ owner: 1, createdAt: -1 });

export default mongoose.model<IQuiz>('Quiz', quizSchema);

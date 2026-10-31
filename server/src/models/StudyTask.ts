import mongoose, { Schema, Types } from 'mongoose';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface IStudyTask extends mongoose.Document {
  owner: Types.ObjectId;
  title: string;
  subject: string;
  dueDate: Date;
  durationMinutes: number;
  priority: TaskPriority;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const studyTaskSchema = new Schema<IStudyTask>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    subject: { type: String, trim: true, maxlength: 100, default: '' },
    dueDate: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, min: 5, max: 480 },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

studyTaskSchema.index({ owner: 1, dueDate: 1 });
studyTaskSchema.index({ owner: 1, completed: 1, completedAt: 1 });

export default mongoose.model<IStudyTask>('StudyTask', studyTaskSchema);

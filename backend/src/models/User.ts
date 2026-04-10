import mongoose, { Schema, Document, Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;  
  email: string;
  password: string;
  authProvider: 'local' | 'google';
  googleId?: string;
  companyName: string;
  companyLogo?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  companyPhone2?: string;
  companyId?: string;
  createdAt: Date;
  updatedAt: Date;
  invoiceCounter?: number;
  monthlyDocumentLimit?: number;
  hasChangedPassword: boolean;
  hasAcceptedTerms: boolean;
  isAdmin?: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  googleId: { type: String, default: '' },
  companyName: { type: String, default: ''},
  companyLogo: { type: String, default: '' },
  companyAddress: { type: String, default: '' },
  companyPhone: { type: String, default: '' },
  companyEmail: { type: String, default: '' },
  companyWebsite: { type: String, default: '' },
  companyPhone2: { type: String, default: '' },
  companyId: { type: String, default: '' },
  invoiceCounter: { type: Number, default: 1 },
  monthlyDocumentLimit: { type: Number, default: 5, min: 1 },
  hasChangedPassword: { type: Boolean, default: false },
  hasAcceptedTerms: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
}, {
  timestamps: true,
});

userSchema.pre<IUser>('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next();
  }
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

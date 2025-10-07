import mongoose from 'mongoose';

const entrySchema = new mongoose.Schema({
  date: { type: Date, required: true }, // travel or record date
  route: { type: String, required: true },
  km: { type: Number, required: true },
  rupee: { type: Number, required: true },
  petrolFillDate: { type: Date, required: false }, // optional
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Entry', entrySchema);
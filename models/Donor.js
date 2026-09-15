import mongoose from 'mongoose';

const donorSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      default: '',
      trim: true,
    },

    email: {
      type: String,
      default: '',
      lowercase: true,
      trim: true,
    },

    address: {
      type: String,
      default: '',
      trim: true,
    },

    city: {
      type: String,
      default: '',
      trim: true,
    },

    notes: {
      type: String,
      default: '',
      trim: true,
    },

    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

donorSchema.index({
  organizationId: 1,
  createdAt: -1,
});

donorSchema.index({
  organizationId: 1,
  name: 1,
});

const Donor =
  mongoose.models.Donor ||
  mongoose.model('Donor', donorSchema);

export default Donor;
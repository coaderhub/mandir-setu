import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donor',
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    donationDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },

    financialYear: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: [
        'cash',
        'upi',
        'bank_transfer',
        'cheque',
        'card',
        'other',
      ],
      required: true,
      default: 'cash',
    },

    receiptNumber: {
      type: String,
      default: '',
      trim: true,
    },

    referenceNumber: {
      type: String,
      default: '',
      trim: true,
    },

    purpose: {
      type: String,
      default: 'General Donation',
      trim: true,
    },

    notes: {
      type: String,
      default: '',
      trim: true,
    },

    status: {
      type: String,
      enum: ['active', 'voided'],
      default: 'active',
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    voidedAt: {
      type: Date,
      default: null,
    },

    voidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    voidReason: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

donationSchema.index({
  organizationId: 1,
  donationDate: -1,
});

donationSchema.index({
  organizationId: 1,
  financialYear: 1,
});

donationSchema.index({
  organizationId: 1,
  donorId: 1,
  donationDate: -1,
});

donationSchema.index({
  organizationId: 1,
  status: 1,
});

const Donation =
  mongoose.models.Donation ||
  mongoose.model(
    'Donation',
    donationSchema
  );

export default Donation;
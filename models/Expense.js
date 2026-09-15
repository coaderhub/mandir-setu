import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    expenseDate: {
      type: Date,
      required: true,
    },

    financialYear: {
      type: String,
      required: true,
      index: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: '',
      trim: true,
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

    referenceNumber: {
      type: String,
      default: '',
      trim: true,
    },

    vendorName: {
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

expenseSchema.index({
  organizationId: 1,
  financialYear: 1,
});

expenseSchema.index({
  organizationId: 1,
  status: 1,
  expenseDate: -1,
});

expenseSchema.index({
  organizationId: 1,
  category: 1,
});

const Expense =
  mongoose.models.Expense ||
  mongoose.model('Expense', expenseSchema);

export default Expense;
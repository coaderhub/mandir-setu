import mongoose from 'mongoose';

const openingBalanceSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    financialYear: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    notes: {
      type: String,
      default: '',
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * One opening balance per organization
 * per financial year.
 */
openingBalanceSchema.index(
  {
    organizationId: 1,
    financialYear: 1,
  },
  {
    unique: true,
  }
);

const OpeningBalance =
  mongoose.models.OpeningBalance ||
  mongoose.model(
    'OpeningBalance',
    openingBalanceSchema
  );

export default OpeningBalance;
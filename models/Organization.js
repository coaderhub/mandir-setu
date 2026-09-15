import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    logo: {
      type: String,
      default: '',
    },

    description: {
      type: String,
      default: '',
    },

    address: {
      type: String,
      default: '',
    },

    city: {
      type: String,
      default: '',
    },

    state: {
      type: String,
      default: '',
    },

    country: {
      type: String,
      default: 'India',
    },

    phone: {
      type: String,
      default: '',
    },

    email: {
      type: String,
      default: '',
    },

    publicSettings: {
      showDonations: {
        type: Boolean,
        default: true,
      },

      showDonorNames: {
        type: Boolean,
        default: false,
      },

      showDonationAmounts: {
        type: Boolean,
        default: false,
      },

      showBalance: {
        type: Boolean,
        default: false,
      },
    },

    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

const Organization =
  mongoose.models.Organization ||
  mongoose.model(
    'Organization',
    organizationSchema
  );

export default Organization;
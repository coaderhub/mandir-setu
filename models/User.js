import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ['admin', 'cashier'],
      required: true,
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    phone: {
      type: String,
      default: '',
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

userSchema.index(
  {
    email: 1,
    organizationId: 1,
  },
  {
    unique: true,
  }
);

const User =
  mongoose.models.User ||
  mongoose.model('User', userSchema);

export default User;
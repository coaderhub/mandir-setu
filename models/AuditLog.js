import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },

    action: {
      type: String,
      required: true,
      enum: [
        'CREATE',
        'UPDATE',
        'VOID',
        'ARCHIVE',
        'RESTORE',
        'LOGIN',
        'LOGOUT',
        'SETTINGS_UPDATE',
        'OPENING_BALANCE_CREATE',
        'OPENING_BALANCE_UPDATE',
      ],
      index: true,
    },

    module: {
      type: String,
      required: true,
      enum: [
        'auth',
        'organization',
        'user',
        'donor',
        'donation',
        'expense',
        'opening_balance',
        'settings',
      ],
      index: true,
    },

    recordId: {
      type: String,
      default: '',
      index: true,
    },

    description: {
      type: String,
      default: '',
      trim: true,
    },

    oldValues: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    newValues: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    reason: {
      type: String,
      default: '',
      trim: true,
    },

    ipAddress: {
      type: String,
      default: '',
      trim: true,
    },

    userAgent: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Organization + date
 * Useful for audit-log listing/reporting.
 */
auditLogSchema.index({
  organizationId: 1,
  createdAt: -1,
});

/*
 * Organization + module + date
 */
auditLogSchema.index({
  organizationId: 1,
  module: 1,
  createdAt: -1,
});

/*
 * Organization + action + date
 */
auditLogSchema.index({
  organizationId: 1,
  action: 1,
  createdAt: -1,
});

/*
 * Organization + record
 */
auditLogSchema.index({
  organizationId: 1,
  recordId: 1,
  createdAt: -1,
});

const AuditLog =
  mongoose.models.AuditLog ||
  mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
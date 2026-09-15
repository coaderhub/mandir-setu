import AuditLog from '@/models/AuditLog';
import { connectDB } from '@/lib/mongodb';

export async function createAuditLog({
  organizationId,
  userId = null,
  action,
  module,
  recordId = '',
  description = '',
  oldValues = null,
  newValues = null,
  reason = '',
  ipAddress = '',
  userAgent = '',
}) {
  if (!organizationId) {
    throw new Error(
      'organizationId is required for audit log'
    );
  }

  if (!action) {
    throw new Error(
      'action is required for audit log'
    );
  }

  if (!module) {
    throw new Error(
      'module is required for audit log'
    );
  }

  await connectDB();

  const auditLog = await AuditLog.create({
    organizationId,
    userId,
    action,
    module,
    recordId:
      recordId !== undefined &&
      recordId !== null
        ? String(recordId)
        : '',
    description,
    oldValues,
    newValues,
    reason,
    ipAddress,
    userAgent,
  });

  return auditLog;
}
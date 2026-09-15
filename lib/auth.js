import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in .env.local');
}

export function createAuthToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      organizationId: user.organizationId.toString(),
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: '7d',
    }
  );
}

export function verifyAuthToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function getAuthSession() {
  const cookieStore = await cookies();

  const token = cookieStore.get('temple_auth')?.value;

  if (!token) {
    return null;
  }

  return verifyAuthToken(token);
}

export async function requireAuth() {
  const session = await getAuthSession();

  if (!session?.userId || !session?.organizationId) {
    return null;
  }

  return session;
}

export function hasRole(session, roles = []) {
  if (!session?.role) {
    return false;
  }

  return roles.includes(session.role);
}

export async function requireRole(roles = []) {
  const session = await requireAuth();

  if (!session) {
    return {
      authorized: false,
      status: 401,
      session: null,
      message: 'Authentication required',
    };
  }

  if (!hasRole(session, roles)) {
    return {
      authorized: false,
      status: 403,
      session,
      message:
        'You do not have permission to perform this action',
    };
  }

  return {
    authorized: true,
    status: 200,
    session,
    message: null,
  };
}

export function unauthorizedResponse() {
  return {
    success: false,
    message: 'Authentication required',
  };
}

export function forbiddenResponse() {
  return {
    success: false,
    message:
      'You do not have permission to perform this action',
  };
}
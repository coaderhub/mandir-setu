import { NextResponse } from 'next/server';

import {
  requireAuth,
  requireRole,
} from '@/lib/auth';

export async function GET() {
  try {
    const session = await requireAuth();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: 'Not authenticated',
        },
        {
          status: 401,
        }
      );
    }

    const adminSession = await requireRole([
      'admin',
    ]);

    return NextResponse.json({
      success: true,

      authentication: {
        authenticated: true,
      },

      user: {
        id: session.userId,
        organizationId: session.organizationId,
        role: session.role,
      },

      permissions: {
        isAdmin: Boolean(adminSession),
      },
    });
  } catch (error) {
    console.error(
      'Authorization check error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Authorization check failed',
      },
      {
        status: 500,
      }
    );
  }
}
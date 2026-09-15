import { NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function POST(request) {
  try {
    /*
     * Get the currently authenticated user
     * before removing the authentication cookie.
     */
    const session =
      await requireAuth();

    /*
     * Capture request information
     * for the audit log.
     */
    const forwardedFor =
      request.headers.get(
        'x-forwarded-for'
      );

    const realIp =
      request.headers.get(
        'x-real-ip'
      );

    const ipAddress =
      forwardedFor
        ?.split(',')[0]
        ?.trim() ||
      realIp ||
      '';

    const userAgent =
      request.headers.get(
        'user-agent'
      ) || '';

    /*
     * Create logout audit log only when
     * a valid authenticated session exists.
     *
     * If the session is already expired,
     * logout should still succeed.
     */
    if (
      session?.userId &&
      session?.organizationId
    ) {
      try {
        await createAuditLog({
          organizationId:
            session.organizationId,

          userId:
            session.userId,

          action:
            'LOGOUT',

          module:
            'auth',

          recordId:
            session.userId,

          description:
            'User logged out',

          oldValues:
            null,

          newValues: {
            userId:
              session.userId,

            role:
              session.role,
          },

          ipAddress,

          userAgent,
        });
      } catch (auditError) {
        /*
         * Do not prevent logout if audit logging
         * happens to fail.
         */
        console.error(
          'Logout audit log error:',
          auditError
        );
      }
    }

    /*
     * Clear authentication cookie.
     */
    const response =
      NextResponse.json({
        success: true,
        message:
          'Logout successful',
      });

    response.cookies.set({
      name:
        'temple_auth',

      value:
        '',

      httpOnly:
        true,

      secure:
        process.env.NODE_ENV ===
        'production',

      sameSite:
        'lax',

      path:
        '/',

      maxAge:
        0,
    });

    return response;
  } catch (error) {
    console.error(
      'Logout error:',
      error
    );

    /*
     * Even if session/audit processing
     * fails, clear the cookie.
     */
    const response =
      NextResponse.json({
        success: true,
        message:
          'Logout successful',
      });

    response.cookies.set({
      name:
        'temple_auth',

      value:
        '',

      httpOnly:
        true,

      secure:
        process.env.NODE_ENV ===
        'production',

      sameSite:
        'lax',

      path:
        '/',

      maxAge:
        0,
    });

    return response;
  }
}
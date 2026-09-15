import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { createAuthToken } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function POST(request) {
  try {
    await connectDB();

    const body =
      await request.json();

    const {
      email,
      password,
    } = body;

    if (
      !email ||
      !password
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Email and password are required',
        },
        {
          status: 400,
        }
      );
    }

    const normalizedEmail =
      email
        .toLowerCase()
        .trim();

    /*
     * Find user by email.
     */
    const user =
      await User.findOne({
        email:
          normalizedEmail,
      });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid email or password',
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Check account status.
     */
    if (
      user.status !== 'active'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Your account is inactive',
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Verify password.
     */
    const isPasswordValid =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid email or password',
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Create authentication token.
     */
    const token =
      createAuthToken(user);

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
     * Create LOGIN audit log.
     *
     * Password and JWT token are
     * intentionally NOT stored.
     */
    await createAuditLog({
      organizationId:
        user.organizationId,

      userId:
        user._id,

      action:
        'LOGIN',

      module:
        'auth',

      recordId:
        user._id.toString(),

      description:
        `User "${user.name}" logged in`,

      oldValues:
        null,

      newValues: {
        userId:
          user._id.toString(),

        email:
          user.email,

        role:
          user.role,

        status:
          user.status,
      },

      ipAddress,

      userAgent,
    });

    const response =
      NextResponse.json({
        success: true,

        message:
          'Login successful',

        data: {
          user: {
            id:
              user._id,

            name:
              user.name,

            email:
              user.email,

            role:
              user.role,

            organizationId:
              user.organizationId,

            phone:
              user.phone,

            status:
              user.status,
          },
        },
      });

    /*
     * Set authentication cookie.
     */
    response.cookies.set({
      name:
        'temple_auth',

      value:
        token,

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
        60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error(
      'Login error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Login failed',
        error:
          error.message,
      },
      {
        status: 500,
      }
    );
  }
}
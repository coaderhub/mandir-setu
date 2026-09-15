import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuthToken } from '@/lib/auth';

export async function GET() {
  try {
    await connectDB();

    const cookieStore = await cookies();

    const token = cookieStore.get('temple_auth')?.value;

    if (!token) {
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

    const payload = verifyAuthToken(token);

    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or expired session',
        },
        {
          status: 401,
        }
      );
    }

    const user = await User.findOne({
	  _id: payload.userId,
	  organizationId: payload.organizationId,
	}).lean();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        {
          status: 401,
        }
      );
    }

    if (user.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          message: 'User account is inactive',
        },
        {
          status: 403,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
          phone: user.phone,
          status: user.status,
        },
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Authentication check failed',
      },
      {
        status: 500,
      }
    );
  }
}
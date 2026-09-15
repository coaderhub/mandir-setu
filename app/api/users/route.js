import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Organization from '@/models/Organization';
import { requireRole } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

function getRequestMeta(request) {
  const forwardedFor =
    request.headers.get('x-forwarded-for');

  const realIp =
    request.headers.get('x-real-ip');

  const ipAddress =
    forwardedFor?.split(',')[0]?.trim() ||
    realIp ||
    '';

  const userAgent =
    request.headers.get('user-agent') || '';

  return {
    ipAddress,
    userAgent,
  };
}

/**
 * GET USERS
 */
export async function GET() {
  try {
    const auth = await requireRole([
      'admin',
    ]);

    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: auth.message,
        },
        {
          status: auth.status,
        }
      );
    }

    const session = auth.session;

    await connectDB();

    const users = await User.find({
      organizationId:
        session.organizationId,
    })
      .select('-password')
      .sort({
        createdAt: -1,
      })
      .lean();

    return NextResponse.json({
      success: true,
      data: users.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId:
          user.organizationId.toString(),
        phone: user.phone || '',
        status:
          user.status || 'active',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    });
  } catch (error) {
    console.error(
      'Users fetch error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch users',
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * CREATE USER
 */
export async function POST(request) {
  try {
    const auth = await requireRole([
      'admin',
    ]);

    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: auth.message,
        },
        {
          status: auth.status,
        }
      );
    }

    const session = auth.session;

    await connectDB();

    const body =
      await request.json();

    const {
      name,
      email,
      password,
      role,
      phone = '',
    } = body;

    if (
      !name?.trim() ||
      !email?.trim() ||
      !password ||
      !role
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Name, email, password and role are required',
        },
        {
          status: 400,
        }
      );
    }

    if (
      !['admin', 'cashier'].includes(
        role
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid user role',
        },
        {
          status: 400,
        }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Password must be at least 8 characters',
        },
        {
          status: 400,
        }
      );
    }

    const organization =
      await Organization.findById(
        session.organizationId
      );

    if (!organization) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Organization not found',
        },
        {
          status: 404,
        }
      );
    }

    if (
      organization.status &&
      organization.status !== 'active'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Organization is inactive',
        },
        {
          status: 403,
        }
      );
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
        organizationId:
          session.organizationId,
      });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            'User already exists in this organization',
        },
        {
          status: 409,
        }
      );
    }

    const passwordHash =
      await bcrypt.hash(
        password,
        12
      );

    const user =
      await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: passwordHash,
        role,
        organizationId:
          session.organizationId,
        phone:
          phone?.trim() || '',
        status: 'active',
      });

    /*
     * AUDIT LOG
     */
    const {
      ipAddress,
      userAgent,
    } =
      getRequestMeta(request);

    try {
      await createAuditLog({
        organizationId:
          session.organizationId,

        userId:
          session.userId,

        action: 'CREATE',

        module: 'user',

        recordId:
          user._id.toString(),

        description:
          `Created user "${user.name}"`,

        oldValues: null,

        newValues: {
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          status: user.status,
        },

        reason: '',

        ipAddress,

        userAgent,
      });
    } catch (auditError) {
      /*
       * Do not fail user creation
       * because audit logging failed.
       *
       * But always log the error
       * in server console.
       */
      console.error(
        'USER CREATE AUDIT ERROR:',
        auditError
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          'User created successfully',
        data: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId:
            user.organizationId.toString(),
          phone: user.phone,
          status: user.status,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      'User creation error:',
      error
    );

    if (error?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message:
            'A user with this email already exists in this organization',
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to create user',
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * UPDATE USER
 */
export async function PATCH(request) {
  try {
    const auth = await requireRole([
      'admin',
    ]);

    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: auth.message,
        },
        {
          status: auth.status,
        }
      );
    }

    const session = auth.session;

    await connectDB();

    const body =
      await request.json();

    const {
      id,
      name,
      email,
      role,
      phone,
      status,
      password,
    } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            'User ID is required',
        },
        {
          status: 400,
        }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid user ID',
        },
        {
          status: 400,
        }
      );
    }

    const user =
      await User.findOne({
        _id: id,
        organizationId:
          session.organizationId,
      });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            'User not found',
        },
        {
          status: 404,
        }
      );
    }

    const oldValues = {
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      status:
        user.status || 'active',
    };

    if (
      name !== undefined &&
      !name?.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Name cannot be empty',
        },
        {
          status: 400,
        }
      );
    }

    if (
      role !== undefined &&
      !['admin', 'cashier'].includes(
        role
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid user role',
        },
        {
          status: 400,
        }
      );
    }

    if (
      status !== undefined &&
      !['active', 'inactive'].includes(
        status
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid user status',
        },
        {
          status: 400,
        }
      );
    }

    if (
      password !== undefined &&
      password !== '' &&
      password.length < 8
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Password must be at least 8 characters',
        },
        {
          status: 400,
        }
      );
    }

    if (email !== undefined) {
      const normalizedEmail =
        email.toLowerCase().trim();

      if (!normalizedEmail) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Email cannot be empty',
          },
          {
            status: 400,
          }
        );
      }

      const existingUser =
        await User.findOne({
          email: normalizedEmail,
          organizationId:
            session.organizationId,
          _id: {
            $ne: id,
          },
        });

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Another user with this email already exists in this organization',
          },
          {
            status: 409,
          }
        );
      }

      user.email =
        normalizedEmail;
    }

    if (name !== undefined) {
      user.name =
        name.trim();
    }

    if (role !== undefined) {
      user.role = role;
    }

    if (phone !== undefined) {
      user.phone =
        phone?.trim() || '';
    }

    if (status !== undefined) {
      user.status = status;
    }

    let passwordChanged = false;

    if (
      password !== undefined &&
      password !== ''
    ) {
      user.password =
        await bcrypt.hash(
          password,
          12
        );

      passwordChanged = true;
    }

    await user.save();

    const newValues = {
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      status:
        user.status || 'active',
    };

    let auditDescription =
      `Updated user "${user.name}"`;

    if (passwordChanged) {
      auditDescription +=
        ' and changed password';
    }

    if (
      oldValues.role !==
      newValues.role
    ) {
      auditDescription +=
        ` and changed role from "${oldValues.role}" to "${newValues.role}"`;
    }

    if (
      oldValues.status !==
      newValues.status
    ) {
      auditDescription +=
        ` and changed status from "${oldValues.status}" to "${newValues.status}"`;
    }

    const {
      ipAddress,
      userAgent,
    } =
      getRequestMeta(request);

    /*
     * AUDIT LOG
     */
    try {
      await createAuditLog({
        organizationId:
          session.organizationId,

        userId:
          session.userId,

        action: 'UPDATE',

        module: 'user',

        recordId:
          user._id.toString(),

        description:
          auditDescription,

        oldValues,

        newValues,

        reason: '',

        ipAddress,

        userAgent,
      });
    } catch (auditError) {
      console.error(
        'USER UPDATE AUDIT ERROR:',
        auditError
      );
    }

    return NextResponse.json({
      success: true,
      message:
        'User updated successfully',
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId:
          user.organizationId.toString(),
        phone: user.phone || '',
        status:
          user.status || 'active',
      },
    });
  } catch (error) {
    console.error(
      'User update error:',
      error
    );

    if (error?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message:
            'A user with this email already exists in this organization',
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to update user',
      },
      {
        status: 500,
      }
    );
  }
}
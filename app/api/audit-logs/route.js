import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

import { connectDB } from '@/lib/mongodb';
import { requireRole } from '@/lib/auth';
import AuditLog from '@/models/AuditLog';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const access = await requireRole(['admin']);

    if (!access.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: access.message,
        },
        {
          status: access.status,
        }
      );
    }

    await connectDB();

    const { session } = access;

    const { searchParams } = new URL(
      request.url
    );

    const search =
      searchParams.get('search')?.trim() || '';

    const action =
      searchParams.get('action')?.trim() || '';

    const module =
      searchParams.get('module')?.trim() || '';

    const userId =
      searchParams.get('userId')?.trim() || '';

    const pageParam =
      Number(searchParams.get('page')) || 1;

    const limitParam =
      Number(searchParams.get('limit')) || 25;

    const page = Math.max(
      1,
      pageParam
    );

    const limit = Math.min(
      Math.max(1, limitParam),
      100
    );

    const query = {
      organizationId:
        new mongoose.Types.ObjectId(
          session.organizationId
        ),
    };

    if (action) {
      query.action = action;
    }

    if (module) {
      query.module = module;
    }

    if (userId) {
      if (
        mongoose.Types.ObjectId.isValid(userId)
      ) {
        query.userId =
          new mongoose.Types.ObjectId(
            userId
          );
      }
    }

    if (search) {
      query.$or = [
        {
          description: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          reason: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          recordId: {
            $regex: search,
            $options: 'i',
          },
        },
      ];
    }

    const skip =
      (page - 1) * limit;

    const [
      logs,
      total,
      users,
    ] = await Promise.all([
      AuditLog.find(query)
        .populate({
          path: 'userId',
          select: 'name email role',
        })
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      AuditLog.countDocuments(query),

      User.find({
        organizationId:
          new mongoose.Types.ObjectId(
            session.organizationId
          ),
      })
        .select(
          '_id name email role'
        )
        .sort({
          name: 1,
        })
        .lean(),
    ]);

    const serializedLogs =
      logs.map((log) => ({
        id: log._id.toString(),

        action: log.action,

        module: log.module,

        recordId:
          log.recordId || '',

        description:
          log.description || '',

        reason:
          log.reason || '',

        oldValues:
          log.oldValues || null,

        newValues:
          log.newValues || null,

        ipAddress:
          log.ipAddress || '',

        userAgent:
          log.userAgent || '',

        createdAt:
          log.createdAt,

        user: log.userId
          ? {
              id: log.userId._id.toString(),
              name:
                log.userId.name,
              email:
                log.userId.email,
              role:
                log.userId.role,
            }
          : null,
      }));

    return NextResponse.json({
      success: true,

      data: {
        logs: serializedLogs,

        users: users.map(
          (user) => ({
            id:
              user._id.toString(),
            name:
              user.name,
            email:
              user.email,
            role:
              user.role,
          })
        ),

        pagination: {
          page,
          limit,
          total,
          totalPages:
            Math.ceil(
              total / limit
            ),
        },
      },
    });
  } catch (error) {
    console.error(
      'Audit logs GET error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to load audit logs',
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}
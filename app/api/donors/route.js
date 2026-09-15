import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/mongodb';
import Donor from '@/models/Donor';
import { requireAuth } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(request) {
  try {
    const session = await requireAuth();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required',
        },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } =
      new URL(request.url);

    const search =
      searchParams.get('search')?.trim() || '';

    const status =
      searchParams.get('status') || 'active';

    const query = {
      organizationId:
        session.organizationId,
    };

    if (
      status === 'active' ||
      status === 'archived'
    ) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        {
          name: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          phone: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          email: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          city: {
            $regex: search,
            $options: 'i',
          },
        },
      ];
    }

    const donors =
      await Donor.find(query)
        .sort({
          createdAt: -1,
        })
        .lean();

    return NextResponse.json({
      success: true,

      data: donors.map((donor) => ({
        id: donor._id.toString(),

        organizationId:
          donor.organizationId.toString(),

        name: donor.name,

        phone:
          donor.phone || '',

        email:
          donor.email || '',

        address:
          donor.address || '',

        city:
          donor.city || '',

        notes:
          donor.notes || '',

        status:
          donor.status || 'active',

        createdAt:
          donor.createdAt,

        updatedAt:
          donor.updatedAt,
      })),
    });
  } catch (error) {
    console.error(
      'Donors fetch error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch donors',
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await requireAuth();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required',
        },
        { status: 401 }
      );
    }

    await connectDB();

    const body =
      await request.json();

    const {
      name,
      phone = '',
      email = '',
      address = '',
      city = '',
      notes = '',
    } = body;

    if (
      !name ||
      !name.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Donor name is required',
        },
        { status: 400 }
      );
    }

    const donor =
      await Donor.create({
        organizationId:
          session.organizationId,

        name:
          name.trim(),

        phone:
          typeof phone === 'string'
            ? phone.trim()
            : '',

        email:
          typeof email === 'string'
            ? email.trim().toLowerCase()
            : '',

        address:
          typeof address === 'string'
            ? address.trim()
            : '',

        city:
          typeof city === 'string'
            ? city.trim()
            : '',

        notes:
          typeof notes === 'string'
            ? notes.trim()
            : '',

        status: 'active',
      });

    await createAuditLog({
      organizationId:
        session.organizationId,

      userId:
        session.userId,

      action: 'CREATE',

      module: 'donor',

      recordId:
        donor._id.toString(),

      description:
        `Created donor "${donor.name}"`,

      oldValues: null,

      newValues: {
        name: donor.name,
        phone: donor.phone,
        email: donor.email,
        address: donor.address,
        city: donor.city,
        notes: donor.notes,
        status: donor.status,
      },
    });

    return NextResponse.json(
      {
        success: true,

        message:
          'Donor created successfully',

        data: {
          id:
            donor._id.toString(),

          organizationId:
            donor.organizationId.toString(),

          name:
            donor.name,

          phone:
            donor.phone,

          email:
            donor.email,

          address:
            donor.address,

          city:
            donor.city,

          notes:
            donor.notes,

          status:
            donor.status,

          createdAt:
            donor.createdAt,

          updatedAt:
            donor.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      'Donor creation error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to create donor',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const session = await requireAuth();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required',
        },
        {
          status: 401,
        }
      );
    }

    await connectDB();

    const body =
      await request.json();

    const {
      id,
      name,
      phone,
      email,
      address,
      city,
      notes,
      status,
    } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Donor ID is required',
        },
        {
          status: 400,
        }
      );
    }

    if (
      status !== undefined &&
      !['active', 'archived'].includes(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid donor status',
        },
        {
          status: 400,
        }
      );
    }

    if (
      name !== undefined &&
      !String(name).trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Donor name is required',
        },
        {
          status: 400,
        }
      );
    }

    const donor =
      await Donor.findOne({
        _id: id,
        organizationId:
          session.organizationId,
      });

    if (!donor) {
      return NextResponse.json(
        {
          success: false,
          message: 'Donor not found',
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Capture the original donor state
     * before making any changes.
     */
    const oldValues = {
      name: donor.name,
      phone: donor.phone,
      email: donor.email,
      address: donor.address,
      city: donor.city,
      notes: donor.notes,
      status: donor.status,
    };

    const previousStatus =
      donor.status;

    const updateData = {};

    if (name !== undefined) {
      updateData.name =
        String(name).trim();
    }

    if (phone !== undefined) {
      updateData.phone =
        String(phone).trim();
    }

    if (email !== undefined) {
      updateData.email =
        String(email)
          .trim()
          .toLowerCase();
    }

    if (address !== undefined) {
      updateData.address =
        String(address).trim();
    }

    if (city !== undefined) {
      updateData.city =
        String(city).trim();
    }

    if (notes !== undefined) {
      updateData.notes =
        String(notes).trim();
    }

    if (status !== undefined) {
      updateData.status =
        status;
    }

    if (
      Object.keys(updateData).length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'No changes provided',
        },
        {
          status: 400,
        }
      );
    }

    Object.assign(
      donor,
      updateData
    );

    await donor.save();

    /*
     * Determine the correct audit action.
     */
    let auditAction = 'UPDATE';

    let auditDescription =
      `Updated donor "${donor.name}"`;

    let auditReason = '';

    if (
      status === 'archived' &&
      previousStatus !== 'archived'
    ) {
      auditAction = 'ARCHIVE';

      auditDescription =
        `Archived donor "${donor.name}"`;
    }

    if (
      status === 'active' &&
      previousStatus === 'archived'
    ) {
      auditAction = 'RESTORE';

      auditDescription =
        `Restored donor "${donor.name}"`;
    }

    const newValues = {
      name: donor.name,
      phone: donor.phone,
      email: donor.email,
      address: donor.address,
      city: donor.city,
      notes: donor.notes,
      status: donor.status,
    };

    await createAuditLog({
      organizationId:
        session.organizationId,

      userId:
        session.userId,

      action:
        auditAction,

      module: 'donor',

      recordId:
        donor._id.toString(),

      description:
        auditDescription,

      oldValues,

      newValues,

      reason:
        auditReason,
    });

    return NextResponse.json({
      success: true,

      message:
        status === 'archived'
          ? 'Donor archived successfully'
          : status === 'active'
            ? 'Donor restored successfully'
            : 'Donor updated successfully',

      data: {
        id:
          donor._id.toString(),

        name:
          donor.name,

        phone:
          donor.phone || '',

        email:
          donor.email || '',

        address:
          donor.address || '',

        city:
          donor.city || '',

        notes:
          donor.notes || '',

        status:
          donor.status,

        createdAt:
          donor.createdAt,

        updatedAt:
          donor.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      'Donor update error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to update donor',
      },
      {
        status: 500,
      }
    );
  }
}
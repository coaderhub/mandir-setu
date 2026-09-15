import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

import { connectDB } from '@/lib/mongodb';
import { requireAuth, requireRole } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

import Donation from '@/models/Donation';
import Donor from '@/models/Donor';

export const dynamic = 'force-dynamic';

function getCurrentFinancialYear(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  if (month >= 4) {
    return `${year}-${String(
      (year + 1) % 100
    ).padStart(2, '0')}`;
  }

  return `${year - 1}-${String(
    year % 100
  ).padStart(2, '0')}`;
}

function serializeDonation(donation) {
  return {
    id: donation._id.toString(),

    amount: donation.amount,

    donationDate:
      donation.donationDate,

    financialYear:
      donation.financialYear,

    paymentMethod:
      donation.paymentMethod,

    receiptNumber:
      donation.receiptNumber || '',

    referenceNumber:
      donation.referenceNumber || '',

    purpose:
      donation.purpose || '',

    notes:
      donation.notes || '',

    status:
      donation.status,

    voidedAt:
      donation.voidedAt || null,

    voidReason:
      donation.voidReason || '',

    donor: donation.donorId
      ? {
          id: donation.donorId._id.toString(),
          name:
            donation.donorId.name,
          phone:
            donation.donorId.phone || '',
          email:
            donation.donorId.email || '',
        }
      : null,

    createdBy: donation.createdBy
      ? {
          id:
            donation.createdBy._id.toString(),
          name:
            donation.createdBy.name,
          email:
            donation.createdBy.email,
        }
      : null,

    createdAt:
      donation.createdAt,

    updatedAt:
      donation.updatedAt,
  };
}

export async function GET(request) {
  try {
    const session =
      await requireAuth();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Authentication required',
        },
        {
          status: 401,
        }
      );
    }

    await connectDB();

    const { searchParams } =
      new URL(request.url);

    const search =
      searchParams.get(
        'search'
      )?.trim() || '';

    const status =
      searchParams.get(
        'status'
      )?.trim() || 'active';

    const financialYear =
      searchParams.get(
        'financialYear'
      )?.trim() || '';

    const paymentMethod =
      searchParams.get(
        'paymentMethod'
      )?.trim() || '';

    const donorId =
      searchParams.get(
        'donorId'
      )?.trim() || '';

    const organizationId =
      new mongoose.Types.ObjectId(
        session.organizationId
      );

    const query = {
      organizationId,
    };

    if (
      status === 'active' ||
      status === 'voided'
    ) {
      query.status = status;
    }

    if (financialYear) {
      query.financialYear =
        financialYear;
    }

    if (paymentMethod) {
      query.paymentMethod =
        paymentMethod;
    }

    if (
      donorId &&
      mongoose.Types.ObjectId.isValid(
        donorId
      )
    ) {
      query.donorId =
        new mongoose.Types.ObjectId(
          donorId
        );
    }

    if (search) {
      const donors =
        await Donor.find({
          organizationId,
          $or: [
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
          ],
        })
          .select('_id')
          .lean();

      const donorIds =
        donors.map(
          (donor) => donor._id
        );

      query.$or = [
        {
          receiptNumber: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          referenceNumber: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          purpose: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          notes: {
            $regex: search,
            $options: 'i',
          },
        },
      ];

      if (donorIds.length > 0) {
        query.$or.push({
          donorId: {
            $in: donorIds,
          },
        });
      }
    }

    const donations =
      await Donation.find(query)
        .populate({
          path: 'donorId',
          select:
            'name phone email',
        })
        .populate({
          path: 'createdBy',
          select:
            'name email',
        })
        .sort({
          donationDate: -1,
          createdAt: -1,
        })
        .lean();

    const activeQuery = {
      ...query,
      status: 'active',
    };

    const summary =
      await Donation.aggregate([
        {
          $match:
            activeQuery,
        },
        {
          $group: {
            _id: null,
            totalAmount: {
              $sum: '$amount',
            },
            count: {
              $sum: 1,
            },
          },
        },
      ]);

    const summaryData =
      summary[0] || {
        totalAmount: 0,
        count: 0,
      };

    return NextResponse.json({
      success: true,

      data: {
        donations:
          donations.map(
            serializeDonation
          ),

        summary: {
          totalAmount:
            summaryData.totalAmount ||
            0,

          count:
            summaryData.count ||
            0,
        },
      },
    });
  } catch (error) {
    console.error(
      'Donations GET error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to load donations',
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request) {
  try {
    const access =
      await requireRole([
        'admin',
        'cashier',
      ]);

    if (!access.authorized) {
      return NextResponse.json(
        {
          success: false,
          message:
            access.message,
        },
        {
          status: access.status,
        }
      );
    }

    await connectDB();

    const { session } =
      access;

    const body =
      await request.json();

    const {
      donorId,
      amount,
      donationDate,
      paymentMethod,
      receiptNumber,
      referenceNumber,
      purpose,
      notes,
    } = body;

    if (
      !donorId ||
      !mongoose.Types.ObjectId.isValid(
        donorId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Valid donor is required',
        },
        {
          status: 400,
        }
      );
    }

    const numericAmount =
      Number(amount);

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Donation amount must be greater than zero',
        },
        {
          status: 400,
        }
      );
    }

    if (!donationDate) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Donation date is required',
        },
        {
          status: 400,
        }
      );
    }

    const allowedPaymentMethods = [
      'cash',
      'upi',
      'bank_transfer',
      'cheque',
      'card',
      'other',
    ];

    const finalPaymentMethod =
      allowedPaymentMethods.includes(
        paymentMethod
      )
        ? paymentMethod
        : 'cash';

    const organizationId =
      new mongoose.Types.ObjectId(
        session.organizationId
      );

    const donor =
      await Donor.findOne({
        _id:
          new mongoose.Types.ObjectId(
            donorId
          ),
        organizationId,
      });

    if (!donor) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Donor not found',
        },
        {
          status: 404,
        }
      );
    }

    if (
      donor.status !== 'active'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Archived donors cannot receive new donations',
        },
        {
          status: 400,
        }
      );
    }

    const date =
      new Date(donationDate);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid donation date',
        },
        {
          status: 400,
        }
      );
    }

    const financialYear =
      getCurrentFinancialYear(
        date
      );

    const donation =
      await Donation.create({
        organizationId,

        donorId:
          donor._id,

        amount:
          numericAmount,

        donationDate:
          date,

        financialYear,

        paymentMethod:
          finalPaymentMethod,

        receiptNumber:
          receiptNumber
            ?.trim() || '',

        referenceNumber:
          referenceNumber
            ?.trim() || '',

        purpose:
          purpose?.trim() ||
          'General Donation',

        notes:
          notes?.trim() || '',

        status: 'active',

        createdBy:
          new mongoose.Types.ObjectId(
            session.userId
          ),
      });

    await createAuditLog({
      organizationId,

      userId:
        session.userId,

      action: 'CREATE',

      module: 'donation',

      recordId:
        donation._id.toString(),

      description:
        `Created donation of ₹${numericAmount.toLocaleString(
          'en-IN'
        )} from ${donor.name}`,

      oldValues: null,

      newValues: {
        amount:
          donation.amount,

        donationDate:
          donation.donationDate,

        financialYear:
          donation.financialYear,

        paymentMethod:
          donation.paymentMethod,

        receiptNumber:
          donation.receiptNumber,

        referenceNumber:
          donation.referenceNumber,

        purpose:
          donation.purpose,

        donorId:
          donor._id.toString(),

        donorName:
          donor.name,
      },
    });

    const populatedDonation =
      await Donation.findById(
        donation._id
      )
        .populate({
          path: 'donorId',
          select:
            'name phone email',
        })
        .populate({
          path: 'createdBy',
          select:
            'name email',
        })
        .lean();

    return NextResponse.json(
      {
        success: true,

        message:
          'Donation created successfully',

        data: {
          donation:
            serializeDonation(
              populatedDonation
            ),
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      'Donations POST error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to create donation',
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(request) {
  try {
    const access =
      await requireRole([
        'admin',
        'cashier',
      ]);

    if (!access.authorized) {
      return NextResponse.json(
        {
          success: false,
          message:
            access.message,
        },
        {
          status: access.status,
        }
      );
    }

    await connectDB();

    const { session } =
      access;

    const body =
      await request.json();

    const {
      id,
      status,
      voidReason,
    } = body;

    if (
      !id ||
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Valid donation ID is required',
        },
        {
          status: 400,
        }
      );
    }

    if (status !== 'voided') {
      return NextResponse.json(
        {
          success: false,
          message:
            'Only voiding donations is supported',
        },
        {
          status: 400,
        }
      );
    }

    if (
      !voidReason ||
      !voidReason.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Void reason is required',
        },
        {
          status: 400,
        }
      );
    }

    const organizationId =
      new mongoose.Types.ObjectId(
        session.organizationId
      );

    const donation =
      await Donation.findOne({
        _id:
          new mongoose.Types.ObjectId(
            id
          ),
        organizationId,
      })
        .populate({
          path: 'donorId',
          select:
            'name phone email',
        });

    if (!donation) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Donation not found',
        },
        {
          status: 404,
        }
      );
    }

    if (
      donation.status !==
      'active'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Donation is already voided',
        },
        {
          status: 400,
        }
      );
    }

    const oldValues = {
      amount:
        donation.amount,

      donationDate:
        donation.donationDate,

      financialYear:
        donation.financialYear,

      paymentMethod:
        donation.paymentMethod,

      receiptNumber:
        donation.receiptNumber,

      referenceNumber:
        donation.referenceNumber,

      purpose:
        donation.purpose,

      notes:
        donation.notes,

      status:
        donation.status,

      donorId:
        donation.donorId?._id?.toString(),

      donorName:
        donation.donorId?.name ||
        '',
    };

    donation.status =
      'voided';

    donation.voidedAt =
      new Date();

    donation.voidedBy =
      new mongoose.Types.ObjectId(
        session.userId
      );

    donation.voidReason =
      voidReason.trim();

    await donation.save();

    await createAuditLog({
      organizationId,

      userId:
        session.userId,

      action: 'VOID',

      module: 'donation',

      recordId:
        donation._id.toString(),

      description:
        `Voided donation of ₹${donation.amount.toLocaleString(
          'en-IN'
        )}`,

      oldValues,

      newValues: {
        amount:
          donation.amount,

        donationDate:
          donation.donationDate,

        financialYear:
          donation.financialYear,

        paymentMethod:
          donation.paymentMethod,

        receiptNumber:
          donation.receiptNumber,

        referenceNumber:
          donation.referenceNumber,

        purpose:
          donation.purpose,

        notes:
          donation.notes,

        status:
          donation.status,

        donorId:
          donation.donorId?._id?.toString(),

        donorName:
          donation.donorId?.name ||
          '',
      },

      reason:
        voidReason.trim(),
    });

    return NextResponse.json({
      success: true,

      message:
        'Donation voided successfully',

      data: {
        donation:
          serializeDonation(
            donation.toObject()
          ),
      },
    });
  } catch (error) {
    console.error(
      'Donations PATCH error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to update donation',
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}
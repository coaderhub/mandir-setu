import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/mongodb';
import { requireRole } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

import OpeningBalance from '@/models/OpeningBalance';

function getCurrentFinancialYear() {
  const now = new Date();

  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  if (month >= 4) {
    return `${year}-${String(year + 1).slice(-2)}`;
  }

  return `${year - 1}-${String(year).slice(-2)}`;
}

function serializeOpeningBalance(
  openingBalance
) {
  if (!openingBalance) {
    return null;
  }

  return {
    id: openingBalance._id.toString(),

    financialYear:
      openingBalance.financialYear,

    amount:
      Number(openingBalance.amount || 0),

    notes:
      openingBalance.notes || '',

    createdBy:
      openingBalance.createdBy
        ? {
            id:
              openingBalance.createdBy._id
                ? openingBalance.createdBy._id.toString()
                : openingBalance.createdBy.toString(),

            name:
              openingBalance.createdBy.name ||
              '',
          }
        : null,

    updatedBy:
      openingBalance.updatedBy
        ? {
            id:
              openingBalance.updatedBy._id
                ? openingBalance.updatedBy._id.toString()
                : openingBalance.updatedBy.toString(),

            name:
              openingBalance.updatedBy.name ||
              '',
          }
        : null,

    createdAt:
      openingBalance.createdAt,

    updatedAt:
      openingBalance.updatedAt,
  };
}

/*
 * GET
 *
 * Admin and cashier can view
 * opening balance.
 */
export async function GET(request) {
  try {
    const auth = await requireRole([
      'admin',
      'cashier',
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

    await connectDB();

    const { searchParams } =
      new URL(request.url);

    const financialYear =
      searchParams.get(
        'financialYear'
      ) ||
      getCurrentFinancialYear();

    const openingBalance =
      await OpeningBalance.findOne({
        organizationId:
          auth.session.organizationId,

        financialYear,
      })
        .populate({
          path: 'createdBy',
          select: 'name',
        })
        .populate({
          path: 'updatedBy',
          select: 'name',
        })
        .lean();

    return NextResponse.json({
      success: true,

      data: serializeOpeningBalance(
        openingBalance
      ),
    });
  } catch (error) {
    console.error(
      'Opening balance fetch error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to fetch opening balance',
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * POST
 *
 * Admin only.
 *
 * Creates opening balance for
 * a financial year.
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

    await connectDB();

    const body = await request.json();

    const {
      financialYear,
      amount,
      notes = '',
    } = body;

    const selectedFinancialYear =
      financialYear?.trim() ||
      getCurrentFinancialYear();

    /*
     * Validate financial year format.
     *
     * Example:
     * 2026-27
     */
    if (
      !/^\d{4}-\d{2}$/.test(
        selectedFinancialYear
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid financial year format',
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Validate amount.
     */
    if (
      amount === undefined ||
      amount === null ||
      amount === ''
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Opening balance amount is required',
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
      numericAmount < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Opening balance must be zero or greater',
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Prevent duplicate opening balance.
     */
    const existing =
      await OpeningBalance.findOne({
        organizationId:
          auth.session.organizationId,

        financialYear:
          selectedFinancialYear,
      });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Opening balance already exists for this financial year',
        },
        {
          status: 409,
        }
      );
    }

    const openingBalance =
      await OpeningBalance.create({
        organizationId:
          auth.session.organizationId,

        financialYear:
          selectedFinancialYear,

        amount:
          numericAmount,

        notes:
          String(notes).trim(),

        createdBy:
          auth.session.userId,
      });

    /*
     * Audit CREATE action.
     */
    await createAuditLog({
      organizationId:
        auth.session.organizationId,

      userId:
        auth.session.userId,

      action:
        'OPENING_BALANCE_CREATE',

      module:
        'opening_balance',

      recordId:
        openingBalance._id.toString(),

      description:
        `Created opening balance of ₹${numericAmount.toLocaleString(
          'en-IN'
        )} for ${selectedFinancialYear}`,

      oldValues: null,

      newValues: {
        financialYear:
          openingBalance.financialYear,

        amount:
          openingBalance.amount,

        notes:
          openingBalance.notes,

        status: 'active',
      },
    });

    const populated =
      await OpeningBalance.findById(
        openingBalance._id
      )
        .populate({
          path: 'createdBy',
          select: 'name',
        })
        .lean();

    return NextResponse.json(
      {
        success: true,

        message:
          'Opening balance created successfully',

        data:
          serializeOpeningBalance(
            populated
          ),
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    /*
     * Handles unique index race condition.
     */
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Opening balance already exists for this financial year',
        },
        {
          status: 409,
        }
      );
    }

    console.error(
      'Opening balance creation error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to create opening balance',
        error:
          error.message,
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * PATCH
 *
 * Admin only.
 *
 * Updates existing opening balance.
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

    await connectDB();

    const body = await request.json();

    const {
      financialYear,
      amount,
      notes,
    } = body;

    const selectedFinancialYear =
      financialYear?.trim();

    if (!selectedFinancialYear) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Financial year is required',
        },
        {
          status: 400,
        }
      );
    }

    if (
      !/^\d{4}-\d{2}$/.test(
        selectedFinancialYear
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid financial year format',
        },
        {
          status: 400,
        }
      );
    }

    const openingBalance =
      await OpeningBalance.findOne({
        organizationId:
          auth.session.organizationId,

        financialYear:
          selectedFinancialYear,
      });

    if (!openingBalance) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Opening balance not found',
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Capture old values BEFORE update.
     */
    const oldValues = {
      financialYear:
        openingBalance.financialYear,

      amount:
        openingBalance.amount,

      notes:
        openingBalance.notes || '',
    };

    /*
     * Update amount only when supplied.
     */
    if (
      amount !== undefined
    ) {
      const numericAmount =
        Number(amount);

      if (
        !Number.isFinite(
          numericAmount
        ) ||
        numericAmount < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Opening balance must be zero or greater',
          },
          {
            status: 400,
          }
        );
      }

      openingBalance.amount =
        numericAmount;
    }

    /*
     * Update notes only when supplied.
     */
    if (
      notes !== undefined
    ) {
      openingBalance.notes =
        String(notes).trim();
    }

    openingBalance.updatedBy =
      auth.session.userId;

    await openingBalance.save();

    /*
     * Capture new values AFTER update.
     */
    const newValues = {
      financialYear:
        openingBalance.financialYear,

      amount:
        openingBalance.amount,

      notes:
        openingBalance.notes || '',
    };

    /*
     * Audit UPDATE action.
     */
    await createAuditLog({
      organizationId:
        auth.session.organizationId,

      userId:
        auth.session.userId,

      action:
        'OPENING_BALANCE_UPDATE',

      module:
        'opening_balance',

      recordId:
        openingBalance._id.toString(),

      description:
        `Updated opening balance for ${openingBalance.financialYear}`,

      oldValues,

      newValues,
    });

    const populated =
      await OpeningBalance.findById(
        openingBalance._id
      )
        .populate({
          path: 'createdBy',
          select: 'name',
        })
        .populate({
          path: 'updatedBy',
          select: 'name',
        })
        .lean();

    return NextResponse.json({
      success: true,

      message:
        'Opening balance updated successfully',

      data:
        serializeOpeningBalance(
          populated
        ),
    });
  } catch (error) {
    console.error(
      'Opening balance update error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to update opening balance',
        error:
          error.message,
      },
      {
        status: 500,
      }
    );
  }
}
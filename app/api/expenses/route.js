import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

import Expense from '@/models/Expense';

function getFinancialYear(date) {
  const currentDate = new Date(date);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  if (month >= 4) {
    return `${year}-${String(year + 1).slice(-2)}`;
  }

  return `${year - 1}-${String(year).slice(-2)}`;
}

export async function GET(request) {
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

    const { searchParams } =
      new URL(request.url);

    const search =
      searchParams.get('search')?.trim() || '';

    const status =
      searchParams.get('status') || 'active';

    const financialYear =
      searchParams.get('financialYear') || '';

    const category =
      searchParams.get('category') || '';

    const paymentMethod =
      searchParams.get('paymentMethod') || '';

    const query = {
      organizationId:
        session.organizationId,
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

    if (category) {
      query.category = category;
    }

    if (paymentMethod) {
      query.paymentMethod =
        paymentMethod;
    }

    if (search) {
      query.$or = [
        {
          category: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          description: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          vendorName: {
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
          notes: {
            $regex: search,
            $options: 'i',
          },
        },
      ];
    }

    const expenses =
      await Expense.find(query)
        .sort({
          expenseDate: -1,
          createdAt: -1,
        })
        .populate({
          path: 'createdBy',
          select: 'name email',
        })
        .lean();

    const activeExpenses =
      expenses.filter(
        (expense) =>
          expense.status === 'active'
      );

    const totalAmount =
      activeExpenses.reduce(
        (total, expense) =>
          total +
          Number(
            expense.amount || 0
          ),
        0
      );

    const cashAmount =
      activeExpenses
        .filter(
          (expense) =>
            expense.paymentMethod ===
            'cash'
        )
        .reduce(
          (total, expense) =>
            total +
            Number(
              expense.amount || 0
            ),
          0
        );

    const digitalAmount =
      activeExpenses
        .filter(
          (expense) =>
            [
              'upi',
              'bank_transfer',
              'card',
            ].includes(
              expense.paymentMethod
            )
        )
        .reduce(
          (total, expense) =>
            total +
            Number(
              expense.amount || 0
            ),
          0
        );

    const serializedExpenses =
      expenses.map(
        (expense) => ({
          id: expense._id.toString(),

          amount:
            expense.amount,

          expenseDate:
            expense.expenseDate,

          financialYear:
            expense.financialYear,

          category:
            expense.category,

          description:
            expense.description ||
            '',

          paymentMethod:
            expense.paymentMethod,

          referenceNumber:
            expense.referenceNumber ||
            '',

          vendorName:
            expense.vendorName ||
            '',

          notes:
            expense.notes || '',

          status:
            expense.status ||
            'active',

          createdBy:
            expense.createdBy
              ? {
                  id: expense.createdBy._id.toString(),

                  name:
                    expense.createdBy
                      .name || '',

                  email:
                    expense.createdBy
                      .email || '',
                }
              : null,

          createdAt:
            expense.createdAt,

          updatedAt:
            expense.updatedAt,

          voidedAt:
            expense.voidedAt ||
            null,

          voidedBy:
            expense.voidedBy
              ? expense.voidedBy.toString()
              : null,

          voidReason:
            expense.voidReason ||
            '',
        })
      );

    return NextResponse.json({
      success: true,

      summary: {
        totalCount:
          activeExpenses.length,

        totalAmount:
          Number(
            totalAmount.toFixed(2)
          ),

        cashAmount:
          Number(
            cashAmount.toFixed(2)
          ),

        digitalAmount:
          Number(
            digitalAmount.toFixed(2)
          ),
      },

      data: serializedExpenses,
    });
  } catch (error) {
    console.error(
      'Expense fetch error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to fetch expenses',
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request) {
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

    const body =
      await request.json();

    const {
      amount,
      expenseDate,
      category,
      description = '',
      paymentMethod = 'cash',
      referenceNumber = '',
      vendorName = '',
      notes = '',
    } = body;

    if (
      amount === undefined ||
      amount === null ||
      amount === ''
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Expense amount is required',
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
            'Expense amount must be greater than zero',
        },
        {
          status: 400,
        }
      );
    }

    if (!expenseDate) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Expense date is required',
        },
        {
          status: 400,
        }
      );
    }

    if (!category?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Expense category is required',
        },
        {
          status: 400,
        }
      );
    }

    const validPaymentMethods = [
      'cash',
      'upi',
      'bank_transfer',
      'cheque',
      'card',
      'other',
    ];

    if (
      !validPaymentMethods.includes(
        paymentMethod
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid payment method',
        },
        {
          status: 400,
        }
      );
    }

    const parsedDate =
      new Date(expenseDate);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid expense date',
        },
        {
          status: 400,
        }
      );
    }

    const financialYear =
      getFinancialYear(
        parsedDate
      );

    const expense =
      await Expense.create({
        organizationId:
          session.organizationId,

        amount:
          numericAmount,

        expenseDate:
          parsedDate,

        financialYear,

        category:
          category.trim(),

        description:
          String(
            description
          ).trim(),

        paymentMethod,

        referenceNumber:
          String(
            referenceNumber
          ).trim(),

        vendorName:
          String(
            vendorName
          ).trim(),

        notes:
          String(notes).trim(),

        status:
          'active',

        createdBy:
          session.userId,
      });

    /*
     * Create audit log for expense creation.
     */
    await createAuditLog({
      organizationId:
        session.organizationId,

      userId:
        session.userId,

      action:
        'CREATE',

      module:
        'expense',

      recordId:
        expense._id.toString(),

      description:
        `Created expense of ₹${numericAmount.toLocaleString(
          'en-IN'
        )} for ${expense.category}`,

      oldValues:
        null,

      newValues: {
        amount:
          expense.amount,

        expenseDate:
          expense.expenseDate,

        financialYear:
          expense.financialYear,

        category:
          expense.category,

        description:
          expense.description,

        paymentMethod:
          expense.paymentMethod,

        referenceNumber:
          expense.referenceNumber,

        vendorName:
          expense.vendorName,

        notes:
          expense.notes,

        status:
          expense.status,
      },
    });

    const populatedExpense =
      await Expense.findById(
        expense._id
      )
        .populate({
          path: 'createdBy',
          select: 'name email',
        })
        .lean();

    return NextResponse.json(
      {
        success: true,

        message:
          'Expense created successfully',

        data: {
          id:
            populatedExpense._id.toString(),

          amount:
            populatedExpense.amount,

          expenseDate:
            populatedExpense.expenseDate,

          financialYear:
            populatedExpense.financialYear,

          category:
            populatedExpense.category,

          description:
            populatedExpense.description ||
            '',

          paymentMethod:
            populatedExpense.paymentMethod,

          referenceNumber:
            populatedExpense.referenceNumber ||
            '',

          vendorName:
            populatedExpense.vendorName ||
            '',

          notes:
            populatedExpense.notes ||
            '',

          status:
            populatedExpense.status,

          createdBy:
            populatedExpense.createdBy
              ? {
                  id:
                    populatedExpense.createdBy._id.toString(),

                  name:
                    populatedExpense
                      .createdBy.name ||
                    '',

                  email:
                    populatedExpense
                      .createdBy.email ||
                    '',
                }
              : null,

          createdAt:
            populatedExpense.createdAt,

          updatedAt:
            populatedExpense.updatedAt,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      'Expense creation error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to create expense',
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(request) {
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

    const body =
      await request.json();

    const {
      id,
      status,
      voidReason,
    } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Expense ID is required',
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
            'Only expense voiding is supported',
        },
        {
          status: 400,
        }
      );
    }

    if (!voidReason?.trim()) {
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

    const expense =
      await Expense.findOne({
        _id: id,

        organizationId:
          session.organizationId,

        status: 'active',
      });

    if (!expense) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Active expense not found',
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Capture the complete old state
     * before changing the expense.
     */
    const oldValues = {
      amount:
        expense.amount,

      expenseDate:
        expense.expenseDate,

      financialYear:
        expense.financialYear,

      category:
        expense.category,

      description:
        expense.description,

      paymentMethod:
        expense.paymentMethod,

      referenceNumber:
        expense.referenceNumber,

      vendorName:
        expense.vendorName,

      notes:
        expense.notes,

      status:
        expense.status,

      voidedAt:
        expense.voidedAt,

      voidedBy:
        expense.voidedBy
          ? expense.voidedBy.toString()
          : null,

      voidReason:
        expense.voidReason,
    };

    /*
     * Void the expense.
     */
    expense.status =
      'voided';

    expense.voidedAt =
      new Date();

    expense.voidedBy =
      session.userId;

    expense.voidReason =
      voidReason.trim();

    await expense.save();

    /*
     * Create audit log for expense void.
     */
    await createAuditLog({
      organizationId:
        session.organizationId,

      userId:
        session.userId,

      action:
        'VOID',

      module:
        'expense',

      recordId:
        expense._id.toString(),

      description:
        `Voided expense of ₹${expense.amount.toLocaleString(
          'en-IN'
        )} for ${expense.category}`,

      oldValues,

      newValues: {
        amount:
          expense.amount,

        expenseDate:
          expense.expenseDate,

        financialYear:
          expense.financialYear,

        category:
          expense.category,

        description:
          expense.description,

        paymentMethod:
          expense.paymentMethod,

        referenceNumber:
          expense.referenceNumber,

        vendorName:
          expense.vendorName,

        notes:
          expense.notes,

        status:
          expense.status,

        voidedAt:
          expense.voidedAt,

        voidedBy:
          expense.voidedBy
            ? expense.voidedBy.toString()
            : null,

        voidReason:
          expense.voidReason,
      },

      reason:
        voidReason.trim(),
    });

    return NextResponse.json({
      success: true,

      message:
        'Expense voided successfully',

      data: {
        id:
          expense._id.toString(),

        status:
          expense.status,

        voidedAt:
          expense.voidedAt,

        voidReason:
          expense.voidReason,
      },
    });
  } catch (error) {
    console.error(
      'Expense void error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to void expense',
      },
      {
        status: 500,
      }
    );
  }
}
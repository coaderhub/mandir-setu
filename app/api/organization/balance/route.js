import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';

import OpeningBalance from '@/models/OpeningBalance';
import Donation from '@/models/Donation';
import Expense from '@/models/Expense';

function getCurrentFinancialYear() {
  const now = new Date();

  const year = now.getFullYear();
  const month = now.getMonth() + 1;

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

    const financialYear =
      searchParams.get('financialYear') ||
      getCurrentFinancialYear();

    const organizationId =
      session.organizationId;

    if (
      !mongoose.Types.ObjectId.isValid(
        organizationId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid organization',
        },
        {
          status: 400,
        }
      );
    }

    const organizationObjectId =
      new mongoose.Types.ObjectId(
        organizationId
      );

    /*
     * ----------------------------------------
     * Opening Balance
     * ----------------------------------------
     */

    const openingBalanceRecord =
      await OpeningBalance.findOne({
        organizationId:
          organizationObjectId,

        financialYear,
      }).lean();

    const openingBalance =
      Number(
        openingBalanceRecord?.amount || 0
      );

    /*
     * ----------------------------------------
     * Donations
     * ----------------------------------------
     */

    const donationResult =
      await Donation.aggregate([
        {
          $match: {
            organizationId:
              organizationObjectId,

            financialYear,

            status: 'active',
          },
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

    const totalDonations =
      Number(
        donationResult[0]?.totalAmount || 0
      );

    const donationCount =
      Number(
        donationResult[0]?.count || 0
      );

    /*
     * ----------------------------------------
     * Expenses
     * ----------------------------------------
     */

    const expenseResult =
      await Expense.aggregate([
        {
          $match: {
            organizationId:
              organizationObjectId,

            financialYear,

            status: 'active',
          },
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

    const totalExpenses =
      Number(
        expenseResult[0]?.totalAmount || 0
      );

    const expenseCount =
      Number(
        expenseResult[0]?.count || 0
      );

    /*
     * ----------------------------------------
     * Current Balance
     *
     * Opening Balance
     * + Donations
     * - Expenses
     * ----------------------------------------
     */

    const currentBalance =
      openingBalance +
      totalDonations -
      totalExpenses;

    return NextResponse.json({
      success: true,

      data: {
        financialYear,

        openingBalance:
          Number(
            openingBalance.toFixed(2)
          ),

        totalDonations:
          Number(
            totalDonations.toFixed(2)
          ),

        totalExpenses:
          Number(
            totalExpenses.toFixed(2)
          ),

        currentBalance:
          Number(
            currentBalance.toFixed(2)
          ),

        donationCount,

        expenseCount,

        openingBalanceId:
          openingBalanceRecord?._id
            ? openingBalanceRecord._id.toString()
            : null,

        hasOpeningBalance:
          Boolean(
            openingBalanceRecord
          ),
      },
    });
  } catch (error) {
    console.error(
      'Balance fetch error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to fetch financial balance',
      },
      {
        status: 500,
      }
    );
  }
}
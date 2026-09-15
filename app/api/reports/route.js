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

function getMonthName(monthNumber) {
  const date = new Date(
    2000,
    monthNumber - 1,
    1
  );

  return date.toLocaleString(
    'en-IN',
    {
      month: 'short',
    }
  );
}

function getFinancialYearMonths(
  financialYear
) {
  const [startYearString] =
    financialYear.split('-');

  const startYear =
    Number(startYearString);

  return [
    {
      month: 4,
      year: startYear,
    },
    {
      month: 5,
      year: startYear,
    },
    {
      month: 6,
      year: startYear,
    },
    {
      month: 7,
      year: startYear,
    },
    {
      month: 8,
      year: startYear,
    },
    {
      month: 9,
      year: startYear,
    },
    {
      month: 10,
      year: startYear,
    },
    {
      month: 11,
      year: startYear,
    },
    {
      month: 12,
      year: startYear,
    },
    {
      month: 1,
      year: startYear + 1,
    },
    {
      month: 2,
      year: startYear + 1,
    },
    {
      month: 3,
      year: startYear + 1,
    },
  ];
}

export async function GET(request) {
  try {
    /*
     * ----------------------------------------
     * Authentication
     * ----------------------------------------
     */

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

    /*
     * ----------------------------------------
     * Database
     * ----------------------------------------
     */

    await connectDB();

    /*
     * ----------------------------------------
     * Financial Year
     * ----------------------------------------
     */

    const { searchParams } =
      new URL(request.url);

    const financialYear =
      searchParams.get(
        'financialYear'
      ) ||
      getCurrentFinancialYear();

    if (
      !/^\d{4}-\d{2}$/.test(
        financialYear
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
     * ----------------------------------------
     * Organization
     * ----------------------------------------
     */

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
          message:
            'Invalid organization',
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
        openingBalanceRecord?.amount ||
          0
      );

    /*
     * ----------------------------------------
     * Donation Summary
     * ----------------------------------------
     */

    const donationSummaryResult =
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
        donationSummaryResult[0]
          ?.totalAmount || 0
      );

    const donationCount =
      Number(
        donationSummaryResult[0]
          ?.count || 0
      );

    /*
     * ----------------------------------------
     * Expense Summary
     * ----------------------------------------
     */

    const expenseSummaryResult =
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
        expenseSummaryResult[0]
          ?.totalAmount || 0
      );

    const expenseCount =
      Number(
        expenseSummaryResult[0]
          ?.count || 0
      );

    /*
     * ----------------------------------------
     * Current Balance
     * ----------------------------------------
     */

    const currentBalance =
      openingBalance +
      totalDonations -
      totalExpenses;

    /*
     * ----------------------------------------
     * Monthly Donations
     * ----------------------------------------
     */

    const monthlyDonationResult =
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
            _id: {
              year: {
                $year:
                  '$donationDate',
              },

              month: {
                $month:
                  '$donationDate',
              },
            },

            amount: {
              $sum: '$amount',
            },

            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            '_id.year': 1,
            '_id.month': 1,
          },
        },
      ]);

    /*
     * ----------------------------------------
     * Monthly Expenses
     * ----------------------------------------
     */

    const monthlyExpenseResult =
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
            _id: {
              year: {
                $year:
                  '$expenseDate',
              },

              month: {
                $month:
                  '$expenseDate',
              },
            },

            amount: {
              $sum: '$amount',
            },

            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            '_id.year': 1,
            '_id.month': 1,
          },
        },
      ]);

    /*
     * ----------------------------------------
     * Build 12-Month Financial Year Data
     * ----------------------------------------
     */

    const financialYearMonths =
      getFinancialYearMonths(
        financialYear
      );

    const monthlySummary =
      financialYearMonths.map(
        (item) => {
          const donation =
            monthlyDonationResult.find(
              (record) =>
                record._id.year ===
                  item.year &&
                record._id.month ===
                  item.month
            );

          const expense =
            monthlyExpenseResult.find(
              (record) =>
                record._id.year ===
                  item.year &&
                record._id.month ===
                  item.month
            );

          return {
            month:
              getMonthName(
                item.month
              ),

            monthNumber:
              item.month,

            year: item.year,

            donations:
              Number(
                donation?.amount || 0
              ),

            donationCount:
              Number(
                donation?.count || 0
              ),

            expenses:
              Number(
                expense?.amount || 0
              ),

            expenseCount:
              Number(
                expense?.count || 0
              ),
          };
        }
      );

    /*
     * ----------------------------------------
     * Donation Payment Method Summary
     * ----------------------------------------
     */

    const donationPaymentResult =
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
            _id: '$paymentMethod',

            amount: {
              $sum: '$amount',
            },

            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            amount: -1,
          },
        },
      ]);

    const donationPaymentMethods =
      donationPaymentResult.map(
        (item) => ({
          paymentMethod:
            item._id,

          amount:
            Number(
              item.amount || 0
            ),

          count:
            Number(
              item.count || 0
            ),
        })
      );

    /*
     * ----------------------------------------
     * Expense Payment Method Summary
     * ----------------------------------------
     */

    const expensePaymentResult =
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
            _id: '$paymentMethod',

            amount: {
              $sum: '$amount',
            },

            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            amount: -1,
          },
        },
      ]);

    const expensePaymentMethods =
      expensePaymentResult.map(
        (item) => ({
          paymentMethod:
            item._id,

          amount:
            Number(
              item.amount || 0
            ),

          count:
            Number(
              item.count || 0
            ),
        })
      );

    /*
     * ----------------------------------------
     * Expense Category Summary
     * ----------------------------------------
     */

    const expenseCategoryResult =
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
            _id: '$category',

            amount: {
              $sum: '$amount',
            },

            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            amount: -1,
          },
        },
      ]);

    const expenseCategories =
      expenseCategoryResult.map(
        (item) => ({
          category:
            item._id,

          amount:
            Number(
              item.amount || 0
            ),

          count:
            Number(
              item.count || 0
            ),
        })
      );

    /*
     * ----------------------------------------
     * Donor Summary
     * ----------------------------------------
     */

    const donorSummaryResult =
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
            _id: '$donorId',

            amount: {
              $sum: '$amount',
            },

            donationCount: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            amount: -1,
          },
        },

        {
          $limit: 10,
        },

        {
          $lookup: {
            from: 'donors',

            localField: '_id',

            foreignField: '_id',

            as: 'donor',
          },
        },

        {
          $unwind: {
            path: '$donor',

            preserveNullAndEmptyArrays:
              true,
          },
        },

        {
          $match: {
            'donor.organizationId':
              organizationObjectId,
          },
        },
      ]);

    const topDonors =
      donorSummaryResult.map(
        (item) => ({
          donorId:
            item._id
              ? item._id.toString()
              : null,

          donorName:
            item.donor?.name ||
            'Unknown Donor',

          phone:
            item.donor?.phone ||
            '',

          amount:
            Number(
              item.amount || 0
            ),

          donationCount:
            Number(
              item.donationCount ||
                0
            ),
        })
      );

    /*
     * ----------------------------------------
     * Response
     * ----------------------------------------
     */

    return NextResponse.json({
      success: true,

      data: {
        financialYear,

        summary: {
          openingBalance:
            Number(
              openingBalance.toFixed(
                2
              )
            ),

          totalDonations:
            Number(
              totalDonations.toFixed(
                2
              )
            ),

          totalExpenses:
            Number(
              totalExpenses.toFixed(
                2
              )
            ),

          currentBalance:
            Number(
              currentBalance.toFixed(
                2
              )
            ),

          donationCount,

          expenseCount,
        },

        monthlySummary,

        donationPaymentMethods,

        expensePaymentMethods,

        expenseCategories,

        topDonors,
      },
    });
  } catch (error) {
    console.error(
      'Reports fetch error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to generate financial report',
      },
      {
        status: 500,
      }
    );
  }
}
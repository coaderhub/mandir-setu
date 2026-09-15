import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

import Organization from '@/models/Organization';
import Donation from '@/models/Donation';
import Expense from '@/models/Expense';
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

function serializeDonation(donation, settings) {
  const item = {
    id: donation._id.toString(),
    financialYear: donation.financialYear || '',
    createdAt: donation.createdAt,
  };

  if (settings.showDonorNames) {
    item.donorName =
      donation.donorId?.name ||
      donation.donorName ||
      'Anonymous';
  }

  if (settings.showDonationAmounts) {
    item.amount = Number(donation.amount || 0);
  }

  return item;
}

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          message: 'Temple slug is required',
        },
        { status: 400 }
      );
    }

    const organization = await Organization.findOne({
      slug: slug.toLowerCase(),
      status: { $ne: 'inactive' },
    }).lean();

    if (!organization) {
      return NextResponse.json(
        {
          success: false,
          message: 'Temple not found',
        },
        { status: 404 }
      );
    }

    const settings = {
      showDonations:
        organization.publicSettings?.showDonations !== false,

      showDonorNames:
        organization.publicSettings?.showDonorNames === true,

      showDonationAmounts:
        organization.publicSettings?.showDonationAmounts === true,

      showBalance:
        organization.publicSettings?.showBalance === true,
    };

    const financialYear = getCurrentFinancialYear();

    const publicData = {
      organization: {
        id: organization._id.toString(),
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo || '',
        description: organization.description || '',
        address: organization.address || '',
        city: organization.city || '',
        state: organization.state || '',
        country: organization.country || '',
        phone: organization.phone || '',
        email: organization.email || '',
      },

      settings,

      financialYear,
    };

    /*
     * Donations
     */
    if (settings.showDonations) {
      const donations = await Donation.find({
        organizationId: organization._id,
        financialYear,
        status: { $ne: 'voided' },
      })
        .populate({
          path: 'donorId',
          select: 'name',
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      publicData.donations = donations.map((donation) =>
        serializeDonation(donation, settings)
      );
    } else {
      publicData.donations = [];
    }

    /*
     * Balance
     */
    if (settings.showBalance) {
      const openingBalance = await OpeningBalance.findOne({
        organizationId: organization._id,
        financialYear,
      }).lean();

      const donationResult = await Donation.aggregate([
        {
          $match: {
            organizationId: organization._id,
            financialYear,
            status: { $ne: 'voided' },
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$amount',
            },
          },
        },
      ]);

      const expenseResult = await Expense.aggregate([
        {
          $match: {
            organizationId: organization._id,
            financialYear,
            status: { $ne: 'voided' },
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$amount',
            },
          },
        },
      ]);

      const openingAmount = Number(
        openingBalance?.amount || 0
      );

      const donationTotal = Number(
        donationResult[0]?.total || 0
      );

      const expenseTotal = Number(
        expenseResult[0]?.total || 0
      );

      const currentBalance =
        openingAmount +
        donationTotal -
        expenseTotal;

      publicData.balance = {
        openingBalance: openingAmount,
        totalDonations: donationTotal,
        totalExpenses: expenseTotal,
        currentBalance,
      };
    }

    return NextResponse.json({
      success: true,
      data: publicData,
    });
  } catch (error) {
    console.error('Public temple API error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to load temple information',
      },
      { status: 500 }
    );
  }
}
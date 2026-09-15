import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import Donor from '@/models/Donor';
import Donation from '@/models/Donation';

export async function GET(
  request,
  { params }
) {
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Donor ID is required',
        },
        {
          status: 400,
        }
      );
    }

    await connectDB();

    /*
     * IMPORTANT:
     *
     * Donor must belong to the
     * authenticated organization.
     */
    const donor =
      await Donor.findOne({
        _id: id,
        organizationId:
          session.organizationId,
      }).lean();

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

    const donations =
      await Donation.find({
        donorId: donor._id,
        organizationId:
          session.organizationId,
      })
        .sort({
          donationDate: -1,
          createdAt: -1,
        })
        .populate({
          path: 'createdBy',
          select:
            'name email',
        })
        .lean();

    const activeDonations =
      donations.filter(
        (donation) =>
          donation.status ===
          'active'
      );

    const totalAmount =
      activeDonations.reduce(
        (total, donation) =>
          total +
          Number(
            donation.amount || 0
          ),
        0
      );

    const totalDonationCount =
      activeDonations.length;

    const financialYearTotals = {};

    activeDonations.forEach(
      (donation) => {
        const year =
          donation.financialYear ||
          'Unknown';

        if (
          !financialYearTotals[
            year
          ]
        ) {
          financialYearTotals[
            year
          ] = 0;
        }

        financialYearTotals[
          year
        ] += Number(
          donation.amount || 0
        );
      }
    );

    const serializedDonations =
      donations.map(
        (donation) => ({
          id:
            donation._id.toString(),

          amount:
            donation.amount,

          donationDate:
            donation.donationDate,

          financialYear:
            donation.financialYear,

          paymentMethod:
            donation.paymentMethod,

          receiptNumber:
            donation.receiptNumber ||
            '',

          referenceNumber:
            donation.referenceNumber ||
            '',

          purpose:
            donation.purpose ||
            '',

          notes:
            donation.notes ||
            '',

          status:
            donation.status ||
            'active',

          createdBy:
            donation.createdBy
              ? {
                  id:
                    donation.createdBy._id.toString(),

                  name:
                    donation.createdBy.name ||
                    '',

                  email:
                    donation.createdBy.email ||
                    '',
                }
              : null,

          createdAt:
            donation.createdAt,

          updatedAt:
            donation.updatedAt,

          voidedAt:
            donation.voidedAt ||
            null,

          voidReason:
            donation.voidReason ||
            '',
        })
      );

    return NextResponse.json({
      success: true,

      donor: {
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

        status:
          donor.status || 'active',
      },

      summary: {
        totalAmount:
          Number(
            totalAmount.toFixed(2)
          ),

        totalDonationCount,

        financialYearTotals:
          Object.entries(
            financialYearTotals
          )
            .sort(
              ([yearA], [yearB]) =>
                yearB.localeCompare(
                  yearA
                )
            )
            .map(
              ([
                year,
                amount,
              ]) => ({
                financialYear:
                  year,

                amount:
                  Number(
                    amount.toFixed(
                      2
                    )
                  ),
              })
            ),
      },

      data:
        serializedDonations,
    });
  } catch (error) {
    console.error(
      'Donor donation history error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to fetch donor donation history',
      },
      {
        status: 500,
      }
    );
  }
}
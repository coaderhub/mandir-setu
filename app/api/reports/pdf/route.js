import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';

import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';

import Organization from '@/models/Organization';
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

function getFinancialYearMonths(financialYear) {
  const startYear = Number(
    financialYear.split('-')[0]
  );

  return [
    {
      month: 'Apr',
      year: startYear,
      start: new Date(startYear, 3, 1),
      end: new Date(startYear, 4, 1),
    },
    {
      month: 'May',
      year: startYear,
      start: new Date(startYear, 4, 1),
      end: new Date(startYear, 5, 1),
    },
    {
      month: 'Jun',
      year: startYear,
      start: new Date(startYear, 5, 1),
      end: new Date(startYear, 6, 1),
    },
    {
      month: 'Jul',
      year: startYear,
      start: new Date(startYear, 6, 1),
      end: new Date(startYear, 7, 1),
    },
    {
      month: 'Aug',
      year: startYear,
      start: new Date(startYear, 7, 1),
      end: new Date(startYear, 8, 1),
    },
    {
      month: 'Sep',
      year: startYear,
      start: new Date(startYear, 8, 1),
      end: new Date(startYear, 9, 1),
    },
    {
      month: 'Oct',
      year: startYear,
      start: new Date(startYear, 9, 1),
      end: new Date(startYear, 10, 1),
    },
    {
      month: 'Nov',
      year: startYear,
      start: new Date(startYear, 10, 1),
      end: new Date(startYear, 11, 1),
    },
    {
      month: 'Dec',
      year: startYear,
      start: new Date(startYear, 11, 1),
      end: new Date(startYear + 1, 0, 1),
    },
    {
      month: 'Jan',
      year: startYear + 1,
      start: new Date(startYear + 1, 0, 1),
      end: new Date(startYear + 1, 1, 1),
    },
    {
      month: 'Feb',
      year: startYear + 1,
      start: new Date(startYear + 1, 1, 1),
      end: new Date(startYear + 1, 2, 1),
    },
    {
      month: 'Mar',
      year: startYear + 1,
      start: new Date(startYear + 1, 2, 1),
      end: new Date(startYear + 1, 3, 1),
    },
  ];
}

function formatCurrency(value) {
  const amount = Number(value || 0);

  return `Rs. ${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(date) {
  if (!date) {
    return '-';
  }

  return new Date(date).toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  );
}

function paymentMethodLabel(value) {
  const labels = {
    cash: 'Cash',
    upi: 'UPI',
    bank_transfer: 'Bank Transfer',
    cheque: 'Cheque',
    card: 'Card',
    other: 'Other',
  };

  return labels[value] || value || 'Unknown';
}

function sanitizeFilename(value) {
  return String(value || 'temple')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function drawSectionTitle(doc, title) {
  doc
    .fontSize(13)
    .font('Helvetica-Bold')
    .fillColor('#0f172a')
    .text(title);

  doc
    .moveDown(0.25)
    .strokeColor('#e2e8f0')
    .lineWidth(1)
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke();

  doc.moveDown(0.5);
}

function drawSummaryCard(
  doc,
  x,
  y,
  width,
  title,
  value
) {
  doc
    .roundedRect(
      x,
      y,
      width,
      62,
      7
    )
    .fillAndStroke(
      '#f8fafc',
      '#e2e8f0'
    );

  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor('#64748b')
    .text(
      title,
      x + 10,
      y + 10,
      {
        width: width - 20,
      }
    );

  doc
    .fontSize(13)
    .font('Helvetica-Bold')
    .fillColor('#0f172a')
    .text(
      value,
      x + 10,
      y + 28,
      {
        width: width - 20,
      }
    );
}

function drawTableHeader(
  doc,
  columns,
  y
) {
  doc
    .rect(
      50,
      y,
      495,
      24
    )
    .fill('#f1f5f9');

  columns.forEach((column) => {
    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#475569')
      .text(
        column.label,
        column.x,
        y + 7,
        {
          width: column.width,
          align: column.align || 'left',
        }
      );
  });

  return y + 24;
}

function ensurePageSpace(
  doc,
  requiredHeight
) {
  if (
    doc.y + requiredHeight >
    760
  ) {
    doc.addPage();

    return true;
  }

  return false;
}

export async function GET(request) {
  try {
    const session = await requireAuth();

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
            'Invalid financial year',
        },
        {
          status: 400,
        }
      );
    }

    const organizationObjectId =
      new mongoose.Types.ObjectId(
        session.organizationId
      );

    const organization =
      await Organization.findOne({
        _id: organizationObjectId,
      }).lean();

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

    const openingBalance =
      await OpeningBalance.findOne({
        organizationId:
          organizationObjectId,
        financialYear,
      }).lean();

    const donationSummary =
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
            total: {
              $sum: '$amount',
            },
            count: {
              $sum: 1,
            },
          },
        },
      ]);

    const expenseSummary =
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
            total: {
              $sum: '$amount',
            },
            count: {
              $sum: 1,
            },
          },
        },
      ]);

    const totalDonations =
      donationSummary[0]?.total || 0;

    const donationCount =
      donationSummary[0]?.count || 0;

    const totalExpenses =
      expenseSummary[0]?.total || 0;

    const expenseCount =
      expenseSummary[0]?.count || 0;

    const openingAmount =
      openingBalance?.amount || 0;

    const currentBalance =
      openingAmount +
      totalDonations -
      totalExpenses;

    /*
     * Monthly summary
     */
    const months =
      getFinancialYearMonths(
        financialYear
      );

    const monthlySummary =
      await Promise.all(
        months.map(async (month) => {
          const [
            donationData,
            expenseData,
          ] = await Promise.all([
            Donation.aggregate([
              {
                $match: {
                  organizationId:
                    organizationObjectId,
                  status: 'active',
                  donationDate: {
                    $gte: month.start,
                    $lt: month.end,
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  total: {
                    $sum: '$amount',
                  },
                  count: {
                    $sum: 1,
                  },
                },
              },
            ]),

            Expense.aggregate([
              {
                $match: {
                  organizationId:
                    organizationObjectId,
                  status: 'active',
                  expenseDate: {
                    $gte: month.start,
                    $lt: month.end,
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  total: {
                    $sum: '$amount',
                  },
                  count: {
                    $sum: 1,
                  },
                },
              },
            ]),
          ]);

          return {
            month: month.month,
            year: month.year,
            donations:
              donationData[0]?.total ||
              0,
            donationCount:
              donationData[0]?.count ||
              0,
            expenses:
              expenseData[0]?.total ||
              0,
            expenseCount:
              expenseData[0]?.count ||
              0,
          };
        })
      );

    /*
     * Donation payment methods
     */
    const donationPaymentMethods =
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

    /*
     * Expense payment methods
     */
    const expensePaymentMethods =
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

    /*
     * Expense categories
     */
    const expenseCategories =
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

    /*
     * Top donors
     */
    const topDonors =
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
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            donorName: {
              $ifNull: [
                '$donor.name',
                'Unknown Donor',
              ],
            },
            phone: {
              $ifNull: [
                '$donor.phone',
                '',
              ],
            },
            amount: 1,
            donationCount: 1,
          },
        },
      ]);

    /*
     * PDF document
     */
    const doc =
      new PDFDocument({
        size: 'A4',
        margins: {
          top: 45,
          bottom: 45,
          left: 50,
          right: 50,
        },
        info: {
          Title: `${organization.name} Financial Report`,
          Author:
            'Temple Management System',
          Subject: `Financial Report ${financialYear}`,
        },
      });

    const chunks = [];

    doc.on('data', (chunk) => {
      chunks.push(chunk);
    });

    const pdfPromise =
      new Promise(
        (resolve, reject) => {
          doc.on('end', resolve);
          doc.on('error', reject);
        }
      );

    /*
     * Header
     */
    doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .fillColor('#0f172a')
      .text(
        organization.name ||
          'Temple Management',
        {
          align: 'center',
        }
      );

    doc.moveDown(0.3);

    doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#475569')
      .text(
        'Financial Report',
        {
          align: 'center',
        }
      );

    doc.moveDown(0.2);

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#0f172a')
      .text(
        `Financial Year: ${financialYear}`,
        {
          align: 'center',
        }
      );

    if (
      organization.address ||
      organization.city ||
      organization.state
    ) {
      doc.moveDown(0.5);

      const address = [
        organization.address,
        organization.city,
        organization.state,
        organization.country,
      ]
        .filter(Boolean)
        .join(', ');

      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#64748b')
        .text(address, {
          align: 'center',
        });
    }

    doc.moveDown(1);

    doc
      .strokeColor('#0f172a')
      .lineWidth(1.5)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke();

    doc.moveDown(1);

    /*
     * Summary cards
     */
    drawSectionTitle(
      doc,
      'Financial Summary'
    );

    const cardWidth = 118;

    const cardGap = 7;

    const cardY = doc.y;

    drawSummaryCard(
      doc,
      50,
      cardY,
      cardWidth,
      'Opening Balance',
      formatCurrency(
        openingAmount
      )
    );

    drawSummaryCard(
      doc,
      50 +
        cardWidth +
        cardGap,
      cardY,
      cardWidth,
      'Donations',
      formatCurrency(
        totalDonations
      )
    );

    drawSummaryCard(
      doc,
      50 +
        (cardWidth +
          cardGap) *
          2,
      cardY,
      cardWidth,
      'Expenses',
      formatCurrency(
        totalExpenses
      )
    );

    drawSummaryCard(
      doc,
      50 +
        (cardWidth +
          cardGap) *
          3,
      cardY,
      cardWidth,
      'Closing Balance',
      formatCurrency(
        currentBalance
      )
    );

    doc.y =
      cardY + 78;

    /*
     * Transaction overview
     */
    drawSectionTitle(
      doc,
      'Transaction Overview'
    );

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#475569')
      .text(
        `Donation Transactions: ${donationCount}`
      );

    doc
      .text(
        `Expense Transactions: ${expenseCount}`
      );

    doc.moveDown(1);

    /*
     * Monthly summary
     */
    drawSectionTitle(
      doc,
      'Monthly Summary'
    );

    const monthlyColumns = [
      {
        label: 'Month',
        x: 50,
        width: 55,
      },
      {
        label: 'Donations',
        x: 110,
        width: 90,
        align: 'right',
      },
      {
        label: 'Count',
        x: 205,
        width: 50,
        align: 'right',
      },
      {
        label: 'Expenses',
        x: 260,
        width: 90,
        align: 'right',
      },
      {
        label: 'Count',
        x: 355,
        width: 50,
        align: 'right',
      },
      {
        label: 'Net',
        x: 410,
        width: 135,
        align: 'right',
      },
    ];

    let tableY =
      drawTableHeader(
        doc,
        monthlyColumns,
        doc.y
      );

    monthlySummary.forEach(
      (month) => {
        if (
          ensurePageSpace(doc, 24)
        ) {
          tableY =
            drawTableHeader(
              doc,
              monthlyColumns,
              doc.y
            );
        }

        const net =
          Number(
            month.donations || 0
          ) -
          Number(
            month.expenses || 0
          );

        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#334155')
          .text(
            month.month,
            50,
            tableY + 7,
            {
              width: 55,
            }
          );

        doc.text(
          formatCurrency(
            month.donations
          ),
          110,
          tableY + 7,
          {
            width: 90,
            align: 'right',
          }
        );

        doc.text(
          String(
            month.donationCount
          ),
          205,
          tableY + 7,
          {
            width: 50,
            align: 'right',
          }
        );

        doc.text(
          formatCurrency(
            month.expenses
          ),
          260,
          tableY + 7,
          {
            width: 90,
            align: 'right',
          }
        );

        doc.text(
          String(
            month.expenseCount
          ),
          355,
          tableY + 7,
          {
            width: 50,
            align: 'right',
          }
        );

        doc
          .font('Helvetica-Bold')
          .text(
            formatCurrency(net),
            410,
            tableY + 7,
            {
              width: 135,
              align: 'right',
            }
          );

        doc
          .strokeColor('#e2e8f0')
          .lineWidth(0.5)
          .moveTo(
            50,
            tableY + 23
          )
          .lineTo(
            545,
            tableY + 23
          )
          .stroke();

        tableY += 24;
      }
    );

    doc.y = tableY + 15;

    /*
     * Payment methods
     */
    if (
      ensurePageSpace(doc, 170)
    ) {
      doc.moveDown(1);
    }

    drawSectionTitle(
      doc,
      'Donation Payment Methods'
    );

    donationPaymentMethods.forEach(
      (item) => {
        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#334155')
          .text(
            paymentMethodLabel(
              item._id
            ),
            55,
            doc.y,
            {
              width: 250,
            }
          );

        doc
          .font('Helvetica-Bold')
          .text(
            formatCurrency(
              item.amount
            ),
            350,
            doc.y,
            {
              width: 150,
              align: 'right',
            }
          );

        doc.moveDown(0.5);
      }
    );

    doc.moveDown(0.5);

    drawSectionTitle(
      doc,
      'Expense Payment Methods'
    );

    expensePaymentMethods.forEach(
      (item) => {
        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#334155')
          .text(
            paymentMethodLabel(
              item._id
            ),
            55,
            doc.y,
            {
              width: 250,
            }
          );

        doc
          .font('Helvetica-Bold')
          .text(
            formatCurrency(
              item.amount
            ),
            350,
            doc.y,
            {
              width: 150,
              align: 'right',
            }
          );

        doc.moveDown(0.5);
      }
    );

    /*
     * Expense categories
     */
    if (
      ensurePageSpace(doc, 180)
    ) {
      doc.addPage();
    }

    drawSectionTitle(
      doc,
      'Expense Categories'
    );

    expenseCategories.forEach(
      (item) => {
        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#334155')
          .text(
            item._id || 'Uncategorized',
            55,
            doc.y,
            {
              width: 250,
            }
          );

        doc
          .font('Helvetica-Bold')
          .text(
            formatCurrency(
              item.amount
            ),
            350,
            doc.y,
            {
              width: 150,
              align: 'right',
            }
          );

        doc.moveDown(0.5);
      }
    );

    /*
     * Top donors
     */
    if (
      ensurePageSpace(doc, 200)
    ) {
      doc.addPage();
    }

    drawSectionTitle(
      doc,
      'Top Donors'
    );

    const donorColumns = [
      {
        label: 'Donor',
        x: 50,
        width: 220,
      },
      {
        label: 'Phone',
        x: 275,
        width: 110,
      },
      {
        label: 'Count',
        x: 390,
        width: 50,
        align: 'right',
      },
      {
        label: 'Amount',
        x: 445,
        width: 100,
        align: 'right',
      },
    ];

    let donorY =
      drawTableHeader(
        doc,
        donorColumns,
        doc.y
      );

    topDonors.forEach(
      (donor) => {
        if (
          ensurePageSpace(doc, 28)
        ) {
          donorY =
            drawTableHeader(
              doc,
              donorColumns,
              doc.y
            );
        }

        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#334155')
          .text(
            donor.donorName ||
              'Unknown Donor',
            50,
            donorY + 7,
            {
              width: 220,
            }
          );

        doc.text(
          donor.phone || '-',
          275,
          donorY + 7,
          {
            width: 110,
          }
        );

        doc.text(
          String(
            donor.donationCount
          ),
          390,
          donorY + 7,
          {
            width: 50,
            align: 'right',
          }
        );

        doc
          .font('Helvetica-Bold')
          .text(
            formatCurrency(
              donor.amount
            ),
            445,
            donorY + 7,
            {
              width: 100,
              align: 'right',
            }
          );

        doc
          .strokeColor('#e2e8f0')
          .lineWidth(0.5)
          .moveTo(
            50,
            donorY + 23
          )
          .lineTo(
            545,
            donorY + 23
          )
          .stroke();

        donorY += 24;
      }
    );

    doc.y = donorY + 35;

    /*
     * Signature section
     */
    if (
      ensurePageSpace(doc, 130)
    ) {
      doc.addPage();
    }

    doc
      .strokeColor('#cbd5e1')
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke();

    doc.moveDown(2);

    const signatureY = doc.y;

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#64748b')
      .text(
        `Generated on ${formatDate(
          new Date()
        )}`,
        50,
        signatureY
      );

    doc
      .moveTo(370, signatureY + 35)
      .lineTo(545, signatureY + 35)
      .strokeColor('#94a3b8')
      .stroke();

    doc
      .fontSize(8)
      .fillColor('#64748b')
      .text(
        'Authorized Signature',
        370,
        signatureY + 42,
        {
          width: 175,
          align: 'center',
        }
      );

    doc.moveDown(5);

    doc
      .fontSize(7)
      .font('Helvetica')
      .fillColor('#94a3b8')
      .text(
        'This report is generated from the Temple Management System.',
        {
          align: 'center',
        }
      );

    /*
     * Footer on every page
     */
    const range =
      doc.bufferedPageRange();

    for (
      let i = range.start;
      i <
      range.start +
        range.count;
      i++
    ) {
      doc.switchToPage(i);

      doc
        .fontSize(7)
        .font('Helvetica')
        .fillColor('#94a3b8')
        .text(
          `${organization.name || 'Temple Management'} • ${financialYear}`,
          50,
          800,
          {
            width: 300,
          }
        );

      doc
        .text(
          `Page ${i + 1}`,
          445,
          800,
          {
            width: 100,
            align: 'right',
          }
        );
    }

    doc.end();

    await pdfPromise;

    const pdfBuffer =
      Buffer.concat(chunks);

    const filename =
      `${sanitizeFilename(
        organization.name
      ) || 'temple'}-financial-report-${financialYear}.pdf`;

    return new NextResponse(
      pdfBuffer,
      {
        status: 200,
        headers: {
          'Content-Type':
            'application/pdf',
          'Content-Disposition':
            `attachment; filename="${filename}"`,
          'Content-Length':
            String(
              pdfBuffer.length
            ),
          'Cache-Control':
            'no-store',
        },
      }
    );
  } catch (error) {
    console.error(
      'Financial PDF error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to generate financial report PDF',
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}
'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useDashboard } from '@/app/dashboard/DashboardShell';

const PAYMENT_METHOD_LABELS = {
  cash: 'Cash',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  card: 'Card',
  other: 'Other',
};

function getCurrentFinancialYear() {
  const now = new Date();

  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  if (month >= 4) {
    return `${year}-${String(year + 1).slice(-2)}`;
  }

  return `${year - 1}-${String(year).slice(-2)}`;
}

function getFinancialYears(count = 5) {
  const currentFinancialYear =
    getCurrentFinancialYear();

  const startYear = Number(
    currentFinancialYear.split('-')[0]
  );

  return Array.from(
    { length: count },
    (_, index) => {
      const year = startYear - index;

      return `${year}-${String(year + 1).slice(-2)}`;
    }
  );
}

function formatCurrency(value) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-IN').format(
    Number(value || 0)
  );
}

function paymentMethodLabel(value) {
  return (
    PAYMENT_METHOD_LABELS[value] ||
    value ||
    'Unknown'
  );
}

function csvEscape(value) {
  const stringValue =
    value === null || value === undefined
      ? ''
      : String(value);

  return `"${stringValue.replace(/"/g, '""')}"`;
}

function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) =>
      row.map(csvEscape).join(',')
    )
    .join('\r\n');

  const blob = new Blob(
    ['\ufeff' + csv],
    {
      type: 'text/csv;charset=utf-8;',
    }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);

  link.click();

  link.remove();

  URL.revokeObjectURL(url);
}

function CardIcon({ type }) {
  if (type === 'opening') {
    return (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="2"
        />

        <path d="M7 9h10" />

        <path d="M7 13h5" />
      </svg>
    );
  }

  if (type === 'donation') {
    return (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7"
          strokeLinecap="round"
        />

        <path
          d="M4 7h16v5H4z"
          strokeLinejoin="round"
        />

        <path
          d="M12 7v12"
          strokeLinecap="round"
        />

        <path
          d="M12 7H8.5a2.5 2.5 0 1 1 0-5C10.5 2 12 7 12 7Z"
          strokeLinejoin="round"
        />

        <path
          d="M12 7h3.5a2.5 2.5 0 1 0 0-5C13.5 2 12 7 12 7Z"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === 'expense') {
    return (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="2"
        />

        <path
          d="M3 9h18"
          strokeLinecap="round"
        />

        <path
          d="M8 14h3"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        d="M3 17 9 11l4 4 8-9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M15 6h6v6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReportCard({
  title,
  value,
  description,
  type,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <CardIcon type={type} />
        </div>
      </div>
    </div>
  );
}

function CountCard({
  title,
  value,
  description,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {formatNumber(value)}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

function PrintSummaryItem({
  label,
  value,
}) {
  return (
    <div className="border border-slate-200 p-3">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function LegendItem({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm text-slate-600">
        {label}
      </span>

      <span className="text-sm font-semibold text-slate-900">
        {value}
      </span>
    </div>
  );
}

function MonthlyActivityChart({
  data,
}) {
  if (!data?.length) {
    return (
      <EmptyState
        title="No monthly data"
        description="There is no transaction activity for this financial year."
      />
    );
  }

  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 10,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
          />

          <XAxis
            dataKey="month"
            tick={{
              fontSize: 12,
            }}
          />

          <YAxis
            tick={{
              fontSize: 12,
            }}
            tickFormatter={(value) =>
              `₹${Number(value).toLocaleString('en-IN')}`
            }
          />

          <Tooltip
            formatter={(value) =>
              formatCurrency(value)
            }
          />

          <Bar
            dataKey="donations"
            name="Donations"
            fill="#16a34a"
            radius={[5, 5, 0, 0]}
          />

          <Bar
            dataKey="expenses"
            name="Expenses"
            fill="#dc2626"
            radius={[5, 5, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ExpenseCategoryChart({
  data,
}) {
  if (!data?.length) {
    return (
      <EmptyState
        title="No expense data"
        description="There are no active expenses for this financial year."
      />
    );
  }

  const chartData = data.map((item) => ({
    name: item.category,
    value: Number(item.amount || 0),
  }));

  const colors = [
    '#4f46e5',
    '#0891b2',
    '#16a34a',
    '#d97706',
    '#dc2626',
    '#9333ea',
    '#0f766e',
    '#475569',
  ];

  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={115}
            innerRadius={65}
            paddingAngle={2}
          >
            {chartData.map(
              (entry, index) => (
                <Cell
                  key={`${entry.name}-${index}`}
                  fill={
                    colors[
                      index %
                        colors.length
                    ]
                  }
                />
              )
            )}
          </Pie>

          <Tooltip
            formatter={(value) =>
              formatCurrency(value)
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function PaymentMethodSection({
  title,
  data,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">
        {title}
      </h3>

      {data?.length ? (
        <div className="mt-4 divide-y divide-slate-100">
          {data.map((item) => (
            <LegendItem
              key={item.paymentMethod}
              label={paymentMethodLabel(
                item.paymentMethod
              )}
              value={formatCurrency(
                item.amount
              )}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState
            title="No data"
            description="No transactions found."
          />
        </div>
      )}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-[340px] animate-pulse rounded-xl bg-slate-100" />
  );
}

function ReportTableSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-10 rounded-lg bg-slate-100" />
      <div className="h-10 rounded-lg bg-slate-100" />
      <div className="h-10 rounded-lg bg-slate-100" />
      <div className="h-10 rounded-lg bg-slate-100" />
    </div>
  );
}

function EmptyState({
  title,
  description,
}) {
  return (
    <div className="flex min-h-[140px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            d="M9 12h6"
            strokeLinecap="round"
          />

          <path
            d="M12 9v6"
            strokeLinecap="round"
          />

          <rect
            x="4"
            y="4"
            width="16"
            height="16"
            rx="3"
          />
        </svg>
      </div>

      <p className="mt-3 text-sm font-semibold text-slate-800">
        {title}
      </p>

      <p className="mt-1 max-w-md text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

export default function ReportsPage() {
  const { organization } =
    useDashboard();

  const financialYears = useMemo(
    () => getFinancialYears(5),
    []
  );

  const [selectedFinancialYear, setSelectedFinancialYear] =
    useState(
      getCurrentFinancialYear()
    );

  const [report, setReport] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadReport() {
      try {
        setLoading(true);
        setError('');

        const response =
          await fetch(
            `/api/reports?financialYear=${encodeURIComponent(
              selectedFinancialYear
            )}`,
            {
              method: 'GET',
              cache: 'no-store',
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              'Failed to load report'
          );
        }

        if (!cancelled) {
          setReport(result.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
              'Failed to load report'
          );

          setReport(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadReport();

    return () => {
      cancelled = true;
    };
  }, [selectedFinancialYear]);

  function handlePrint() {
    window.print();
  }

  function handleExportCsv() {
    if (!report) {
      return;
    }

    const rows = [];

    rows.push([
      organization?.name ||
        'Temple Management',
    ]);

    rows.push([
      'Financial Year',
      selectedFinancialYear,
    ]);

    rows.push([]);

    rows.push([
      'Financial Summary',
    ]);

    rows.push([
      'Opening Balance',
      report.summary.openingBalance,
    ]);

    rows.push([
      'Total Donations',
      report.summary.totalDonations,
    ]);

    rows.push([
      'Total Expenses',
      report.summary.totalExpenses,
    ]);

    rows.push([
      'Closing Balance',
      report.summary.currentBalance,
    ]);

    rows.push([
      'Donation Transactions',
      report.summary.donationCount,
    ]);

    rows.push([
      'Expense Transactions',
      report.summary.expenseCount,
    ]);

    rows.push([]);

    rows.push([
      'Monthly Summary',
    ]);

    rows.push([
      'Month',
      'Year',
      'Donations',
      'Donation Count',
      'Expenses',
      'Expense Count',
    ]);

    (
      report.monthlySummary || []
    ).forEach((month) => {
      rows.push([
        month.month,
        month.year,
        month.donations,
        month.donationCount,
        month.expenses,
        month.expenseCount,
      ]);
    });

    rows.push([]);

    rows.push([
      'Donation Payment Methods',
    ]);

    rows.push([
      'Payment Method',
      'Amount',
      'Count',
    ]);

    (
      report.donationPaymentMethods ||
      []
    ).forEach((item) => {
      rows.push([
        paymentMethodLabel(
          item.paymentMethod
        ),
        item.amount,
        item.count,
      ]);
    });

    rows.push([]);

    rows.push([
      'Expense Payment Methods',
    ]);

    rows.push([
      'Payment Method',
      'Amount',
      'Count',
    ]);

    (
      report.expensePaymentMethods ||
      []
    ).forEach((item) => {
      rows.push([
        paymentMethodLabel(
          item.paymentMethod
        ),
        item.amount,
        item.count,
      ]);
    });

    rows.push([]);

    rows.push([
      'Expense Categories',
    ]);

    rows.push([
      'Category',
      'Amount',
      'Count',
    ]);

    (
      report.expenseCategories ||
      []
    ).forEach((item) => {
      rows.push([
        item.category,
        item.amount,
        item.count,
      ]);
    });

    rows.push([]);

    rows.push([
      'Top Donors',
    ]);

    rows.push([
      'Donor',
      'Phone',
      'Donation Count',
      'Amount',
    ]);

    (
      report.topDonors || []
    ).forEach((donor) => {
      rows.push([
        donor.donorName,
        donor.phone || '',
        donor.donationCount,
        donor.amount,
      ]);
    });

    const safeOrganizationName =
      (
        organization?.name ||
        'temple'
      )
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    const filename =
      `${
        safeOrganizationName ||
        'temple'
      }-financial-report-${selectedFinancialYear}.csv`;

    downloadCsv(
      filename,
      rows
    );
  }

  function handleExportPdf() {
    if (!report) {
      return;
    }

    const url =
      `/api/reports/pdf?financialYear=${encodeURIComponent(
        selectedFinancialYear
      )}`;

    window.location.href = url;
  }

  return (
    <div className="min-h-full bg-slate-50">
      {/* Print Header */}
      <div className="hidden print:block">
        <div className="border-b-2 border-slate-900 pb-4">
          <h1 className="text-2xl font-bold text-slate-900">
            {organization?.name ||
              'Temple Management'}
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            Financial Report
          </p>

          <p className="mt-1 text-sm font-medium text-slate-800">
            Financial Year:{' '}
            {selectedFinancialYear}
          </p>

          {organization?.address ? (
            <p className="mt-1 text-xs text-slate-500">
              {organization.address}

              {organization.city
                ? `, ${organization.city}`
                : ''}

              {organization.state
                ? `, ${organization.state}`
                : ''}
            </p>
          ) : null}
        </div>
      </div>

      {/* Header */}
      <div className="print:hidden">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-600">
              Financial Reports
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Reports & Analytics
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Review donations, expenses,
              balances and financial
              activity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={
                selectedFinancialYear
              }
              onChange={(event) =>
                setSelectedFinancialYear(
                  event.target.value
                )
              }
              disabled={loading}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {financialYears.map(
                (financialYear) => (
                  <option
                    key={financialYear}
                    value={financialYear}
                  >
                    {financialYear}
                  </option>
                )
              )}
            </select>

            {/* CSV */}
            <button
              type="button"
              onClick={
                handleExportCsv
              }
              disabled={
                loading || !report
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M12 3v12"
                  strokeLinecap="round"
                />

                <path
                  d="m7 10 5 5 5-5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M5 21h14"
                  strokeLinecap="round"
                />
              </svg>

              Export CSV
            </button>

            {/* PDF */}
            <button
              type="button"
              onClick={
                handleExportPdf
              }
              disabled={
                loading || !report
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M6 2h9l5 5v15H6z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M14 2v6h6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M9 13h6"
                  strokeLinecap="round"
                />

                <path
                  d="M9 17h6"
                  strokeLinecap="round"
                />
              </svg>

              Export PDF
            </button>

            {/* Print */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={
                loading || !report
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M6 9V3h12v6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M6 14h12v7H6z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              Print Report
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error ? (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-red-800">
              Unable to load report
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setSelectedFinancialYear(
                getCurrentFinancialYear()
              )
            }
            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            Retry
          </button>
        </div>
      ) : null}

      {/* Loading */}
      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="h-32 animate-pulse rounded-2xl bg-white shadow-sm"
                />
              )
            )}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-5 h-5 w-40 animate-pulse rounded bg-slate-100" />

              <ChartSkeleton />
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-5 h-5 w-40 animate-pulse rounded bg-slate-100" />

              <ChartSkeleton />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <ReportTableSkeleton />
          </div>
        </div>
      ) : null}

      {/* Report */}
      {!loading && report ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 print:hidden">
            <ReportCard
              title="Opening Balance"
              value={formatCurrency(
                report.summary
                  .openingBalance
              )}
              description="Balance carried into the financial year"
              type="opening"
            />

            <ReportCard
              title="Total Donations"
              value={formatCurrency(
                report.summary
                  .totalDonations
              )}
              description="Active donations received"
              type="donation"
            />

            <ReportCard
              title="Total Expenses"
              value={formatCurrency(
                report.summary
                  .totalExpenses
              )}
              description="Active expenses recorded"
              type="expense"
            />

            <ReportCard
              title="Closing Balance"
              value={formatCurrency(
                report.summary
                  .currentBalance
              )}
              description="Current balance"
              type="balance"
            />
          </div>

          {/* Print Summary */}
          <div className="hidden print:block">
            <section className="mb-6">
              <h2 className="mb-3 text-lg font-bold text-slate-900">
                Financial Summary
              </h2>

              <div className="grid grid-cols-4 gap-3">
                <PrintSummaryItem
                  label="Opening Balance"
                  value={formatCurrency(
                    report.summary
                      .openingBalance
                  )}
                />

                <PrintSummaryItem
                  label="Total Donations"
                  value={formatCurrency(
                    report.summary
                      .totalDonations
                  )}
                />

                <PrintSummaryItem
                  label="Total Expenses"
                  value={formatCurrency(
                    report.summary
                      .totalExpenses
                  )}
                />

                <PrintSummaryItem
                  label="Closing Balance"
                  value={formatCurrency(
                    report.summary
                      .currentBalance
                  )}
                />
              </div>
            </section>
          </div>

          {/* Transaction Overview */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                Transaction Overview
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Activity recorded during{' '}
                {selectedFinancialYear}.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 print:grid-cols-2">
              <CountCard
                title="Donation Transactions"
                value={
                  report.summary
                    .donationCount
                }
                description="Active donation records"
              />

              <CountCard
                title="Expense Transactions"
                value={
                  report.summary
                    .expenseCount
                }
                description="Active expense records"
              />
            </div>
          </section>

          {/* Charts */}
          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm print:hidden">
              <div className="mb-5">
                <h2 className="text-base font-semibold text-slate-900">
                  Monthly Activity
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Donations versus expenses by month.
                </p>
              </div>

              <MonthlyActivityChart
                data={
                  report.monthlySummary
                }
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm print:hidden">
              <div className="mb-5">
                <h2 className="text-base font-semibold text-slate-900">
                  Expense Distribution
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Expense amount grouped by category.
                </p>
              </div>

              <ExpenseCategoryChart
                data={
                  report.expenseCategories
                }
              />
            </div>
          </section>

          {/* Monthly Summary */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-slate-900">
                Monthly Summary
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Month-wise financial activity.
              </p>
            </div>

            {report.monthlySummary
              ?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Month
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Donations
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Donation Count
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Expenses
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Expense Count
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Net
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {report.monthlySummary.map(
                      (month) => {
                        const net =
                          Number(
                            month.donations ||
                              0
                          ) -
                          Number(
                            month.expenses ||
                              0
                          );

                        return (
                          <tr
                            key={`${month.year}-${month.month}`}
                            className="border-b border-slate-100 last:border-0"
                          >
                            <td className="px-4 py-3 text-sm font-medium text-slate-800">
                              {month.month}
                            </td>

                            <td className="px-4 py-3 text-right text-sm font-medium text-green-600">
                              {formatCurrency(
                                month.donations
                              )}
                            </td>

                            <td className="px-4 py-3 text-right text-sm text-slate-600">
                              {formatNumber(
                                month.donationCount
                              )}
                            </td>

                            <td className="px-4 py-3 text-right text-sm font-medium text-red-600">
                              {formatCurrency(
                                month.expenses
                              )}
                            </td>

                            <td className="px-4 py-3 text-right text-sm text-slate-600">
                              {formatNumber(
                                month.expenseCount
                              )}
                            </td>

                            <td
                              className={`px-4 py-3 text-right text-sm font-semibold ${
                                net >= 0
                                  ? 'text-slate-900'
                                  : 'text-red-600'
                              }`}
                            >
                              {formatCurrency(
                                net
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No monthly data"
                description="No transactions were recorded during this financial year."
              />
            )}
          </section>

          {/* Payment Methods */}
          <section className="grid gap-6 xl:grid-cols-2">
            <PaymentMethodSection
              title="Donation Payment Methods"
              data={
                report.donationPaymentMethods
              }
            />

            <PaymentMethodSection
              title="Expense Payment Methods"
              data={
                report.expensePaymentMethods
              }
            />
          </section>

          {/* Expense Categories */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-slate-900">
                Expense Categories
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Breakdown of active expenses by category.
              </p>
            </div>

            {report.expenseCategories
              ?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Category
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Amount
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Transactions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {report.expenseCategories.map(
                      (item) => (
                        <tr
                          key={item.category}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="px-4 py-3 text-sm font-medium text-slate-800">
                            {item.category}
                          </td>

                          <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                            {formatCurrency(
                              item.amount
                            )}
                          </td>

                          <td className="px-4 py-3 text-right text-sm text-slate-600">
                            {formatNumber(
                              item.count
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No expense categories"
                description="No active expenses are available for this financial year."
              />
            )}
          </section>

          {/* Top Donors */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-slate-900">
                Top Donors
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Donors ranked by total donation amount.
              </p>
            </div>

            {report.topDonors?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Donor
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Phone
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Donations
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {report.topDonors.map(
                      (donor, index) => (
                        <tr
                          key={`${donor.donorName}-${index}`}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600">
                                {(
                                  donor.donorName ||
                                  '?'
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <span className="text-sm font-medium text-slate-800">
                                {
                                  donor.donorName
                                }
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-sm text-slate-600">
                            {donor.phone ||
                              '—'}
                          </td>

                          <td className="px-4 py-3 text-right text-sm text-slate-600">
                            {formatNumber(
                              donor.donationCount
                            )}
                          </td>

                          <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                            {formatCurrency(
                              donor.amount
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No donors"
                description="No active donations are available for this financial year."
              />
            )}
          </section>

          {/* Print Footer */}
          <div className="hidden print:block">
            <div className="mt-10 border-t border-slate-300 pt-6">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-slate-500">
                    Generated on
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {new Date().toLocaleDateString(
                      'en-IN',
                      {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      }
                    )}
                  </p>
                </div>

                <div className="w-52 text-center">
                  <div className="border-b border-slate-400 pb-8" />

                  <p className="mt-2 text-xs font-medium text-slate-600">
                    Authorized Signature
                  </p>
                </div>
              </div>

              <p className="mt-8 text-center text-[10px] text-slate-400">
                This report is generated from the Temple Management System.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useDashboard,
} from '@/app/dashboard/DashboardShell';

function formatCurrency(amount) {
  return `₹${Number(
    amount || 0
  ).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getCurrentFinancialYear() {
  const now = new Date();

  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  if (month >= 4) {
    return `${year}-${String(
      year + 1
    ).slice(-2)}`;
  }

  return `${year - 1}-${String(
    year
  ).slice(-2)}`;
}

function getFinancialYears(count = 5) {
  const currentYear =
    new Date().getFullYear();

  const currentMonth =
    new Date().getMonth() + 1;

  const currentFinancialStartYear =
    currentMonth >= 4
      ? currentYear
      : currentYear - 1;

  return Array.from(
    {
      length: count,
    },
    (_, index) => {
      const startYear =
        currentFinancialStartYear -
        index;

      return `${startYear}-${String(
        startYear + 1
      ).slice(-2)}`;
    }
  );
}

export default function DashboardClient() {
  const {
    user,
    organization,
  } = useDashboard();

  const currentFinancialYear =
    useMemo(
      () =>
        getCurrentFinancialYear(),
      []
    );

  const financialYears =
    useMemo(
      () =>
        getFinancialYears(5),
      []
    );

  const [
    selectedFinancialYear,
    setSelectedFinancialYear,
  ] = useState(
    currentFinancialYear
  );

  const [balance, setBalance] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  async function loadBalance(
    financialYear
  ) {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `/api/organization/balance?financialYear=${encodeURIComponent(
          financialYear
        )}`,
        {
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
            'Failed to load financial summary'
        );
      }

      setBalance(
        result.data
      );
    } catch (error) {
      console.error(
        'Dashboard balance error:',
        error
      );

      setError(
        error.message ||
          'Failed to load financial summary'
      );

      setBalance(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBalance(
      currentFinancialYear
    );
  }, [
    currentFinancialYear,
  ]);

  function handleFinancialYearChange(
    event
  ) {
    const financialYear =
      event.target.value;

    setSelectedFinancialYear(
      financialYear
    );

    loadBalance(
      financialYear
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Welcome back,{' '}
            <span className="font-medium text-slate-700">
              {user?.name || 'Admin'}
            </span>
            . Here is your temple's
            financial overview.
          </p>
        </div>

        {/* Financial Year Selector */}
        <div className="w-full lg:w-auto">
          <label
            htmlFor="financial-year"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400"
          >
            Financial Year
          </label>

          <div className="relative">
            <select
              id="financial-year"
              value={
                selectedFinancialYear
              }
              onChange={
                handleFinancialYearChange
              }
              disabled={loading}
              className="h-11 w-full min-w-[180px] appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {financialYears.map(
                (financialYear) => (
                  <option
                    key={
                      financialYear
                    }
                    value={
                      financialYear
                    }
                  >
                    {financialYear}
                    {financialYear ===
                      currentFinancialYear
                      ? ' (Current)'
                      : ''}
                  </option>
                )
              )}
            </select>

            <svg
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Selected Year Info */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Financial Year
          </p>

          <p className="mt-1 text-lg font-semibold text-slate-900">
            {selectedFinancialYear}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span
            className={`h-2 w-2 rounded-full ${
              loading
                ? 'animate-pulse bg-amber-500'
                : 'bg-green-500'
            }`}
          />

          {loading
            ? 'Loading financial data...'
            : selectedFinancialYear ===
              currentFinancialYear
            ? 'Current financial year'
            : 'Historical financial year'}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <svg
            className="mt-0.5 h-5 w-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
            />

            <path d="M12 8v4" />

            <path d="M12 16h.01" />
          </svg>

          <div className="flex-1">
            <p className="font-medium">
              Unable to load financial summary
            </p>

            <p className="mt-1">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              loadBalance(
                selectedFinancialYear
              )
            }
            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
          >
            Retry
          </button>
        </div>
      )}

      {/* Financial Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FinancialCard
          title="Opening Balance"
          value={
            loading
              ? null
              : formatCurrency(
                  balance?.openingBalance
                )
          }
          subtitle={`Starting balance · ${selectedFinancialYear}`}
          icon="wallet"
          loading={loading}
        />

        <FinancialCard
          title="Total Donations"
          value={
            loading
              ? null
              : formatCurrency(
                  balance?.totalDonations
                )
          }
          subtitle={
            loading
              ? 'Loading...'
              : `${
                  balance?.donationCount ||
                  0
                } active donation${
                  balance?.donationCount ===
                  1
                    ? ''
                    : 's'
                }`
          }
          icon="donation"
          loading={loading}
        />

        <FinancialCard
          title="Total Expenses"
          value={
            loading
              ? null
              : formatCurrency(
                  balance?.totalExpenses
                )
          }
          subtitle={
            loading
              ? 'Loading...'
              : `${
                  balance?.expenseCount ||
                  0
                } active expense${
                  balance?.expenseCount ===
                  1
                    ? ''
                    : 's'
                }`
          }
          icon="expense"
          loading={loading}
        />

        <FinancialCard
          title="Current Balance"
          value={
            loading
              ? null
              : formatCurrency(
                  balance?.currentBalance
                )
          }
          subtitle="Available balance"
          icon="balance"
          loading={loading}
          highlight
        />
      </div>

      {/* Financial Summary */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Financial Summary
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Balance calculation for{' '}
                {selectedFinancialYear}.
              </p>
            </div>

            {selectedFinancialYear !==
              currentFinancialYear && (
              <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                Historical
              </span>
            )}
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              <div className="h-12 animate-pulse rounded-xl bg-slate-100" />

              <div className="h-12 animate-pulse rounded-xl bg-slate-100" />

              <div className="h-12 animate-pulse rounded-xl bg-slate-100" />

              <div className="h-px bg-slate-200" />

              <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
            </div>
          ) : (
            <div className="space-y-4">
              <SummaryRow
                label="Opening Balance"
                amount={
                  balance?.openingBalance
                }
              />

              <SummaryRow
                label="Add: Donations"
                amount={
                  balance?.totalDonations
                }
                positive
              />

              <SummaryRow
                label="Less: Expenses"
                amount={
                  balance?.totalExpenses
                }
                negative
              />

              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Current Balance
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Opening balance + donations
                      − expenses
                    </p>
                  </div>

                  <p
                    className={`text-xl font-bold ${
                      Number(
                        balance?.currentBalance ||
                          0
                      ) < 0
                        ? 'text-red-600'
                        : 'text-slate-900'
                    }`}
                  >
                    {formatCurrency(
                      balance?.currentBalance
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Quick Links */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InfoCard
          title="Donations"
          description="Manage donors, record donations and view complete donor history."
          href="/dashboard/donations"
          label="View Donations"
          icon="donation"
        />

        <InfoCard
          title="Expenses"
          description="Track temple expenses, payment methods and financial activity."
          href="/dashboard/expenses"
          label="View Expenses"
          icon="expense"
        />
      </div>
    </div>
  );
}

function FinancialCard({
  title,
  value,
  subtitle,
  icon,
  loading,
  highlight = false,
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
        highlight
          ? 'border-indigo-200 ring-1 ring-indigo-50'
          : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            highlight
              ? 'bg-indigo-50 text-indigo-600'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          <CardIcon type={icon} />
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>

        {loading ? (
          <div className="mt-2 h-8 w-32 animate-pulse rounded-lg bg-slate-100" />
        ) : (
          <p
            className={`mt-1 text-2xl font-bold tracking-tight ${
              highlight
                ? 'text-indigo-600'
                : 'text-slate-900'
            }`}
          >
            {value}
          </p>
        )}

        <p className="mt-2 text-xs text-slate-400">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  amount,
  positive,
  negative,
}) {
  let amountClass =
    'text-slate-900';

  if (positive) {
    amountClass =
      'text-green-600';
  }

  if (negative) {
    amountClass =
      'text-red-600';
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm font-medium text-slate-600">
        {label}
      </p>

      <p
        className={`text-sm font-semibold ${amountClass}`}
      >
        {positive && '+'}

        {negative && '-'}

        {formatCurrency(
          Math.abs(
            Number(amount || 0)
          )
        )}
      </p>
    </div>
  );
}

function InfoCard({
  title,
  description,
  href,
  label,
  icon,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <CardIcon type={icon} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900">
            {title}
          </h3>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>

          <a
            href={href}
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
          >
            {label}

            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14" />

              <path d="m13 6 6 6-6 6" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

function CardIcon({ type }) {
  if (type === 'wallet') {
    return (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H20v14H6.5A2.5 2.5 0 0 1 4 16.5z" />

        <path d="M4 8h16" />

        <path d="M16 12h2" />
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
        <rect
          x="3"
          y="6"
          width="18"
          height="13"
          rx="2"
        />

        <path d="M3 10h18" />

        <path d="M12 13v4" />

        <path d="M10 15h4" />
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

        <path d="M7 9h10" />

        <path d="M7 13h5" />

        <path d="M7 16h3" />
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
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M8 12h8" />

      <path d="M12 8v8" />
    </svg>
  );
}
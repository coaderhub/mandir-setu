'use client';

import Link from 'next/link';

import {
  useDashboard,
} from './DashboardShell';

export default function DashboardClient() {
  const {
    user,
    organization,
  } = useDashboard();

  const isAdmin =
    user?.role === 'admin';

  const firstName =
    user?.name?.split(' ')[0] ||
    'User';

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1600px]">

        {/* Welcome */}
        <section className="mb-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">

            <div>
              <p className="mb-2 text-sm font-medium text-indigo-600">
                Welcome back
              </p>

              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Good to see you,{' '}
                {firstName}
              </h2>

              <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
                Here is an overview of your
                temple management activity.
              </p>
            </div>

            <div className="text-sm text-slate-500">
              {formatToday()}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Total Donations"
            value="₹0"
            description="This financial year"
            icon="₹"
          />

          <StatCard
            title="Total Expenses"
            value="₹0"
            description="This financial year"
            icon="↗"
          />

          <StatCard
            title="Current Balance"
            value="₹0"
            description="Available balance"
            icon="◈"
          />

          <StatCard
            title="Total Donors"
            value="0"
            description="Registered donors"
            icon="♙"
          />

        </section>

        {/* Activity + Quick Actions */}
        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">

          {/* Activity */}
          <div className="rounded-2xl border border-slate-200 bg-white xl:col-span-2">

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5 sm:px-6">

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Recent Activity
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Latest temple transactions and
                  activities.
                </p>
              </div>

              <Link
                href="/dashboard/reports"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                View reports
              </Link>
            </div>

            <div className="px-5 py-10 sm:px-6">
              <EmptyState
                icon="◷"
                title="No recent activity"
                description="Donation, expense and other activities will appear here once transactions are recorded."
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-slate-200 bg-white">

            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">

              <h3 className="text-base font-bold text-slate-900">
                Quick Actions
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Frequently used temple operations.
              </p>
            </div>

            <div className="grid gap-3 p-5 sm:p-6">

              <QuickAction
                href="/dashboard/donations"
                icon="₹"
                title="Record Donation"
                description="Add a new donation"
              />

              <QuickAction
                href="/dashboard/expenses"
                icon="↗"
                title="Record Expense"
                description="Add a new expense"
              />

              <QuickAction
                href="/dashboard/donors"
                icon="♙"
                title="Manage Donors"
                description="View donor records"
              />

              {isAdmin && (
                <QuickAction
                  href="/dashboard/reports"
                  icon="▤"
                  title="View Reports"
                  description="Financial reports"
                />
              )}

            </div>
          </div>
        </section>

        {/* Information */}
        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Temple */}
          <div className="rounded-2xl border border-slate-200 bg-white">

            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">

              <h3 className="text-base font-bold text-slate-900">
                Temple Information
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Your organization details.
              </p>
            </div>

            <div className="space-y-5 p-5 sm:p-6">

              <DetailRow
                label="Temple"
                value={
                  organization?.name
                }
              />

              <DetailRow
                label="Address"
                value={
                  organization?.address ||
                  'Not provided'
                }
              />

              <DetailRow
                label="Location"
                value={formatLocation(
                  organization
                )}
              />

              <DetailRow
                label="Phone"
                value={
                  organization?.phone ||
                  'Not provided'
                }
              />

              <DetailRow
                label="Email"
                value={
                  organization?.email ||
                  'Not provided'
                }
              />

            </div>
          </div>

          {/* Account */}
          <div className="rounded-2xl border border-slate-200 bg-white">

            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">

              <h3 className="text-base font-bold text-slate-900">
                Account Information
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Your current account details.
              </p>
            </div>

            <div className="space-y-5 p-5 sm:p-6">

              <DetailRow
                label="Name"
                value={user?.name}
              />

              <DetailRow
                label="Email"
                value={user?.email}
              />

              <DetailRow
                label="Role"
                value={capitalize(
                  user?.role
                )}
              />

              <DetailRow
                label="Phone"
                value={
                  user?.phone ||
                  'Not provided'
                }
              />

              <div className="flex items-center justify-between gap-4">

                <span className="text-sm text-slate-500">
                  Account status
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">

                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                  Active
                </span>
              </div>

            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 text-center text-xs text-slate-400">
          {organization?.name ||
            'Temple Management'}{' '}
          · Temple Management System
        </footer>

      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md sm:p-6">

      <div className="flex items-start justify-between gap-4">

        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg font-bold text-indigo-600">
          {icon}
        </div>

      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  description,
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-indigo-200 hover:bg-indigo-50/50"
    >

      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-600 transition group-hover:bg-indigo-100 group-hover:text-indigo-600">
        {icon}
      </span>

      <span className="min-w-0">

        <span className="block text-sm font-semibold text-slate-900">
          {title}
        </span>

        <span className="mt-0.5 block text-xs text-slate-500">
          {description}
        </span>

      </span>

      <span className="ml-auto text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500">
        →
      </span>

    </Link>
  );
}

function EmptyState({
  icon,
  title,
  description,
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center">

      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-400">
        {icon}
      </div>

      <h4 className="text-sm font-bold text-slate-900">
        {title}
      </h4>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>

    </div>
  );
}

function DetailRow({
  label,
  value,
}) {
  return (
    <div className="flex items-start justify-between gap-6">

      <span className="shrink-0 text-sm text-slate-500">
        {label}
      </span>

      <span className="text-right text-sm font-semibold text-slate-900">
        {value || '-'}
      </span>

    </div>
  );
}

function capitalize(value) {
  if (!value) {
    return '-';
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

function formatToday() {
  return new Intl.DateTimeFormat(
    'en-IN',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  ).format(new Date());
}

function formatLocation(
  organization
) {
  const parts = [
    organization?.city,
    organization?.state,
    organization?.country,
  ].filter(Boolean);

  return parts.length
    ? parts.join(', ')
    : 'Not provided';
}
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  Heart,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
};

const formatDate = (date) => {
  if (!date) return '';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
};

async function getTemple(slug) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000';

  try {
    const response = await fetch(
      `${baseUrl}/api/public/temple/${encodeURIComponent(slug)}`,
      {
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return null;
    }

    const result = await response.json();

    if (!result.success) {
      return null;
    }

    return result.data;
  } catch (error) {
    console.error('Public temple fetch error:', error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;

  const temple = await getTemple(slug);

  if (!temple) {
    return {
      title: 'Temple Not Found',
    };
  }

  return {
    title: temple.organization.name,
    description:
      temple.organization.description ||
      `Official public page of ${temple.organization.name}.`,
  };
}

export default async function PublicTemplePage({ params }) {
  const { slug } = await params;

  const temple = await getTemple(slug);

  if (!temple) {
    notFound();
  }

  const {
    organization,
    settings,
    donations = [],
    balance,
    financialYear,
  } = temple;

  const fullAddress = [
    organization.address,
    organization.city,
    organization.state,
    organization.country,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            {organization.logo ? (
              <img
                src={organization.logo}
                alt={`${organization.name} logo`}
                className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Building2 size={20} strokeWidth={1.8} />
              </div>
            )}

            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold text-slate-900 sm:text-base">
                {organization.name}
              </h1>

              {(organization.city || organization.state) && (
                <p className="truncate text-xs text-slate-500">
                  {[organization.city, organization.state]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 sm:flex">
            <ShieldCheck
              size={14}
              className="text-emerald-600"
            />

            Official Temple Page
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-indigo-50 blur-3xl" />

        <div className="absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-slate-100 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
              <CheckCircle2 size={14} />

              Welcome
            </div>

            <h2 className="mt-5 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              {organization.name}
            </h2>

            {organization.description && (
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                {organization.description}
              </p>
            )}

            {fullAddress && (
              <div className="mt-6 flex max-w-2xl items-start gap-3 text-sm leading-6 text-slate-600">
                <MapPin
                  size={18}
                  className="mt-1 shrink-0 text-indigo-600"
                />

                <span>{fullAddress}</span>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              {organization.phone && (
                <a
                  href={`tel:${organization.phone}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <Phone size={16} />

                  Contact Temple
                </a>
              )}

              {organization.email && (
                <a
                  href={`mailto:${organization.email}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <Mail size={16} />

                  Send Email
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Balance */}
      {settings.showBalance && balance && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <WalletCards size={21} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Financial Overview
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Financial Year {financialYear}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <CalendarDays size={14} />

                  {financialYear}
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Current Balance
                </p>

                <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  {formatCurrency(balance.currentBalance)}
                </p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <FinancialCard
                  label="Opening Balance"
                  value={formatCurrency(
                    balance.openingBalance
                  )}
                />

                <FinancialCard
                  label="Total Donations"
                  value={formatCurrency(
                    balance.totalDonations
                  )}
                />

                <FinancialCard
                  label="Total Expenses"
                  value={formatCurrency(
                    balance.totalExpenses
                  )}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Donations */}
      {settings.showDonations && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600">
                <ReceiptText size={16} />

                Transparency
              </div>

              <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                Recent Donations
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Latest donations for financial year {financialYear}.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Clock3 size={14} />

              Latest 10 records
            </div>
          </div>

          {donations.length > 0 ? (
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="divide-y divide-slate-100">
                {donations.map((donation) => (
                  <div
                    key={donation.id}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-slate-50 sm:px-6"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                        <Heart
                          size={17}
                          strokeWidth={1.8}
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {settings.showDonorNames
                            ? donation.donorName ||
                              'Anonymous'
                            : 'Devotee Donation'}
                        </p>

                        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <CalendarDays size={13} />

                          {formatDate(donation.createdAt)}
                        </div>
                      </div>
                    </div>

                    {settings.showDonationAmounts && (
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-slate-900">
                          {formatCurrency(donation.amount)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <ReceiptText size={21} />
              </div>

              <h4 className="mt-4 text-sm font-semibold text-slate-900">
                No donations available
              </h4>

              <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500">
                Donation information will appear here when
                records are available.
              </p>
            </div>
          )}
        </section>
      )}

      {/* Contact */}
      {(organization.phone ||
        organization.email ||
        fullAddress) && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl bg-slate-950">
            <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-indigo-300">
                  <Building2 size={16} />

                  Temple Information
                </div>

                <h3 className="mt-3 text-2xl font-bold text-white">
                  Visit or contact {organization.name}
                </h3>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  For temple visits, enquiries, donations, or
                  other information, please use the contact
                  details below.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 lg:justify-end">
                {organization.phone && (
                  <a
                    href={`tel:${organization.phone}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    <Phone size={16} />

                    Call
                  </a>
                )}

                {organization.email && (
                  <a
                    href={`mailto:${organization.email}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <Mail size={16} />

                    Email
                  </a>
                )}
              </div>
            </div>

            {fullAddress && (
              <div className="border-t border-slate-800 px-6 py-5 sm:px-8">
                <div className="flex items-start gap-3">
                  <MapPin
                    size={18}
                    className="mt-0.5 shrink-0 text-indigo-300"
                  />

                  <p className="text-sm leading-6 text-slate-300">
                    {fullAddress}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-8 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-7 text-center sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-left lg:px-8">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {organization.name}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Official public information page
            </p>
          </div>

          <p className="text-xs text-slate-500">
            Powered by Temple Management System
          </p>
        </div>
      </footer>
    </main>
  );
}

function FinancialCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1.5 text-lg font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}
import Link from 'next/link';

import {
  ArrowRight,
  Building2,
  CheckCircle2,
  MapPin,
  Search,
  ShieldCheck,
} from 'lucide-react';

export const metadata = {
  title: 'Temple Directory',
  description:
    'Explore temples and view their official public information, contact details, and available transparency information.',
  keywords: [
    'temple directory',
    'temples',
    'temple information',
    'temple management',
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Temple Directory',
    description:
      'Explore temples and view their official public information.',
    type: 'website',
  },
};

async function getTemples() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000';

  try {
    const response = await fetch(
      `${baseUrl}/api/public/temples`,
      {
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return [];
    }

    const result = await response.json();

    if (!result.success) {
      return [];
    }

    return result.data?.temples || [];
  } catch (error) {
    console.error('Temple directory fetch error:', error);

    return [];
  }
}

export default async function TempleDirectoryPage() {
  const temples = await getTemples();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Building2 size={20} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-950 sm:text-base">
                Temple Management
              </p>

              <p className="hidden text-xs text-slate-500 sm:block">
                Public Temple Directory
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
              <ShieldCheck size={14} />

              Official Temple Directory
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Find a Temple
            </h1>

            <p className="mt-4 text-sm leading-6 text-slate-500 sm:text-base">
              Explore official public pages for temples managed
              through the Temple Management System.
            </p>
          </div>

          {/* Search UI */}
          <div className="mx-auto mt-8 max-w-2xl">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
              <Search
                size={19}
                className="shrink-0 text-slate-400"
              />

              <input
                type="search"
                placeholder="Search temples by name, city or state..."
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>

            <p className="mt-3 text-center text-xs text-slate-500">
              {temples.length}{' '}
              {temples.length === 1
                ? 'temple'
                : 'temples'}{' '}
              available
            </p>
          </div>
        </div>
      </section>

      {/* Temple Listing */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {temples.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {temples.map((temple) => (
              <TempleCard
                key={temple.id}
                temple={temple}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-7 text-center sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-left lg:px-8">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Temple Management System
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Official public temple directory
            </p>
          </div>

          <Link
            href="/"
            className="text-xs font-medium text-slate-500 transition hover:text-slate-900"
          >
            Back to Home
          </Link>
        </div>
      </footer>
    </main>
  );
}

/* ============================================================
   TEMPLE CARD
============================================================ */

function TempleCard({ temple }) {
  const location = [
    temple.city,
    temple.state,
    temple.country,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
      {/* Card Header */}
      <div className="border-b border-slate-100 bg-slate-50 p-5">
        <div className="flex items-start justify-between gap-4">
          {temple.logo ? (
            <img
              src={temple.logo}
              alt={`${temple.name} logo`}
              className="h-14 w-14 rounded-xl border border-slate-200 bg-white object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Building2 size={25} strokeWidth={1.7} />
            </div>
          )}

          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            <CheckCircle2 size={12} />

            Active
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-5">
        <h2 className="text-lg font-bold text-slate-950">
          {temple.name}
        </h2>

        {location && (
          <div className="mt-2 flex items-start gap-2 text-xs leading-5 text-slate-500">
            <MapPin
              size={14}
              className="mt-0.5 shrink-0 text-indigo-600"
            />

            <span>{location}</span>
          </div>
        )}

        {temple.description && (
          <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">
            {temple.description}
          </p>
        )}

        {temple.address && (
          <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-400">
            {temple.address}
          </p>
        )}

        {/* Button */}
        <div className="mt-auto pt-6">
          <Link
            href={`/temple/${temple.slug}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            View Temple

            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <Building2 size={25} />
      </div>

      <h2 className="mt-5 text-lg font-bold text-slate-950">
        No temples available
      </h2>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
        There are currently no active temples available
        in the public directory.
      </p>

      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        Back to Home

        <ArrowRight size={15} />
      </Link>
    </div>
  );
}
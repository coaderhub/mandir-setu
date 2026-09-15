import Link from 'next/link';

import {
  ArrowLeft,
  Building2,
  Home,
  SearchX,
} from 'lucide-react';

export default function TempleNotFound() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Building2
                size={20}
                strokeWidth={1.8}
              />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">
                Temple Management
              </p>

              <p className="text-xs text-slate-500">
                Public Portal
              </p>
            </div>
          </Link>
        </div>
      </header>

      {/* Content */}
      <section className="flex min-h-[calc(100vh-64px)] items-center justify-center px-5 py-16">
        <div className="w-full max-w-lg text-center">
          {/* Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200">
            <SearchX
              size={36}
              strokeWidth={1.6}
            />
          </div>

          {/* Status */}
          <p className="mt-7 text-sm font-bold tracking-wider text-indigo-600">
            404
          </p>

          {/* Heading */}
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Temple not found
          </h1>

          {/* Description */}
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
            We couldn't find a temple associated with this
            public URL. The temple may have been removed,
            disabled, or the address may be incorrect.
          </p>

          {/* Actions */}
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <Home size={16} />

              Go to Home
            </Link>

            <Link
              href="/temple"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            >
              <ArrowLeft size={16} />

              Public Temples
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
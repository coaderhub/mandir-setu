import Link from 'next/link';

import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Heart,
  LockKeyhole,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';

import HomeHeader from '@/app/HomeHeader';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <HomeHeader />

      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-slate-50">
        {/* Background decoration */}
        <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-indigo-100/70 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-48 -left-32 h-96 w-96 rounded-full bg-slate-200/70 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Hero Content */}
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm">
                <ShieldCheck size={14} />

                Trusted Temple Management
              </div>

              <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Manage your temple with
                <span className="block text-indigo-600">
                  clarity and transparency.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                A modern management platform designed to
                help temples organize donations, expenses,
                financial records, reports, users, and public
                information from one secure system.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Access Management Portal

                  <ArrowRight size={17} />
                </Link>

                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                >
                  Explore Features

                  <ChevronRight size={17} />
                </a>
              </div>

              {/* Trust Points */}
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
                <TrustPoint>
                  Organization-isolated data
                </TrustPoint>

                <TrustPoint>
                  Audit-ready records
                </TrustPoint>

                <TrustPoint>
                  Public transparency controls
                </TrustPoint>
              </div>
            </div>

            {/* Hero Dashboard Preview */}
            <div className="relative mx-auto w-full max-w-lg lg:ml-auto">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                {/* Preview Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Building2 size={18} />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        Temple Dashboard
                      </p>

                      <p className="text-[11px] text-slate-500">
                        Financial Overview
                      </p>
                    </div>
                  </div>

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <CheckCircle2 size={16} />
                  </div>
                </div>

                {/* Balance */}
                <div className="p-5">
                  <p className="text-xs font-medium text-slate-500">
                    Current Balance
                  </p>

                  <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                    ₹65,000
                  </p>

                  <p className="mt-1 text-xs text-emerald-600">
                    Financial Year 2026-27
                  </p>

                  {/* Preview Cards */}
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <PreviewCard
                      icon={Heart}
                      label="Donations"
                      value="₹25,000"
                    />

                    <PreviewCard
                      icon={WalletCards}
                      label="Expenses"
                      value="₹10,000"
                    />
                  </div>

                  {/* Activity */}
                  <div className="mt-5 rounded-xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-900">
                        Recent Activity
                      </p>

                      <BarChart3
                        size={15}
                        className="text-slate-400"
                      />
                    </div>

                    <div className="mt-4 space-y-3">
                      <ActivityRow
                        label="Donation received"
                        value="+₹5,000"
                      />

                      <ActivityRow
                        label="Temple expense"
                        value="-₹2,000"
                      />

                      <ActivityRow
                        label="Donation received"
                        value="+₹1,000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Security Card */}
              <div className="absolute -bottom-5 -left-5 hidden rounded-xl border border-slate-200 bg-white p-4 shadow-lg sm:block">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <LockKeyhole size={17} />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Secure Access
                    </p>

                    <p className="text-[11px] text-slate-500">
                      Role-based permissions
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FEATURES
      ====================================================== */}
      <section
        id="features"
        className="border-b border-slate-200 bg-white"
      >
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-indigo-600">
              Platform Features
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Everything your temple needs in one place
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-500 sm:text-base">
              Built around simple workflows, financial
              visibility, access control, and transparency.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={Heart}
              title="Donation Management"
              description="Record donations, maintain donor history, track financial years, and monitor payment methods."
            />

            <FeatureCard
              icon={WalletCards}
              title="Financial Management"
              description="Track opening balances, donations, expenses, and current balances with clear financial summaries."
            />

            <FeatureCard
              icon={BarChart3}
              title="Reports & Analytics"
              description="Review financial-year reports, monthly summaries, donor activity, and category-wise information."
            />

            <FeatureCard
              icon={ClipboardCheck}
              title="Audit Logs"
              description="Maintain a detailed history of important actions including creation, updates, voids, and settings changes."
            />

            <FeatureCard
              icon={LockKeyhole}
              title="Role-Based Access"
              description="Separate administrative and cashier access while keeping organization data isolated."
            />

            <FeatureCard
              icon={Building2}
              title="Public Temple Page"
              description="Provide devotees with a professional public page containing temple information and configurable transparency."
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          HOW IT WORKS
      ====================================================== */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold text-indigo-600">
              Simple Workflow
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Manage your temple in three simple steps
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Keep everyday operations organized without
              complicated workflows.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <StepCard
              number="01"
              title="Record"
              description="Record donations, expenses, donors, and opening balances in one centralized system."
            />

            <StepCard
              number="02"
              title="Monitor"
              description="Track balances, financial activity, reports, and important administrative actions."
            />

            <StepCard
              number="03"
              title="Share"
              description="Publish selected temple information and financial transparency through the public temple page."
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          TRANSPARENCY
      ====================================================== */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            {/* Content */}
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <ShieldCheck size={21} />
              </div>

              <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Built with transparency in mind
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                Temples can decide exactly what information
                should be visible publicly while keeping
                administrative and financial management
                protected behind authenticated access.
              </p>

              <div className="mt-7 space-y-4">
                <TrustItem>
                  Organization-isolated data
                </TrustItem>

                <TrustItem>
                  Configurable public information
                </TrustItem>

                <TrustItem>
                  Role-based administrative access
                </TrustItem>

                <TrustItem>
                  Detailed audit history
                </TrustItem>
              </div>
            </div>

            {/* Overview Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Management Overview
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-950">
                    Temple Operations
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <BarChart3 size={19} />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <OverviewRow
                  label="Donations"
                  value="Tracked"
                />

                <OverviewRow
                  label="Expenses"
                  value="Tracked"
                />

                <OverviewRow
                  label="Financial Reports"
                  value="Available"
                />

                <OverviewRow
                  label="Audit History"
                  value="Protected"
                />

                <OverviewRow
                  label="Public Page"
                  value="Configurable"
                />
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-xl bg-emerald-50 p-4">
                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />

                <div>
                  <p className="text-xs font-semibold text-emerald-900">
                    Secure by design
                  </p>

                  <p className="mt-1 text-xs leading-5 text-emerald-700">
                    Public information is controlled separately
                    from protected management data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CTA
      ====================================================== */}
      <section className="bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-indigo-300">
            <Building2 size={22} />
          </div>

          <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Manage your temple with confidence
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            Keep your temple's financial and operational
            information organized, secure, and accessible to
            the right people.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Open Management Portal

              <ArrowRight size={17} />
            </Link>

            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-900"
            >
              Explore Features

              <ChevronRight size={17} />
            </a>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ====================================================== */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Building2 size={17} />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-900">
                  Temple Management System
                </p>

                <p className="text-xs text-slate-500">
                  Secure. Transparent. Organized.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
              <Link
                href="/login"
                className="transition hover:text-slate-900"
              >
                Management Login
              </Link>

              <a
                href="#features"
                className="transition hover:text-slate-900"
              >
                Features
              </a>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5 text-center sm:text-left">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} Temple Management
              System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ============================================================
   COMPONENTS
============================================================ */
function TrustItem({ children }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
        <CheckCircle2 size={16} />
      </div>

      <span className="text-sm font-medium text-slate-700">
        {children}
      </span>
    </div>
  );
}

function TrustPoint({ children }) {
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
      <CheckCircle2
        size={15}
        className="shrink-0 text-emerald-600"
      />

      {children}
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-100">
        <Icon
          size={21}
          strokeWidth={1.8}
        />
      </div>

      <h3 className="mt-5 text-base font-bold text-slate-950">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}) {
  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <span className="text-xs font-bold tracking-wider text-indigo-600">
        {number}
      </span>

      <h3 className="mt-4 text-xl font-bold text-slate-950">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function PreviewCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        <Icon size={15} />
      </div>

      <p className="mt-3 text-[11px] font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function ActivityRow({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />

        <span className="text-[11px] text-slate-600">
          {label}
        </span>
      </div>

      <span className="text-[11px] font-semibold text-slate-700">
        {value}
      </span>
    </div>
  );
}

function OverviewRow({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
      <span className="text-sm font-medium text-slate-600">
        {label}
      </span>

      <span className="text-xs font-semibold text-indigo-600">
        {value}
      </span>
    </div>
  );
}
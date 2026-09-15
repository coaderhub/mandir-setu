'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

export default function DonationsPage() {
  const [donations, setDonations] =
    useState([]);

  const [donors, setDonors] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [donorsLoading, setDonorsLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [search, setSearch] =
    useState('');

  const [financialYear, setFinancialYear] =
    useState('');

  const [paymentMethod, setPaymentMethod] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('active');

  const [modalOpen, setModalOpen] =
    useState(false);

  const [voidModalOpen, setVoidModalOpen] =
    useState(false);

  const [selectedDonation, setSelectedDonation] =
    useState(null);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [voidReason, setVoidReason] =
    useState('');

  const [form, setForm] =
    useState({
      donorId: '',
      amount: '',
      donationDate: getTodayDate(),
      paymentMethod: 'cash',
      receiptNumber: '',
      referenceNumber: '',
      purpose: 'General Donation',
      notes: '',
    });

  useEffect(() => {
    loadDonors();
  }, []);

  useEffect(() => {
    loadDonations();
  }, [
    statusFilter,
    financialYear,
    paymentMethod,
  ]);

  async function loadDonors() {
    try {
      setDonorsLoading(true);

      const response = await fetch(
        '/api/donors?status=active',
        {
          method: 'GET',
          cache: 'no-store',
        }
      );

      const result =
        await response.json();

      if (!response.ok || !result.success) {
        if (response.status === 401) {
          window.location.href =
            '/login';
          return;
        }

        throw new Error(
          result.message ||
            'Failed to load donors'
        );
      }

      setDonors(
        Array.isArray(result.data)
          ? result.data
          : []
      );
    } catch (error) {
      console.error(
        'Donors load error:',
        error
      );

      setError(
        error.message ||
          'Failed to load donors.'
      );
    } finally {
      setDonorsLoading(false);
    }
  }

  async function loadDonations(
    searchValue = search
  ) {
    try {
      setLoading(true);
      setError('');

      const params =
        new URLSearchParams();

      params.set(
        'status',
        statusFilter
      );

      if (searchValue.trim()) {
        params.set(
          'search',
          searchValue.trim()
        );
      }

      if (financialYear) {
        params.set(
          'financialYear',
          financialYear
        );
      }

      if (paymentMethod) {
        params.set(
          'paymentMethod',
          paymentMethod
        );
      }

      const response = await fetch(
        `/api/donations?${params.toString()}`,
        {
          method: 'GET',
          cache: 'no-store',
        }
      );

      const result =
        await response.json();

      if (!response.ok || !result.success) {
        if (response.status === 401) {
          window.location.href =
            '/login';
          return;
        }

        throw new Error(
          result.message ||
            'Failed to load donations'
        );
      }

      setDonations(
        Array.isArray(result.data)
          ? result.data
          : []
      );
    } catch (error) {
      console.error(
        'Donations load error:',
        error
      );

      setError(
        error.message ||
          'Failed to load donations.'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(event) {
    event.preventDefault();

    loadDonations(search);
  }

  function clearFilters() {
    setSearch('');
    setFinancialYear('');
    setPaymentMethod('');
    setStatusFilter('active');

    setTimeout(() => {
      loadDonations('');
    }, 0);
  }

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError('');
    setSuccess('');
  }

  function resetForm() {
    setForm({
      donorId: '',
      amount: '',
      donationDate:
        getTodayDate(),
      paymentMethod: 'cash',
      receiptNumber: '',
      referenceNumber: '',
      purpose:
        'General Donation',
      notes: '',
    });
  }

  function openAddModal() {
    resetForm();

    setError('');
    setSuccess('');
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!form.donorId) {
      setError(
        'Please select a donor.'
      );
      return;
    }

    const amount =
      Number(form.amount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError(
        'Please enter a valid donation amount.'
      );
      return;
    }

    if (!form.donationDate) {
      setError(
        'Donation date is required.'
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        '/api/donations',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            donorId:
              form.donorId,

            amount:
              amount,

            donationDate:
              form.donationDate,

            paymentMethod:
              form.paymentMethod,

            receiptNumber:
              form.receiptNumber.trim(),

            referenceNumber:
              form.referenceNumber.trim(),

            purpose:
              form.purpose.trim() ||
              'General Donation',

            notes:
              form.notes.trim(),
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok || !result.success) {
        if (response.status === 401) {
          window.location.href =
            '/login';
          return;
        }

        throw new Error(
          result.message ||
            'Failed to create donation'
        );
      }

      setModalOpen(false);
      resetForm();

      setSuccess(
        'Donation recorded successfully.'
      );

      await loadDonations(search);
    } catch (error) {
      console.error(
        'Donation creation error:',
        error
      );

      setError(
        error.message ||
          'Failed to create donation.'
      );
    } finally {
      setSaving(false);
    }
  }

  function openVoidModal(donation) {
    setSelectedDonation(
      donation
    );

    setVoidReason('');

    setError('');
    setVoidModalOpen(true);
  }

  function closeVoidModal() {
    if (saving) {
      return;
    }

    setVoidModalOpen(false);
    setSelectedDonation(null);
    setVoidReason('');
  }

  async function handleVoidDonation() {
    if (!selectedDonation) {
      return;
    }

    if (!voidReason.trim()) {
      setError(
        'Void reason is required.'
      );
      return;
    }

    try {
      setSaving(true);
      setError('');

      const response = await fetch(
        '/api/donations',
        {
          method: 'PATCH',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            id:
              selectedDonation.id,

            status:
              'voided',

            voidReason:
              voidReason.trim(),
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok || !result.success) {
        if (response.status === 401) {
          window.location.href =
            '/login';
          return;
        }

        throw new Error(
          result.message ||
            'Failed to void donation'
        );
      }

      setVoidModalOpen(false);
      setSelectedDonation(null);
      setVoidReason('');

      setSuccess(
        'Donation voided successfully.'
      );

      await loadDonations(search);
    } catch (error) {
      console.error(
        'Donation void error:',
        error
      );

      setError(
        error.message ||
          'Failed to void donation.'
      );
    } finally {
      setSaving(false);
    }
  }

  const totalAmount = useMemo(() => {
    return donations.reduce(
      (total, donation) => {
        return (
          total +
          Number(
            donation.amount || 0
          )
        );
      },
      0
    );
  }, [donations]);

  const donationCount =
    donations.length;

  const cashTotal = useMemo(() => {
    return donations
      .filter(
        (item) =>
          item.paymentMethod ===
          'cash'
      )
      .reduce(
        (total, item) =>
          total +
          Number(item.amount || 0),
        0
      );
  }, [donations]);

  const digitalTotal =
    useMemo(() => {
      return donations
        .filter((item) =>
          [
            'upi',
            'bank_transfer',
            'card',
          ].includes(
            item.paymentMethod
          )
        )
        .reduce(
          (total, item) =>
            total +
            Number(
              item.amount || 0
            ),
          0
        );
    }, [donations]);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1600px]">

        {/* HEADER */}
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

          <div>
            <p className="text-sm font-semibold text-indigo-600">
              Donation Management
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Donations
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Record and manage temple
              donations with complete
              payment and donor details.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
          >
            <span className="text-lg leading-none">
              +
            </span>

            Record Donation
          </button>
        </div>

        {/* ALERTS */}
        {error &&
          !modalOpen &&
          !voidModalOpen && (
            <Alert
              type="error"
              message={error}
            />
          )}

        {success && (
          <Alert
            type="success"
            message={success}
          />
        )}

        {/* SUMMARY */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <SummaryCard
            title="Total Donations"
            value={donationCount}
            description="Records in current view"
            icon="₹"
          />

          <SummaryCard
            title="Total Amount"
            value={formatCurrency(
              totalAmount
            )}
            description="Current filtered total"
            icon="₹"
          />

          <SummaryCard
            title="Cash"
            value={formatCurrency(
              cashTotal
            )}
            description="Cash donations"
            icon="C"
          />

          <SummaryCard
            title="Digital"
            value={formatCurrency(
              digitalTotal
            )}
            description="UPI, bank & card"
            icon="↗"
          />

        </div>

        {/* MAIN CARD */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

          {/* FILTER BAR */}
          <div className="border-b border-slate-200 p-4 sm:p-5">

            <form
              onSubmit={
                handleSearchSubmit
              }
              className="space-y-4"
            >

              <div className="flex flex-col gap-3 lg:flex-row">

                {/* SEARCH */}
                <div className="relative flex-1">

                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    ⌕
                  </span>

                  <input
                    type="search"
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search donor, receipt, reference or purpose..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>

                <button
                  type="submit"
                  className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Search
                </button>

              </div>

              <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">

                {/* FINANCIAL YEAR */}
                <select
                  value={
                    financialYear
                  }
                  onChange={(event) =>
                    setFinancialYear(
                      event.target.value
                    )
                  }
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                >
                  <option value="">
                    All Financial Years
                  </option>

                  {getFinancialYears().map(
                    (year) => (
                      <option
                        key={year}
                        value={year}
                      >
                        {year}
                      </option>
                    )
                  )}
                </select>

                {/* PAYMENT METHOD */}
                <select
                  value={
                    paymentMethod
                  }
                  onChange={(event) =>
                    setPaymentMethod(
                      event.target.value
                    )
                  }
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                >
                  <option value="">
                    All Payment Methods
                  </option>

                  <option value="cash">
                    Cash
                  </option>

                  <option value="upi">
                    UPI
                  </option>

                  <option value="bank_transfer">
                    Bank Transfer
                  </option>

                  <option value="cheque">
                    Cheque
                  </option>

                  <option value="card">
                    Card
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>

                {/* STATUS */}
                <div className="flex w-full rounded-xl border border-slate-200 bg-slate-50 p-1 md:w-auto">

                  <button
                    type="button"
                    onClick={() =>
                      setStatusFilter(
                        'active'
                      )
                    }
                    className={`flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition md:flex-none ${
                      statusFilter ===
                      'active'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Active
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setStatusFilter(
                        'voided'
                      )
                    }
                    className={`flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition md:flex-none ${
                      statusFilter ===
                      'voided'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Voided
                  </button>

                </div>

                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  Clear Filters
                </button>

              </div>
            </form>
          </div>

          {/* CONTENT */}
          {loading ? (
            <DonationTableSkeleton />
          ) : donations.length ===
            0 ? (
            <EmptyDonations
              statusFilter={
                statusFilter
              }
              search={search}
              onAdd={
                openAddModal
              }
            />
          ) : (
            <DonationTable
              donations={
                donations
              }
              onVoid={
                openVoidModal
              }
            />
          )}
        </section>
      </div>

      {/* ADD DONATION MODAL */}
      {modalOpen && (
        <DonationModal
          form={form}
          donors={donors}
          donorsLoading={
            donorsLoading
          }
          saving={saving}
          error={error}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}

      {/* VOID MODAL */}
      {voidModalOpen && (
        <VoidDonationModal
          donation={
            selectedDonation
          }
          reason={voidReason}
          saving={saving}
          onReasonChange={
            setVoidReason
          }
          onConfirm={
            handleVoidDonation
          }
          onClose={
            closeVoidModal
          }
        />
      )}
    </div>
  );
}

/* =========================================
   SUMMARY CARD
========================================= */

function SummaryCard({
  title,
  value,
  description,
  icon,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">

        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-600">
          {icon}
        </div>

      </div>
    </div>
  );
}

/* =========================================
   DONATION MODAL
========================================= */

function DonationModal({
  form,
  donors,
  donorsLoading,
  saving,
  error,
  onChange,
  onSubmit,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">

      <div className="max-h-[95vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-3xl sm:rounded-2xl">

        {/* HEADER */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Record Donation
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add a new donation
              transaction.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            ×
          </button>

        </div>

        {/* FORM */}
        <form
          onSubmit={onSubmit}
          className="p-5 sm:p-6"
        >

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-medium text-red-700">
                {error}
              </p>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">

            {/* DONOR */}
            <div className="sm:col-span-2">

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Donor
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <select
                name="donorId"
                value={
                  form.donorId
                }
                onChange={onChange}
                disabled={
                  donorsLoading ||
                  saving
                }
                required
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50"
              >
                <option value="">
                  {donorsLoading
                    ? 'Loading donors...'
                    : 'Select donor'}
                </option>

                {donors.map(
                  (donor) => (
                    <option
                      key={donor.id}
                      value={
                        donor.id
                      }
                    >
                      {donor.name}
                      {donor.phone
                        ? ` — ${donor.phone}`
                        : ''}
                    </option>
                  )
                )}
              </select>

              {!donorsLoading &&
                donors.length ===
                  0 && (
                  <p className="mt-2 text-xs text-amber-600">
                    No active donors
                    found. Add a donor
                    first.
                  </p>
                )}

            </div>

            {/* AMOUNT */}
            <FormField
              label="Donation Amount"
              name="amount"
              type="number"
              value={
                form.amount
              }
              onChange={onChange}
              placeholder="5000"
              required
              min="0.01"
              step="0.01"
              prefix="₹"
            />

            {/* DATE */}
            <FormField
              label="Donation Date"
              name="donationDate"
              type="date"
              value={
                form.donationDate
              }
              onChange={onChange}
              required
            />

            {/* PAYMENT METHOD */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Payment Method
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <select
                name="paymentMethod"
                value={
                  form.paymentMethod
                }
                onChange={onChange}
                required
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              >
                <option value="cash">
                  Cash
                </option>

                <option value="upi">
                  UPI
                </option>

                <option value="bank_transfer">
                  Bank Transfer
                </option>

                <option value="cheque">
                  Cheque
                </option>

                <option value="card">
                  Card
                </option>

                <option value="other">
                  Other
                </option>
              </select>
            </div>

            {/* PURPOSE */}
            <FormField
              label="Purpose"
              name="purpose"
              value={
                form.purpose
              }
              onChange={onChange}
              placeholder="General Donation"
            />

            {/* RECEIPT */}
            <FormField
              label="Receipt Number"
              name="receiptNumber"
              value={
                form.receiptNumber
              }
              onChange={onChange}
              placeholder="REC-2026-0001"
            />

            {/* REFERENCE */}
            <FormField
              label="Reference Number"
              name="referenceNumber"
              value={
                form.referenceNumber
              }
              onChange={onChange}
              placeholder="UPI / cheque / bank reference"
            />

            {/* NOTES */}
            <div className="sm:col-span-2">

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Notes
              </label>

              <textarea
                name="notes"
                value={form.notes}
                onChange={onChange}
                rows={4}
                placeholder="Optional notes..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />

            </div>
          </div>

          {/* ACTIONS */}
          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                donorsLoading ||
                donors.length === 0
              }
              className="inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving...
                </>
              ) : (
                'Record Donation'
              )}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================
   VOID MODAL
========================================= */

function VoidDonationModal({
  donation,
  reason,
  saving,
  onReasonChange,
  onConfirm,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">

      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-lg font-bold text-red-600">
          !
        </div>

        <h3 className="mt-5 text-lg font-bold text-slate-900">
          Void Donation
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          You are about to void the
          donation of{' '}
          <strong className="text-slate-700">
            {formatCurrency(
              donation?.amount
            )}
          </strong>{' '}
          from{' '}
          <strong className="text-slate-700">
            {donation?.donor?.name ||
              'Unknown donor'}
          </strong>
          .
        </p>

        <div className="mt-5">

          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Reason
            <span className="ml-1 text-red-500">
              *
            </span>
          </label>

          <textarea
            value={reason}
            onChange={(event) =>
              onReasonChange(
                event.target.value
              )
            }
            rows={4}
            placeholder="Enter reason for voiding this donation..."
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
          />

        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="h-11 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? 'Voiding...'
              : 'Void Donation'}
          </button>

        </div>
      </div>
    </div>
  );
}

/* =========================================
   DONATION TABLE
========================================= */

function DonationTable({
  donations,
  onVoid,
}) {
  return (
    <>
      {/* DESKTOP */}
      <div className="hidden overflow-x-auto md:block">

        <table className="w-full min-w-[1150px]">

          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70">

              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Donor
              </th>

              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Amount
              </th>

              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Date
              </th>

              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Payment
              </th>

              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Receipt
              </th>

              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Purpose
              </th>

              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Status
              </th>

              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                Action
              </th>

            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">

            {donations.map(
              (donation) => (
                <tr
                  key={donation.id}
                  className="transition hover:bg-slate-50/70"
                >

                  {/* DONOR */}
                  <td className="px-6 py-4">

                    <div className="flex items-center gap-3">

                      <Avatar
                        name={
                          donation
                            .donor
                            ?.name
                        }
                      />

                      <div className="min-w-0">

                        <p className="truncate text-sm font-semibold text-slate-900">
                          {donation
                            .donor
                            ?.name ||
                            'Unknown donor'}
                        </p>

                        {donation
                          .donor
                          ?.phone && (
                          <p className="mt-0.5 text-xs text-slate-400">
                            {
                              donation
                                .donor
                                .phone
                            }
                          </p>
                        )}

                      </div>
                    </div>
                  </td>

                  {/* AMOUNT */}
                  <td className="px-6 py-4">

                    <p className="text-sm font-bold text-slate-900">
                      {formatCurrency(
                        donation.amount
                      )}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      {
                        donation
                          .financialYear
                      }
                    </p>

                  </td>

                  {/* DATE */}
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {formatDate(
                      donation.donationDate
                    )}
                  </td>

                  {/* PAYMENT */}
                  <td className="px-6 py-4">
                    <PaymentBadge
                      method={
                        donation.paymentMethod
                      }
                    />
                  </td>

                  {/* RECEIPT */}
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {donation.receiptNumber ||
                      donation.referenceNumber ||
                      '—'}
                  </td>

                  {/* PURPOSE */}
                  <td className="max-w-[180px] px-6 py-4 text-sm text-slate-600">
                    <span className="block truncate">
                      {donation.purpose ||
                        'General Donation'}
                    </span>
                  </td>

                  {/* STATUS */}
                  <td className="px-6 py-4">
                    <DonationStatus
                      status={
                        donation.status
                      }
                    />
                  </td>

                  {/* ACTION */}
                  <td className="px-6 py-4 text-right">

                    {donation.status ===
                      'active' && (
                      <button
                        type="button"
                        onClick={() =>
                          onVoid(
                            donation
                          )
                        }
                        className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Void
                      </button>
                    )}

                    {donation.status ===
                      'voided' && (
                      <span className="text-xs text-slate-400">
                        Voided
                      </span>
                    )}

                  </td>

                </tr>
              )
            )}

          </tbody>
        </table>
      </div>

      {/* MOBILE */}
      <div className="divide-y divide-slate-100 md:hidden">

        {donations.map(
          (donation) => (
            <div
              key={donation.id}
              className="p-5"
            >

              <div className="flex items-start gap-3">

                <Avatar
                  name={
                    donation
                      .donor
                      ?.name
                  }
                />

                <div className="min-w-0 flex-1">

                  <div className="flex items-start justify-between gap-3">

                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {donation
                          .donor
                          ?.name ||
                          'Unknown donor'}
                      </h3>

                      <p className="mt-1 text-xs text-slate-400">
                        {formatDate(
                          donation.donationDate
                        )}
                      </p>
                    </div>

                    <DonationStatus
                      status={
                        donation.status
                      }
                    />

                  </div>

                  <p className="mt-4 text-xl font-bold text-slate-900">
                    {formatCurrency(
                      donation.amount
                    )}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-3">

                    <InfoItem
                      label="Payment"
                      value={formatPaymentMethod(
                        donation.paymentMethod
                      )}
                    />

                    <InfoItem
                      label="Financial Year"
                      value={
                        donation.financialYear
                      }
                    />

                    <InfoItem
                      label="Receipt"
                      value={
                        donation
                          .receiptNumber ||
                        '—'
                      }
                    />

                    <InfoItem
                      label="Purpose"
                      value={
                        donation.purpose ||
                        'General Donation'
                      }
                    />

                  </div>

                  {donation
                    .referenceNumber && (
                    <div className="mt-3">
                      <InfoItem
                        label="Reference"
                        value={
                          donation.referenceNumber
                        }
                      />
                    </div>
                  )}

                  {donation.status ===
                    'voided' &&
                    donation.voidReason && (
                      <div className="mt-4 rounded-xl bg-red-50 p-3">
                        <p className="text-xs font-semibold text-red-600">
                          Void Reason
                        </p>

                        <p className="mt-1 text-xs leading-5 text-red-700">
                          {
                            donation.voidReason
                          }
                        </p>
                      </div>
                    )}

                  {donation.status ===
                    'active' && (
                    <button
                      type="button"
                      onClick={() =>
                        onVoid(
                          donation
                        )
                      }
                      className="mt-4 rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      Void Donation
                    </button>
                  )}

                </div>
              </div>
            </div>
          )
        )}

      </div>
    </>
  );
}

/* =========================================
   EMPTY STATE
========================================= */

function EmptyDonations({
  statusFilter,
  search,
  onAdd,
}) {
  const voided =
    statusFilter === 'voided';

  return (
    <div className="px-5 py-16 text-center sm:px-6">

      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-xl font-bold text-slate-400">
        ₹
      </div>

      <h3 className="mt-5 text-base font-bold text-slate-900">
        {search
          ? 'No donations found'
          : voided
            ? 'No voided donations'
            : 'No donations yet'}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {search
          ? 'Try changing your search or filters.'
          : voided
            ? 'Voided donations will appear here.'
            : 'Start recording donations to build your temple financial history.'}
      </p>

      {!voided && !search && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          + Record First Donation
        </button>
      )}

    </div>
  );
}

/* =========================================
   FORM FIELD
========================================= */

function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  min,
  step,
  prefix,
}) {
  return (
    <div>

      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <div className="relative">

        {prefix && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
            {prefix}
          </span>
        )}

        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          min={min}
          step={step}
          className={`h-11 w-full rounded-xl border border-slate-200 bg-white text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 ${
            prefix
              ? 'pl-9 pr-4'
              : 'px-4'
          }`}
        />

      </div>
    </div>
  );
}

/* =========================================
   PAYMENT BADGE
========================================= */

function PaymentBadge({
  method,
}) {
  const label =
    formatPaymentMethod(
      method
    );

  return (
    <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
      {label}
    </span>
  );
}

/* =========================================
   DONATION STATUS
========================================= */

function DonationStatus({
  status,
}) {
  const active =
    status === 'active';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-red-50 text-red-700'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active
            ? 'bg-emerald-500'
            : 'bg-red-500'
        }`}
      />

      {active
        ? 'Active'
        : 'Voided'}
    </span>
  );
}

/* =========================================
   AVATAR
========================================= */

function Avatar({
  name,
}) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-sm font-bold text-indigo-700">
      {getInitials(name)}
    </div>
  );
}

/* =========================================
   INFO ITEM
========================================= */

function InfoItem({
  label,
  value,
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-xs font-medium text-slate-700">
        {value}
      </p>
    </div>
  );
}

/* =========================================
   ALERT
========================================= */

function Alert({
  type,
  message,
}) {
  const success =
    type === 'success';

  return (
    <div
      className={`mb-6 rounded-2xl border p-4 ${
        success
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-red-200 bg-red-50'
      }`}
    >
      <div className="flex items-start gap-3">

        <div
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            success
              ? 'bg-emerald-100 text-emerald-600'
              : 'bg-red-100 text-red-600'
          }`}
        >
          {success ? '✓' : '!'}
        </div>

        <p
          className={`text-sm font-medium leading-6 ${
            success
              ? 'text-emerald-700'
              : 'text-red-700'
          }`}
        >
          {message}
        </p>

      </div>
    </div>
  );
}

/* =========================================
   SKELETON
========================================= */

function DonationTableSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-slate-100">

      {Array.from({
        length: 6,
      }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 px-5 py-5 sm:px-6"
        >

          <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-200" />

          <div className="flex-1">
            <div className="h-4 w-40 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-24 rounded bg-slate-100" />
          </div>

          <div className="hidden h-4 w-24 rounded bg-slate-200 md:block" />

          <div className="hidden h-4 w-24 rounded bg-slate-200 lg:block" />

          <div className="hidden h-8 w-16 rounded-lg bg-slate-200 md:block" />

        </div>
      ))}

    </div>
  );
}

/* =========================================
   HELPERS
========================================= */

function getTodayDate() {
  const date =
    new Date();

  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getFinancialYears() {
  const currentYear =
    new Date().getFullYear();

  const years = [];

  for (
    let year = currentYear - 3;
    year <= currentYear + 1;
    year++
  ) {
    years.push(
      `${year}-${String(
        year + 1
      ).slice(-2)}`
    );
  }

  return years.reverse();
}

function formatCurrency(amount) {
  const number =
    Number(amount || 0);

  return new Intl.NumberFormat(
    'en-IN',
    {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }
  ).format(number);
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

  try {
    return new Intl.DateTimeFormat(
      'en-IN',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }
    ).format(new Date(value));
  } catch {
    return '—';
  }
}

function formatPaymentMethod(
  method
) {
  const labels = {
    cash: 'Cash',
    upi: 'UPI',
    bank_transfer:
      'Bank Transfer',
    cheque: 'Cheque',
    card: 'Card',
    other: 'Other',
  };

  return (
    labels[method] ||
    'Other'
  );
}

function getInitials(name) {
  if (!name) {
    return 'DN';
  }

  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    words[0][0] +
    words[words.length - 1][0]
  ).toUpperCase();
}
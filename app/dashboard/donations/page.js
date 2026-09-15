'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Eye,
  FileText,
  Filter,
  IndianRupee,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  X,
} from 'lucide-react';

import { useDashboard } from '@/app/dashboard/DashboardShell';

const PAYMENT_METHODS = [
  {
    value: 'cash',
    label: 'Cash',
  },
  {
    value: 'upi',
    label: 'UPI',
  },
  {
    value: 'bank_transfer',
    label: 'Bank Transfer',
  },
  {
    value: 'cheque',
    label: 'Cheque',
  },
  {
    value: 'card',
    label: 'Card',
  },
  {
    value: 'other',
    label: 'Other',
  },
];

function getCurrentFinancialYear() {
  const now = new Date();

  const year = now.getFullYear();

  const month = now.getMonth() + 1;

  if (month >= 4) {
    return `${year}-${String(
      (year + 1) % 100
    ).padStart(2, '0')}`;
  }

  return `${year - 1}-${String(
    year % 100
  ).padStart(2, '0')}`;
}

function getFinancialYears(count = 5) {
  const current =
    getCurrentFinancialYear();

  const startYear = Number(
    current.split('-')[0]
  );

  return Array.from(
    {
      length: count,
    },
    (_, index) => {
      const year =
        startYear - index;

      return `${year}-${String(
        (year + 1) % 100
      ).padStart(2, '0')}`;
    }
  );
}

function formatCurrency(value) {
  const amount = Number(value) || 0;

  return new Intl.NumberFormat(
    'en-IN',
    {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }
  ).format(amount);
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '-';
  }

  return date.toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  );
}

function formatDateForInput(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '';
  }

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

function paymentMethodLabel(value) {
  const item =
    PAYMENT_METHODS.find(
      (method) =>
        method.value === value
    );

  return (
    item?.label ||
    value ||
    '-'
  );
}

function getPaymentMethodClass(
  value
) {
  switch (value) {
    case 'cash':
      return 'bg-emerald-50 text-emerald-700';

    case 'upi':
      return 'bg-indigo-50 text-indigo-700';

    case 'bank_transfer':
      return 'bg-blue-50 text-blue-700';

    case 'cheque':
      return 'bg-amber-50 text-amber-700';

    case 'card':
      return 'bg-purple-50 text-purple-700';

    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export default function DonationsPage() {
  const {
    organization,
  } = useDashboard();

  const financialYears =
    useMemo(
      () =>
        getFinancialYears(5),
      []
    );

  const [
    donations,
    setDonations,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    success,
    setSuccess,
  ] = useState('');

  const [
    searchInput,
    setSearchInput,
  ] = useState('');

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    status,
    setStatus,
  ] = useState('active');

  const [
    financialYear,
    setFinancialYear,
  ] = useState(
    getCurrentFinancialYear()
  );

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState('');

  const [
    showFilters,
    setShowFilters,
  ] = useState(false);

  const [
    showCreateModal,
    setShowCreateModal,
  ] = useState(false);

  const [
    showVoidModal,
    setShowVoidModal,
  ] = useState(false);

  const [
    selectedDonation,
    setSelectedDonation,
  ] = useState(null);

  const [
    showDetailsModal,
    setShowDetailsModal,
  ] = useState(false);

  const [
    form,
    setForm,
  ] = useState({
    donorId: '',
    amount: '',
    donationDate:
      formatDateForInput(
        new Date()
      ),
    paymentMethod: 'cash',
    receiptNumber: '',
    referenceNumber: '',
    purpose:
      'General Donation',
    notes: '',
  });

  const [
    donors,
    setDonors,
  ] = useState([]);

  const [
    donorsLoading,
    setDonorsLoading,
  ] = useState(false);

  const [
    voidReason,
    setVoidReason,
  ] = useState('');

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const fetchDonations =
    useCallback(
      async (
        showPageLoader = true
      ) => {
        try {
          if (showPageLoader) {
            setLoading(true);
          } else {
            setRefreshing(true);
          }

          setError('');

          const params =
            new URLSearchParams();

          params.set(
            'status',
            status
          );

          if (search) {
            params.set(
              'search',
              search
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

          const response =
            await fetch(
              `/api/donations?${params.toString()}`,
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
                'Failed to load donations'
            );
          }

          /*
           * Important:
           * Always replace the local state
           * with fresh API data.
           */
          setDonations(
            Array.isArray(
              result.data?.donations
            )
              ? result.data.donations
              : []
          );
        } catch (fetchError) {
          console.error(
            'Donations fetch error:',
            fetchError
          );

          setError(
            fetchError.message ||
              'Failed to load donations'
          );

          /*
           * Do not keep stale/incorrect
           * data when API loading fails.
           */
          setDonations([]);
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        status,
        search,
        financialYear,
        paymentMethod,
      ]
    );

  /*
   * IMPORTANT:
   * This runs after page refresh/mount
   * and whenever a filter changes.
   */
  useEffect(() => {
    fetchDonations(true);
  }, [fetchDonations]);

  const fetchDonors_old =
    useCallback(
      async () => {
        try {
          setDonorsLoading(true);

          const response =
            await fetch(
              '/api/donors?status=active',
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
                'Failed to load donors'
            );
          }

          setDonors(
            Array.isArray(
              result.data?.donors
            )
              ? result.data.donors
              : []
          );
        } catch (fetchError) {
          console.error(
            'Donors fetch error:',
            fetchError
          );

          setError(
            fetchError.message ||
              'Failed to load donors'
          );
        } finally {
          setDonorsLoading(false);
        }
      },
      []
    );

const fetchDonors = useCallback(async () => {
  try {
    setDonorsLoading(true);

    const response = await fetch('/api/donors?status=active', {
      cache: 'no-store',
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to load donors');
    }

    // /api/donors returns:
    // { success: true, data: [...] }
    const donorList = Array.isArray(result.data)
      ? result.data
      : [];

    setDonors(
      donorList.map((donor) => ({
        id: donor.id,
        name: donor.name || '',
        phone: donor.phone || '',
        email: donor.email || '',
      }))
    );
  } catch (fetchError) {
    console.error('Donors fetch error:', fetchError);

    setError(
      fetchError.message || 'Failed to load donors'
    );

    setDonors([]);
  } finally {
    setDonorsLoading(false);
  }
}, []);











  function openCreateModal() {
    setError('');
    setSuccess('');

    setForm({
      donorId: '',
      amount: '',
      donationDate:
        formatDateForInput(
          new Date()
        ),
      paymentMethod: 'cash',
      receiptNumber: '',
      referenceNumber: '',
      purpose:
        'General Donation',
      notes: '',
    });

    setShowCreateModal(true);

    fetchDonors();
  }

  function closeCreateModal() {
    if (saving) {
      return;
    }

    setShowCreateModal(false);
  }

  function updateForm(
    field,
    value
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  async function handleCreateDonation(
    event
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (!form.donorId) {
        throw new Error(
          'Please select a donor'
        );
      }

      const amount =
        Number(form.amount);

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        throw new Error(
          'Please enter a valid donation amount'
        );
      }

      if (
        !form.donationDate
      ) {
        throw new Error(
          'Donation date is required'
        );
      }

      const response =
        await fetch(
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

              amount,

              donationDate:
                form.donationDate,

              paymentMethod:
                form.paymentMethod,

              receiptNumber:
                form.receiptNumber,

              referenceNumber:
                form.referenceNumber,

              purpose:
                form.purpose,

              notes:
                form.notes,
            }),
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
            'Failed to create donation'
        );
      }

      setShowCreateModal(
        false
      );

      setSuccess(
        'Donation created successfully.'
      );

      /*
       * Re-fetch from MongoDB.
       * Do not rely on local state only.
       */
      await fetchDonations(
        false
      );
    } catch (submitError) {
      console.error(
        'Create donation error:',
        submitError
      );

      setError(
        submitError.message ||
          'Failed to create donation'
      );
    } finally {
      setSaving(false);
    }
  }

  function openVoidModal(
    donation
  ) {
    setSelectedDonation(
      donation
    );

    setVoidReason('');

    setError('');

    setSuccess('');

    setShowVoidModal(true);
  }

  function closeVoidModal() {
    if (actionLoading) {
      return;
    }

    setShowVoidModal(false);

    setSelectedDonation(
      null
    );

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
      setActionLoading(true);

      setError('');
      setSuccess('');

      const response =
        await fetch(
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

              status: 'voided',

              voidReason:
                voidReason.trim(),
            }),
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
            'Failed to void donation'
        );
      }

      setShowVoidModal(
        false
      );

      setSelectedDonation(
        null
      );

      setVoidReason('');

      setSuccess(
        'Donation voided successfully.'
      );

      await fetchDonations(
        false
      );
    } catch (actionError) {
      console.error(
        'Void donation error:',
        actionError
      );

      setError(
        actionError.message ||
          'Failed to void donation'
      );
    } finally {
      setActionLoading(false);
    }
  }

  function handleSearch(
    event
  ) {
    event.preventDefault();

    setPageSafe();

    setSearch(
      searchInput.trim()
    );
  }

  function setPageSafe() {
    /*
     * Kept as a separate function so
     * search/filter changes are explicit.
     */
  }

  function clearFilters() {
    setSearchInput('');

    setSearch('');

    setStatus('active');

    setFinancialYear(
      getCurrentFinancialYear()
    );

    setPaymentMethod('');
  }

  function openDetails(
    donation
  ) {
    setSelectedDonation(
      donation
    );

    setShowDetailsModal(
      true
    );
  }

  function closeDetails() {
    setSelectedDonation(
      null
    );

    setShowDetailsModal(
      false
    );
  }

  const summary =
    useMemo(() => {
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
              donation.amount
            ),
          0
        );

      const cashAmount =
        activeDonations
          .filter(
            (donation) =>
              donation.paymentMethod ===
              'cash'
          )
          .reduce(
            (total, donation) =>
              total +
              Number(
                donation.amount
              ),
            0
          );

      const digitalAmount =
        activeDonations
          .filter(
            (donation) =>
              [
                'upi',
                'bank_transfer',
                'card',
              ].includes(
                donation.paymentMethod
              )
          )
          .reduce(
            (total, donation) =>
              total +
              Number(
                donation.amount
              ),
            0
          );

      return {
        count:
          activeDonations.length,

        totalAmount,

        cashAmount,

        digitalAmount,
      };
    }, [donations]);

  const hasFilters =
    Boolean(
      search ||
        financialYear ||
        paymentMethod ||
        status !== 'active'
    );

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <IndianRupee
                size={22}
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Donations
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage temple donations,
                receipts and donation history.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() =>
              fetchDonations(false)
            }
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? 'animate-spin'
                  : ''
              }
            />

            Refresh
          </button>

          <button
            type="button"
            onClick={
              openCreateModal
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Plus
              size={17}
            />

            Add Donation
          </button>
        </div>
      </div>

      {/* Alerts */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />

          <div className="flex-1">
            {error}
          </div>

          <button
            type="button"
            onClick={() =>
              setError('')
            }
            className="text-red-500 hover:text-red-700"
          >
            <X
              size={16}
            />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2
            size={18}
            className="mt-0.5 shrink-0"
          />

          <div className="flex-1">
            {success}
          </div>

          <button
            type="button"
            onClick={() =>
              setSuccess('')
            }
            className="text-emerald-500 hover:text-emerald-700"
          >
            <X
              size={16}
            />
          </button>
        </div>
      )}

      {/* Summary */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Donations
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatCurrency(
                  summary.totalAmount
                )}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <IndianRupee
                size={19}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Transactions
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {summary.count}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FileText
                size={19}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Cash
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatCurrency(
                  summary.cashAmount
                )}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <IndianRupee
                size={19}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Digital
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatCurrency(
                  summary.digitalAmount
                )}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <IndianRupee
                size={19}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <form
              onSubmit={
                handleSearch
              }
              className="relative flex-1"
            >
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={
                  searchInput
                }
                onChange={(
                  event
                ) =>
                  setSearchInput(
                    event.target
                      .value
                  )
                }
                placeholder="Search donor, receipt, reference or purpose..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </form>

            <button
              type="button"
              onClick={() =>
                setShowFilters(
                  (current) =>
                    !current
                )
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Filter
                size={16}
              />

              Filters

              <ChevronDown
                size={16}
                className={
                  showFilters
                    ? 'rotate-180 transition'
                    : 'transition'
                }
              />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setStatus('active')
              }
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                status === 'active'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Active
            </button>

            <button
              type="button"
              onClick={() =>
                setStatus('voided')
              }
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                status === 'voided'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Voided
            </button>

            {hasFilters && (
              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="ml-auto text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Clear filters
              </button>
            )}
          </div>

          {showFilters && (
            <div className="grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                  Financial Year
                </label>

                <select
                  value={
                    financialYear
                  }
                  onChange={(
                    event
                  ) =>
                    setFinancialYear(
                      event.target
                        .value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                >
                  {financialYears.map(
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
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                  Payment Method
                </label>

                <select
                  value={
                    paymentMethod
                  }
                  onChange={(
                    event
                  ) =>
                    setPaymentMethod(
                      event.target
                        .value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                >
                  <option value="">
                    All Payment Methods
                  </option>

                  {PAYMENT_METHODS.map(
                    (method) => (
                      <option
                        key={
                          method.value
                        }
                        value={
                          method.value
                        }
                      >
                        {
                          method.label
                        }
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Donation list */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Donation History
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {organization?.name ||
                'Temple'}{' '}
              · {financialYear}
            </p>
          </div>

          <div className="text-sm font-medium text-slate-500">
            {donations.length}{' '}
            record
            {donations.length ===
            1
              ? ''
              : 's'}
          </div>
        </div>

        {loading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({
              length: 6,
            }).map(
              (_, index) => (
                <div
                  key={index}
                  className="animate-pulse p-5"
                >
                  <div className="h-4 w-40 rounded bg-slate-100" />

                  <div className="mt-3 h-3 w-64 rounded bg-slate-100" />

                  <div className="mt-2 h-3 w-48 rounded bg-slate-100" />
                </div>
              )
            )}
          </div>
        ) : donations.length ===
          0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <IndianRupee
                size={25}
              />
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-900">
              No donations found
            </h3>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              Try changing your filters
              or add a new donation.
            </p>

            <button
              type="button"
              onClick={
                openCreateModal
              }
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Plus
                size={16}
              />

              Add Donation
            </button>
          </div>
        ) : (
          <>
            {/* Desktop */}

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1050px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Donor
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Date
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Amount
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Payment
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Receipt
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {donations.map(
                    (donation) => (
                      <tr
                        key={
                          donation.id
                        }
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                              <UserRound
                                size={16}
                              />
                            </div>

                            <div>
                              <div className="text-sm font-semibold text-slate-900">
                                {
                                  donation
                                    .donor
                                    ?.name
                                }
                              </div>

                              <div className="mt-0.5 text-xs text-slate-500">
                                {
                                  donation
                                    .donor
                                    ?.phone
                                }
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <CalendarDays
                              size={15}
                              className="text-slate-400"
                            />

                            {formatDate(
                              donation.donationDate
                            )}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold text-slate-900">
                          {formatCurrency(
                            donation.amount
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getPaymentMethodClass(
                              donation.paymentMethod
                            )}`}
                          >
                            {paymentMethodLabel(
                              donation.paymentMethod
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {donation.receiptNumber ||
                            '-'}
                        </td>

                        <td className="px-5 py-4">
                          {donation.status ===
                          'active' ? (
                            <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                              Voided
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openDetails(
                                  donation
                                )
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                              title="View details"
                            >
                              <Eye
                                size={16}
                              />
                            </button>

                            {donation.status ===
                              'active' && (
                              <button
                                type="button"
                                onClick={() =>
                                  openVoidModal(
                                    donation
                                  )
                                }
                                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                              >
                                Void
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile */}

            <div className="divide-y divide-slate-100 lg:hidden">
              {donations.map(
                (donation) => (
                  <div
                    key={
                      donation.id
                    }
                    className="p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                          <UserRound
                            size={17}
                          />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {
                              donation
                                .donor
                                ?.name
                            }
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {
                              donation
                                .donor
                                ?.phone
                            }
                          </p>
                        </div>
                      </div>

                      <p className="text-sm font-bold text-slate-900">
                        {formatCurrency(
                          donation.amount
                        )}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-slate-400">
                          Date
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {formatDate(
                            donation.donationDate
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Payment
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {paymentMethodLabel(
                            donation.paymentMethod
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Receipt
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {donation.receiptNumber ||
                            '-'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Status
                        </p>

                        <p className="mt-1">
                          {donation.status ===
                          'active' ? (
                            <span className="inline-flex rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                              Voided
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openDetails(
                            donation
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
                      >
                        <Eye
                          size={15}
                        />

                        View
                      </button>

                      {donation.status ===
                        'active' && (
                        <button
                          type="button"
                          onClick={() =>
                            openVoidModal(
                              donation
                            )
                          }
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600"
                        >
                          Void
                        </button>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        )}
      </div>

      {/* Create Donation Modal */}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Add Donation
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Record a new temple donation.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeCreateModal
                }
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X
                  size={18}
                />
              </button>
            </div>

            <form
              onSubmit={
                handleCreateDonation
              }
              className="overflow-y-auto p-5"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Donor
                  </label>

                  <select
                    value={
                      form.donorId
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        'donorId',
                        event.target
                          .value
                      )
                    }
                    disabled={
                      donorsLoading
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  >
                    <option value="">
                      {donorsLoading
                        ? 'Loading donors...'
                        : 'Select donor'}
                    </option>

                    {donors.map(
                      (donor) => (
                        <option
                          key={
                            donor.id
                          }
                          value={
                            donor.id
                          }
                        >
                          {donor.name}
                          {donor.phone
                            ? ` - ${donor.phone}`
                            : ''}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Amount
                  </label>

                  <div className="relative">
                    <IndianRupee
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={
                        form.amount
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          'amount',
                          event.target
                            .value
                        )
                      }
                      placeholder="0.00"
                      className="h-11 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Donation Date
                  </label>

                  <input
                    type="date"
                    value={
                      form.donationDate
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        'donationDate',
                        event.target
                          .value
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Payment Method
                  </label>

                  <select
                    value={
                      form.paymentMethod
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        'paymentMethod',
                        event.target
                          .value
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  >
                    {PAYMENT_METHODS.map(
                      (method) => (
                        <option
                          key={
                            method.value
                          }
                          value={
                            method.value
                          }
                        >
                          {
                            method.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Receipt Number
                  </label>

                  <input
                    type="text"
                    value={
                      form.receiptNumber
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        'receiptNumber',
                        event.target
                          .value
                      )
                    }
                    placeholder="Optional"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Reference Number
                  </label>

                  <input
                    type="text"
                    value={
                      form.referenceNumber
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        'referenceNumber',
                        event.target
                          .value
                      )
                    }
                    placeholder="Optional"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Purpose
                  </label>

                  <input
                    type="text"
                    value={
                      form.purpose
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        'purpose',
                        event.target
                          .value
                      )
                    }
                    placeholder="General Donation"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Notes
                  </label>

                  <textarea
                    rows={3}
                    value={
                      form.notes
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        'notes',
                        event.target
                          .value
                      )
                    }
                    placeholder="Optional notes..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    closeCreateModal
                  }
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus
                        size={16}
                      />

                      Save Donation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Void Modal */}

      {showVoidModal &&
        selectedDonation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Void Donation
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    This action will keep the
                    record but remove it from
                    financial totals.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeVoidModal
                  }
                  disabled={
                    actionLoading
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X
                    size={18}
                  />
                </button>
              </div>

              <div className="p-5">
                <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-800">
                    {selectedDonation
                      .donor
                      ?.name}
                  </p>

                  <p className="mt-1 text-sm text-red-700">
                    {formatCurrency(
                      selectedDonation.amount
                    )}
                  </p>
                </div>

                <div className="mt-4">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Reason
                  </label>

                  <textarea
                    rows={4}
                    value={
                      voidReason
                    }
                    onChange={(
                      event
                    ) =>
                      setVoidReason(
                        event.target
                          .value
                      )
                    }
                    placeholder="Enter reason for voiding this donation..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50"
                  />
                </div>

                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={
                      closeVoidModal
                    }
                    disabled={
                      actionLoading
                    }
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleVoidDonation
                    }
                    disabled={
                      actionLoading
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {actionLoading ? (
                      <>
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />

                        Voiding...
                      </>
                    ) : (
                      'Void Donation'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Details Modal */}

      {showDetailsModal &&
        selectedDonation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Donation Details
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {selectedDonation.id}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeDetails
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X
                    size={18}
                  />
                </button>
              </div>

              <div className="overflow-y-auto p-5">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-500">
                        Donor
                      </p>

                      <p className="mt-1 text-xl font-bold text-slate-900">
                        {
                          selectedDonation
                            .donor
                            ?.name
                        }
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {
                          selectedDonation
                            .donor
                            ?.phone
                        }
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-sm text-slate-500">
                        Amount
                      </p>

                      <p className="mt-1 text-2xl font-bold text-indigo-600">
                        {formatCurrency(
                          selectedDonation.amount
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Donation Date
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {formatDate(
                        selectedDonation.donationDate
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Financial Year
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {
                        selectedDonation.financialYear
                      }
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Payment Method
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {paymentMethodLabel(
                        selectedDonation.paymentMethod
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Receipt Number
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {selectedDonation.receiptNumber ||
                        '-'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Reference Number
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {selectedDonation.referenceNumber ||
                        '-'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Purpose
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {selectedDonation.purpose ||
                        '-'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Notes
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                      {selectedDonation.notes ||
                        '-'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Created By
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {
                        selectedDonation
                          .createdBy
                          ?.name
                      }
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Status
                    </p>

                    <p className="mt-2">
                      {selectedDonation.status ===
                      'active' ? (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                          Voided
                        </span>
                      )}
                    </p>
                  </div>

                  {selectedDonation.status ===
                    'voided' && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
                        Void Reason
                      </p>

                      <p className="mt-2 text-sm text-red-800">
                        {
                          selectedDonation.voidReason
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-200 px-5 py-4">
                <button
                  type="button"
                  onClick={
                    closeDetails
                  }
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
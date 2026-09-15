'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

const initialForm = {
  amount: '',
  expenseDate: new Date()
    .toISOString()
    .split('T')[0],
  category: '',
  description: '',
  paymentMethod: 'cash',
  referenceNumber: '',
  vendorName: '',
  notes: '',
};

const expenseCategories = [
  'Electricity',
  'Water',
  'Maintenance',
  'Salary',
  'Cleaning',
  'Puja Materials',
  'Flowers',
  'Food',
  'Repairs',
  'Utilities',
  'Office Supplies',
  'Events',
  'Transportation',
  'Other',
];

const paymentMethods = [
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

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
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

function getPaymentLabel(method) {
  const paymentMethod =
    paymentMethods.find(
      (item) => item.value === method
    );

  return (
    paymentMethod?.label ||
    method ||
    '-'
  );
}

function getCurrentFinancialYear() {
  const date = new Date();

  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  if (month >= 4) {
    return `${year}-${String(
      year + 1
    ).slice(-2)}`;
  }

  return `${year - 1}-${String(
    year
  ).slice(-2)}`;
}

function getFinancialYears() {
  const currentYear =
    new Date().getFullYear();

  const currentMonth =
    new Date().getMonth() + 1;

  const startYear =
    currentMonth >= 4
      ? currentYear
      : currentYear - 1;

  return Array.from(
    { length: 6 },
    (_, index) => {
      const year =
        startYear - index;

      return `${year}-${String(
        year + 1
      ).slice(-2)}`;
    }
  );
}

export default function ExpensesPage() {
  const [expenses, setExpenses] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [voidLoading, setVoidLoading] =
    useState(false);

  const [search, setSearch] =
    useState('');

  const [status, setStatus] =
    useState('active');

  const [
    financialYear,
    setFinancialYear,
  ] = useState(
    getCurrentFinancialYear()
  );

  const [
    category,
    setCategory,
  ] = useState('');

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState('');

  const [summary, setSummary] =
    useState({
      totalCount: 0,
      totalAmount: 0,
      cashAmount: 0,
      digitalAmount: 0,
    });

  const [
    showFormModal,
    setShowFormModal,
  ] = useState(false);

  const [form, setForm] =
    useState(initialForm);

  const [
    voidExpense,
    setVoidExpense,
  ] = useState(null);

  const [
    voidReason,
    setVoidReason,
  ] = useState('');

  const [
    alert,
    setAlert,
  ] = useState({
    type: '',
    message: '',
  });

  const showAlert = useCallback(
    (type, message) => {
      setAlert({
        type,
        message,
      });

      window.setTimeout(() => {
        setAlert({
          type: '',
          message: '',
        });
      }, 4000);
    },
    []
  );

  const fetchExpenses =
    useCallback(async () => {
      try {
        setLoading(true);

        const params =
          new URLSearchParams();

        params.set(
          'status',
          status
        );

        if (search.trim()) {
          params.set(
            'search',
            search.trim()
          );
        }

        if (financialYear) {
          params.set(
            'financialYear',
            financialYear
          );
        }

        if (category) {
          params.set(
            'category',
            category
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
            `/api/expenses?${params.toString()}`,
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
              'Failed to fetch expenses'
          );
        }

        setExpenses(
          result.data || []
        );

        setSummary(
          result.summary || {
            totalCount: 0,
            totalAmount: 0,
            cashAmount: 0,
            digitalAmount: 0,
          }
        );
      } catch (error) {
        console.error(
          'Expense fetch error:',
          error
        );

        showAlert(
          'error',
          error.message ||
            'Failed to fetch expenses'
        );
      } finally {
        setLoading(false);
      }
    }, [
      category,
      financialYear,
      paymentMethod,
      search,
      showAlert,
      status,
    ]);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        fetchExpenses();
      }, 300);

    return () =>
      window.clearTimeout(
        timer
      );
  }, [fetchExpenses]);

  const activeCount =
    useMemo(() => {
      return expenses.filter(
        (expense) =>
          expense.status ===
          'active'
      ).length;
    }, [expenses]);

  const voidedCount =
    useMemo(() => {
      return expenses.filter(
        (expense) =>
          expense.status ===
          'voided'
      ).length;
    }, [expenses]);

  function openAddModal() {
    setForm({
      ...initialForm,
      expenseDate: new Date()
        .toISOString()
        .split('T')[0],
    });

    setShowFormModal(true);
  }

  function closeFormModal() {
    if (saving) {
      return;
    }

    setShowFormModal(false);
    setForm(initialForm);
  }

  function handleInputChange(
    event
  ) {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (current) => ({
        ...current,
        [name]: value,
      })
    );
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    if (
      !form.amount ||
      Number(form.amount) <= 0
    ) {
      showAlert(
        'error',
        'Enter a valid expense amount'
      );

      return;
    }

    if (!form.expenseDate) {
      showAlert(
        'error',
        'Expense date is required'
      );

      return;
    }

    if (!form.category.trim()) {
      showAlert(
        'error',
        'Expense category is required'
      );

      return;
    }

    try {
      setSaving(true);

      const response =
        await fetch(
          '/api/expenses',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              amount:
                Number(
                  form.amount
                ),
              expenseDate:
                form.expenseDate,
              category:
                form.category.trim(),
              description:
                form.description.trim(),
              paymentMethod:
                form.paymentMethod,
              referenceNumber:
                form.referenceNumber.trim(),
              vendorName:
                form.vendorName.trim(),
              notes:
                form.notes.trim(),
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
            'Failed to create expense'
        );
      }

      showAlert(
        'success',
        'Expense added successfully'
      );

      closeFormModal();

      await fetchExpenses();
    } catch (error) {
      console.error(
        'Expense creation error:',
        error
      );

      showAlert(
        'error',
        error.message ||
          'Failed to create expense'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleVoidExpense() {
    if (!voidExpense) {
      return;
    }

    if (!voidReason.trim()) {
      showAlert(
        'error',
        'Void reason is required'
      );

      return;
    }

    try {
      setVoidLoading(true);

      const response =
        await fetch(
          '/api/expenses',
          {
            method: 'PATCH',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              id: voidExpense.id,
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
            'Failed to void expense'
        );
      }

      showAlert(
        'success',
        'Expense voided successfully'
      );

      setVoidExpense(null);
      setVoidReason('');

      await fetchExpenses();
    } catch (error) {
      console.error(
        'Expense void error:',
        error
      );

      showAlert(
        'error',
        error.message ||
          'Failed to void expense'
      );
    } finally {
      setVoidLoading(false);
    }
  }

  function clearFilters() {
    setSearch('');
    setFinancialYear('');
    setCategory('');
    setPaymentMethod('');
  }

  const hasFilters =
    search ||
    financialYear ||
    category ||
    paymentMethod;

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Expenses
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Track temple expenses and manage financial records.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <span className="text-lg leading-none">
              +
            </span>

            Add Expense
          </button>
        </div>

        {/* Alert */}
        {alert.message && (
          <div
            className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
              alert.type ===
              'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {alert.message}
          </div>
        )}

        {/* Summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Total Expenses
            </div>

            <div className="mt-2 text-2xl font-bold text-slate-900">
              {formatCurrency(
                summary.totalAmount
              )}
            </div>

            <div className="mt-1 text-xs text-slate-400">
              {summary.totalCount}{' '}
              active transactions
            </div>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Cash Expenses
            </div>

            <div className="mt-2 text-2xl font-bold text-slate-900">
              {formatCurrency(
                summary.cashAmount
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Digital Expenses
            </div>

            <div className="mt-2 text-2xl font-bold text-slate-900">
              {formatCurrency(
                summary.digitalAmount
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Voided
            </div>

            <div className="mt-2 text-2xl font-bold text-slate-900">
              {voidedCount}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                🔍
              </span>

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search expenses..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Financial Year */}
            <select
              value={financialYear}
              onChange={(event) =>
                setFinancialYear(
                  event.target.value
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
                    FY {year}
                  </option>
                )
              )}
            </select>

            {/* Category */}
            <select
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">
                All Categories
              </option>

              {expenseCategories.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>

            {/* Payment */}
            <select
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(
                  event.target.value
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">
                All Payments
              </option>

              {paymentMethods.map(
                (item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                )
              )}
            </select>
          </div>

          {hasFilters && (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Status tabs */}
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() =>
                setStatus('active')
              }
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                status === 'active'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Active
            </button>

            <button
              type="button"
              onClick={() =>
                setStatus('voided')
              }
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                status === 'voided'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Voided
            </button>
          </div>

          <div className="hidden text-sm text-slate-500 sm:block">
            {expenses.length}{' '}
            record
            {expenses.length ===
            1
              ? ''
              : 's'}
          </div>
        </div>

        {/* Expense List */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-5">
              <div className="animate-pulse space-y-4">
                {[
                  1, 2, 3, 4, 5,
                ].map((item) => (
                  <div
                    key={item}
                    className="h-16 rounded-xl bg-slate-100"
                  />
                ))}
              </div>
            </div>
          ) : expenses.length ===
            0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                ₹
              </div>

              <h3 className="mt-4 text-base font-semibold text-slate-900">
                No expenses found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {hasFilters
                  ? 'Try changing your filters.'
                  : status ===
                      'active'
                    ? 'Add your first expense to get started.'
                    : 'There are no voided expenses.'}
              </p>

              {!hasFilters &&
                status ===
                  'active' && (
                  <button
                    type="button"
                    onClick={
                      openAddModal
                    }
                    className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Add Expense
                  </button>
                )}
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Date
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Expense
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Vendor
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Payment
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Amount
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {expenses.map(
                      (expense) => (
                        <tr
                          key={
                            expense.id
                          }
                          className="transition hover:bg-slate-50"
                        >
                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                            {formatDate(
                              expense.expenseDate
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-900">
                              {
                                expense.category
                              }
                            </div>

                            {expense.description && (
                              <div className="mt-0.5 max-w-xs truncate text-xs text-slate-500">
                                {
                                  expense.description
                                }
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {
                              expense.vendorName ||
                                '-'
                            }
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {getPaymentLabel(
                              expense.paymentMethod
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold text-slate-900">
                            {formatCurrency(
                              expense.amount
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                expense.status ===
                                'voided'
                                  ? 'border-red-200 bg-red-50 text-red-700'
                                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {expense.status ===
                              'voided'
                                ? 'Voided'
                                : 'Active'}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            {expense.status ===
                              'active' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setVoidExpense(
                                    expense
                                  );
                                  setVoidReason(
                                    ''
                                  );
                                }}
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                              >
                                Void
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="divide-y divide-slate-100 md:hidden">
                {expenses.map(
                  (expense) => (
                    <div
                      key={
                        expense.id
                      }
                      className="p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {
                              expense.category
                            }
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            {formatDate(
                              expense.expenseDate
                            )}
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-slate-900">
                            {formatCurrency(
                              expense.amount
                            )}
                          </div>

                          <span
                            className={`mt-1 inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${
                              expense.status ===
                              'voided'
                                ? 'border-red-200 bg-red-50 text-red-700'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {expense.status ===
                            'voided'
                              ? 'Voided'
                              : 'Active'}
                          </span>
                        </div>
                      </div>

                      {expense.description && (
                        <p className="mt-3 text-sm text-slate-600">
                          {
                            expense.description
                          }
                        </p>
                      )}

                      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                        <div>
                          <div className="text-xs text-slate-400">
                            Payment
                          </div>

                          <div className="mt-1 text-sm font-medium text-slate-700">
                            {getPaymentLabel(
                              expense.paymentMethod
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-slate-400">
                            Vendor
                          </div>

                          <div className="mt-1 truncate text-sm font-medium text-slate-700">
                            {
                              expense.vendorName ||
                                '-'
                            }
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-slate-400">
                            Financial Year
                          </div>

                          <div className="mt-1 text-sm font-medium text-slate-700">
                            FY{' '}
                            {
                              expense.financialYear
                            }
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-slate-400">
                            Reference
                          </div>

                          <div className="mt-1 truncate text-sm font-medium text-slate-700">
                            {
                              expense.referenceNumber ||
                                '-'
                            }
                          </div>
                        </div>
                      </div>

                      {expense.status ===
                        'active' && (
                        <button
                          type="button"
                          onClick={() => {
                            setVoidExpense(
                              expense
                            );
                            setVoidReason(
                              ''
                            );
                          }}
                          className="mt-4 w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700"
                        >
                          Void Expense
                        </button>
                      )}

                      {expense.status ===
                        'voided' &&
                        expense.voidReason && (
                          <div className="mt-4 rounded-xl bg-red-50 p-3">
                            <div className="text-xs font-semibold text-red-600">
                              Void Reason
                            </div>

                            <div className="mt-1 text-sm text-red-700">
                              {
                                expense.voidReason
                              }
                            </div>
                          </div>
                        )}
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Add Expense
                </h2>

                <p className="mt-0.5 text-sm text-slate-500">
                  Record a new temple expense.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeFormModal
                }
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                {/* Amount */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Amount *
                  </label>

                  <input
                    type="number"
                    name="amount"
                    value={
                      form.amount
                    }
                    onChange={
                      handleInputChange
                    }
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    required
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Expense Date *
                  </label>

                  <input
                    type="date"
                    name="expenseDate"
                    value={
                      form.expenseDate
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Category *
                  </label>

                  <select
                    name="category"
                    value={
                      form.category
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">
                      Select category
                    </option>

                    {expenseCategories.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Payment */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Payment Method *
                  </label>

                  <select
                    name="paymentMethod"
                    value={
                      form.paymentMethod
                    }
                    onChange={
                      handleInputChange
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    {paymentMethods.map(
                      (item) => (
                        <option
                          key={
                            item.value
                          }
                          value={
                            item.value
                          }
                        >
                          {
                            item.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Vendor */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Vendor / Paid To
                  </label>

                  <input
                    type="text"
                    name="vendorName"
                    value={
                      form.vendorName
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="Vendor or person name"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {/* Reference */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Reference Number
                  </label>

                  <input
                    type="text"
                    name="referenceNumber"
                    value={
                      form.referenceNumber
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="Transaction / bill number"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Description
                  </label>

                  <input
                    type="text"
                    name="description"
                    value={
                      form.description
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="What was this expense for?"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Notes
                  </label>

                  <textarea
                    name="notes"
                    value={
                      form.notes
                    }
                    onChange={
                      handleInputChange
                    }
                    rows={3}
                    placeholder="Additional notes"
                    className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    closeFormModal
                  }
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving
                    ? 'Saving...'
                    : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Void Expense Modal */}
      {voidExpense && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-xl">
              ⚠️
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Void Expense?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              This expense will be marked as
              voided and will no longer be
              included in the financial balance.
            </p>

            <div className="mt-4 rounded-xl bg-slate-50 p-3">
              <div className="text-xs text-slate-400">
                Expense
              </div>

              <div className="mt-1 font-semibold text-slate-900">
                {
                  voidExpense.category
                }
              </div>

              <div className="mt-1 text-sm text-slate-600">
                {formatCurrency(
                  voidExpense.amount
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Reason *
              </label>

              <textarea
                value={
                  voidReason
                }
                onChange={(event) =>
                  setVoidReason(
                    event.target.value
                  )
                }
                rows={3}
                placeholder="Why is this expense being voided?"
                className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setVoidExpense(
                    null
                  );
                  setVoidReason(
                    ''
                  );
                }}
                disabled={
                  voidLoading
                }
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleVoidExpense
                }
                disabled={
                  voidLoading
                }
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {voidLoading
                  ? 'Voiding...'
                  : 'Void Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
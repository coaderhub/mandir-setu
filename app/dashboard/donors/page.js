'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

const initialForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  notes: '',
};

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

  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getPaymentLabel(method) {
  const labels = {
    cash: 'Cash',
    upi: 'UPI',
    bank_transfer: 'Bank Transfer',
    cheque: 'Cheque',
    card: 'Card',
    other: 'Other',
  };

  return labels[method] || method || '-';
}

function getStatusClasses(status) {
  if (status === 'voided') {
    return 'bg-red-50 text-red-700 border-red-200';
  }

  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
}

export default function DonorsPage() {
  const [donors, setDonors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active');

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingDonor, setEditingDonor] = useState(null);

  const [form, setForm] = useState(initialForm);

  const [actionDonor, setActionDonor] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [historyDonor, setHistoryDonor] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState(null);

  const [alert, setAlert] = useState({
    type: '',
    message: '',
  });

  const showAlert = useCallback((type, message) => {
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
  }, []);

  const fetchDonors = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      params.set('status', status);

      if (search.trim()) {
        params.set('search', search.trim());
      }

      const response = await fetch(
        `/api/donors?${params.toString()}`,
        {
          method: 'GET',
          cache: 'no-store',
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Failed to fetch donors'
        );
      }

      setDonors(result.data || []);
    } catch (error) {
      console.error('Donor fetch error:', error);

      showAlert(
        'error',
        error.message || 'Failed to fetch donors'
      );
    } finally {
      setLoading(false);
    }
  }, [search, status, showAlert]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchDonors();
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [fetchDonors]);

  const activeCount = useMemo(() => {
    return donors.filter(
      (donor) => donor.status === 'active'
    ).length;
  }, [donors]);

  const archivedCount = useMemo(() => {
    return donors.filter(
      (donor) => donor.status === 'archived'
    ).length;
  }, [donors]);

  function openAddModal() {
    setEditingDonor(null);
    setForm(initialForm);
    setShowFormModal(true);
  }

  function openEditModal(donor) {
    setEditingDonor(donor);

    setForm({
      name: donor.name || '',
      phone: donor.phone || '',
      email: donor.email || '',
      address: donor.address || '',
      city: donor.city || '',
      notes: donor.notes || '',
    });

    setShowFormModal(true);
  }

  function closeFormModal() {
    if (saving) {
      return;
    }

    setShowFormModal(false);
    setEditingDonor(null);
    setForm(initialForm);
  }

  function handleInputChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      showAlert(
        'error',
        'Donor name is required'
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        notes: form.notes.trim(),
      };

      let response;

      if (editingDonor) {
        response = await fetch('/api/donors', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: editingDonor.id,
            ...payload,
          }),
        });
      } else {
        response = await fetch('/api/donors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            'Failed to save donor'
        );
      }

      showAlert(
        'success',
        editingDonor
          ? 'Donor updated successfully'
          : 'Donor created successfully'
      );

      closeFormModal();

      await fetchDonors();
    } catch (error) {
      console.error('Donor save error:', error);

      showAlert(
        'error',
        error.message || 'Failed to save donor'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange() {
    if (!actionDonor) {
      return;
    }

    try {
      setActionLoading(true);

      const newStatus =
        actionDonor.status === 'active'
          ? 'archived'
          : 'active';

      const response = await fetch('/api/donors', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: actionDonor.id,
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            'Failed to update donor'
        );
      }

      showAlert(
        'success',
        newStatus === 'archived'
          ? 'Donor archived successfully'
          : 'Donor restored successfully'
      );

      setActionDonor(null);

      await fetchDonors();
    } catch (error) {
      console.error(
        'Donor status update error:',
        error
      );

      showAlert(
        'error',
        error.message ||
          'Failed to update donor'
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function openHistory(donor) {
    setHistoryDonor(donor);
    setHistoryData(null);
    setHistoryLoading(true);

    try {
      const response = await fetch(
        `/api/donors/${donor.id}/donations`,
        {
          method: 'GET',
          cache: 'no-store',
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            'Failed to fetch donation history'
        );
      }

      setHistoryData(result);
    } catch (error) {
      console.error(
        'Donation history error:',
        error
      );

      showAlert(
        'error',
        error.message ||
          'Failed to fetch donation history'
      );

      setHistoryDonor(null);
    } finally {
      setHistoryLoading(false);
    }
  }

  function closeHistory() {
    if (historyLoading) {
      return;
    }

    setHistoryDonor(null);
    setHistoryData(null);
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Donors
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage temple donors and view their donation history.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <span className="text-lg leading-none">
              +
            </span>

            Add Donor
          </button>
        </div>

        {/* Alert */}
        {alert.message && (
          <div
            className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
              alert.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {alert.message}
          </div>
        )}

        {/* Summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Active Donors
            </div>

            <div className="mt-2 text-2xl font-bold text-slate-900">
              {activeCount}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Archived Donors
            </div>

            <div className="mt-2 text-2xl font-bold text-slate-900">
              {archivedCount}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                🔍
              </span>

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by name, phone, email or city..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="inline-flex w-full rounded-xl bg-slate-100 p-1 lg:w-auto">
              <button
                type="button"
                onClick={() => setStatus('active')}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition lg:flex-none ${
                  status === 'active'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Active
              </button>

              <button
                type="button"
                onClick={() => setStatus('archived')}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition lg:flex-none ${
                  status === 'archived'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Archived
              </button>
            </div>
          </div>
        </div>

        {/* Donor List */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-5">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div
                    key={item}
                    className="h-16 rounded-xl bg-slate-100"
                  />
                ))}
              </div>
            </div>
          ) : donors.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                👤
              </div>

              <h3 className="mt-4 text-base font-semibold text-slate-900">
                No donors found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {search
                  ? 'Try changing your search.'
                  : status === 'active'
                    ? 'Add your first donor to get started.'
                    : 'There are no archived donors.'}
              </p>

              {!search && status === 'active' && (
                <button
                  type="button"
                  onClick={openAddModal}
                  className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Add Donor
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
                        Donor
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Contact
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Location
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
                    {donors.map((donor) => (
                      <tr
                        key={donor.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                              {donor.name
                                ?.charAt(0)
                                ?.toUpperCase() || 'D'}
                            </div>

                            <div>
                              <div className="font-semibold text-slate-900">
                                {donor.name}
                              </div>

                              {donor.email && (
                                <div className="mt-0.5 text-xs text-slate-500">
                                  {donor.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {donor.phone || '-'}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {donor.city || '-'}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              donor.status === 'active'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 bg-slate-100 text-slate-600'
                            }`}
                          >
                            {donor.status === 'active'
                              ? 'Active'
                              : 'Archived'}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openHistory(donor)
                              }
                              className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                            >
                              History
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(donor)
                              }
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setActionDonor(donor)
                              }
                              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                                donor.status === 'active'
                                  ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              {donor.status === 'active'
                                ? 'Archive'
                                : 'Restore'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="divide-y divide-slate-100 md:hidden">
                {donors.map((donor) => (
                  <div
                    key={donor.id}
                    className="p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                        {donor.name
                          ?.charAt(0)
                          ?.toUpperCase() || 'D'}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              {donor.name}
                            </h3>

                            <p className="mt-0.5 text-sm text-slate-500">
                              {donor.phone || 'No phone'}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              donor.status === 'active'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 bg-slate-100 text-slate-600'
                            }`}
                          >
                            {donor.status === 'active'
                              ? 'Active'
                              : 'Archived'}
                          </span>
                        </div>

                        {donor.city && (
                          <p className="mt-2 text-sm text-slate-500">
                            {donor.city}
                          </p>
                        )}

                        <div className="mt-4 grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openHistory(donor)
                            }
                            className="rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-2 text-xs font-semibold text-indigo-700"
                          >
                            History
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(donor)
                            }
                            className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setActionDonor(donor)
                            }
                            className={`rounded-lg border px-2 py-2 text-xs font-semibold ${
                              donor.status === 'active'
                                ? 'border-red-200 bg-red-50 text-red-700'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {donor.status === 'active'
                              ? 'Archive'
                              : 'Restore'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Donor Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingDonor
                    ? 'Edit Donor'
                    : 'Add Donor'}
                </h2>

                <p className="mt-0.5 text-sm text-slate-500">
                  {editingDonor
                    ? 'Update donor information.'
                    : 'Add a new donor to your temple.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeFormModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Donor Name *
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    placeholder="Enter donor name"
                    required
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Phone
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleInputChange}
                    placeholder="Phone number"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleInputChange}
                    placeholder="Email address"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    City
                  </label>

                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleInputChange}
                    placeholder="City"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Address
                  </label>

                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleInputChange}
                    placeholder="Address"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Notes
                  </label>

                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Optional notes"
                    className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeFormModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? 'Saving...'
                    : editingDonor
                      ? 'Update Donor'
                      : 'Create Donor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive / Restore Confirmation */}
      {actionDonor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-xl">
              ⚠️
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              {actionDonor.status === 'active'
                ? 'Archive Donor?'
                : 'Restore Donor?'}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {actionDonor.status === 'active'
                ? `Are you sure you want to archive ${actionDonor.name}? Existing donation history will remain available.`
                : `Restore ${actionDonor.name} as an active donor?`}
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setActionDonor(null)
                }
                disabled={actionLoading}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleStatusChange}
                disabled={actionLoading}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${
                  actionDonor.status === 'active'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {actionLoading
                  ? 'Processing...'
                  : actionDonor.status === 'active'
                    ? 'Archive Donor'
                    : 'Restore Donor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Donation History Modal */}
      {historyDonor && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-3 sm:p-5">
          <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
                  {historyDonor.name
                    ?.charAt(0)
                    ?.toUpperCase() || 'D'}
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-slate-900">
                    {historyDonor.name}
                  </h2>

                  <p className="truncate text-sm text-slate-500">
                    Donation History
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeHistory}
                disabled={historyLoading}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {historyLoading ? (
                <div className="p-6">
                  <div className="animate-pulse space-y-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="h-24 rounded-2xl bg-slate-100" />
                      <div className="h-24 rounded-2xl bg-slate-100" />
                      <div className="h-24 rounded-2xl bg-slate-100" />
                    </div>

                    <div className="h-10 rounded-xl bg-slate-100" />

                    <div className="space-y-3">
                      <div className="h-16 rounded-xl bg-slate-100" />
                      <div className="h-16 rounded-xl bg-slate-100" />
                      <div className="h-16 rounded-xl bg-slate-100" />
                    </div>
                  </div>
                </div>
              ) : historyData ? (
                <div className="p-5 sm:p-6">
                  {/* Donor Information */}
                  <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Phone
                        </div>

                        <div className="mt-1 text-sm font-semibold text-slate-800">
                          {historyData.donor?.phone ||
                            '-'}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Email
                        </div>

                        <div className="mt-1 break-all text-sm font-semibold text-slate-800">
                          {historyData.donor?.email ||
                            '-'}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          City
                        </div>

                        <div className="mt-1 text-sm font-semibold text-slate-800">
                          {historyData.donor?.city ||
                            '-'}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Status
                        </div>

                        <div className="mt-1">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              historyData.donor?.status ===
                              'active'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 bg-slate-100 text-slate-600'
                            }`}
                          >
                            {historyData.donor?.status ===
                            'active'
                              ? 'Active'
                              : 'Archived'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {historyData.donor?.address && (
                      <div className="mt-4 border-t border-slate-200 pt-4">
                        <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Address
                        </div>

                        <div className="mt-1 text-sm text-slate-700">
                          {historyData.donor.address}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Summary Cards */}
                  <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                      <div className="text-sm font-medium text-indigo-600">
                        Total Donated
                      </div>

                      <div className="mt-2 text-2xl font-bold text-indigo-900">
                        {formatCurrency(
                          historyData.summary
                            ?.totalAmount
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                      <div className="text-sm font-medium text-emerald-600">
                        Donations
                      </div>

                      <div className="mt-2 text-2xl font-bold text-emerald-900">
                        {historyData.summary
                          ?.totalDonationCount || 0}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div className="text-sm font-medium text-slate-500">
                        Financial Years
                      </div>

                      <div className="mt-2 text-2xl font-bold text-slate-900">
                        {historyData.summary
                          ?.financialYearTotals
                          ?.length || 0}
                      </div>
                    </div>
                  </div>

                  {/* Financial Year Summary */}
                  {historyData.summary
                    ?.financialYearTotals?.length >
                    0 && (
                    <div className="mb-6">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-base font-bold text-slate-900">
                          Year-wise Donations
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {historyData.summary.financialYearTotals.map(
                          (item) => (
                            <div
                              key={
                                item.financialYear
                              }
                              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
                            >
                              <span className="text-sm font-medium text-slate-600">
                                FY{' '}
                                {
                                  item.financialYear
                                }
                              </span>

                              <span className="text-sm font-bold text-slate-900">
                                {formatCurrency(
                                  item.amount
                                )}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Donation History */}
                  <div>
                    <div className="mb-3">
                      <h3 className="text-base font-bold text-slate-900">
                        Donation Transactions
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Complete donation transaction history.
                      </p>
                    </div>

                    {historyData.data?.length ===
                    0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                        <div className="text-3xl">
                          ₹
                        </div>

                        <h4 className="mt-3 text-sm font-semibold text-slate-900">
                          No donations found
                        </h4>

                        <p className="mt-1 text-sm text-slate-500">
                          This donor does not have any donation transactions yet.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Desktop */}
                        <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 md:block">
                          <table className="min-w-full">
                            <thead>
                              <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Date
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Amount
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Payment
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Financial Year
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Receipt
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Purpose
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Status
                                </th>
                              </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                              {historyData.data.map(
                                (donation) => (
                                  <tr
                                    key={
                                      donation.id
                                    }
                                    className="hover:bg-slate-50"
                                  >
                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                                      {formatDate(
                                        donation.donationDate
                                      )}
                                    </td>

                                    <td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-slate-900">
                                      {formatCurrency(
                                        donation.amount
                                      )}
                                    </td>

                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                                      {getPaymentLabel(
                                        donation.paymentMethod
                                      )}
                                    </td>

                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                                      {donation.financialYear ||
                                        '-'}
                                    </td>

                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                                      {donation.receiptNumber ||
                                        '-'}
                                    </td>

                                    <td className="max-w-[180px] px-4 py-3 text-sm text-slate-600">
                                      <div className="truncate">
                                        {donation.purpose ||
                                          '-'}
                                      </div>
                                    </td>

                                    <td className="px-4 py-3">
                                      <span
                                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                                          donation.status
                                        )}`}
                                      >
                                        {donation.status ===
                                        'voided'
                                          ? 'Voided'
                                          : 'Active'}
                                      </span>
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile */}
                        <div className="space-y-3 md:hidden">
                          {historyData.data.map(
                            (donation) => (
                              <div
                                key={
                                  donation.id
                                }
                                className="rounded-2xl border border-slate-200 bg-white p-4"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="text-base font-bold text-slate-900">
                                      {formatCurrency(
                                        donation.amount
                                      )}
                                    </div>

                                    <div className="mt-1 text-sm text-slate-500">
                                      {formatDate(
                                        donation.donationDate
                                      )}
                                    </div>
                                  </div>

                                  <span
                                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                                      donation.status
                                    )}`}
                                  >
                                    {donation.status ===
                                    'voided'
                                      ? 'Voided'
                                      : 'Active'}
                                  </span>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                                  <div>
                                    <div className="text-xs text-slate-400">
                                      Payment
                                    </div>

                                    <div className="mt-1 text-sm font-medium text-slate-700">
                                      {getPaymentLabel(
                                        donation.paymentMethod
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <div className="text-xs text-slate-400">
                                      Financial Year
                                    </div>

                                    <div className="mt-1 text-sm font-medium text-slate-700">
                                      {donation.financialYear ||
                                        '-'}
                                    </div>
                                  </div>

                                  <div>
                                    <div className="text-xs text-slate-400">
                                      Receipt
                                    </div>

                                    <div className="mt-1 text-sm font-medium text-slate-700">
                                      {donation.receiptNumber ||
                                        '-'}
                                    </div>
                                  </div>

                                  <div>
                                    <div className="text-xs text-slate-400">
                                      Purpose
                                    </div>

                                    <div className="mt-1 truncate text-sm font-medium text-slate-700">
                                      {donation.purpose ||
                                        '-'}
                                    </div>
                                  </div>
                                </div>

                                {donation.referenceNumber && (
                                  <div className="mt-3 border-t border-slate-100 pt-3">
                                    <div className="text-xs text-slate-400">
                                      Reference Number
                                    </div>

                                    <div className="mt-1 text-sm font-medium text-slate-700">
                                      {
                                        donation.referenceNumber
                                      }
                                    </div>
                                  </div>
                                )}

                                {donation.status ===
                                  'voided' &&
                                  donation.voidReason && (
                                    <div className="mt-3 rounded-xl bg-red-50 p-3">
                                      <div className="text-xs font-semibold text-red-600">
                                        Void Reason
                                      </div>

                                      <div className="mt-1 text-sm text-red-700">
                                        {
                                          donation.voidReason
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
              ) : null}
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  {historyData?.data?.length || 0}{' '}
                  transaction
                  {historyData?.data?.length ===
                  1
                    ? ''
                    : 's'}
                </div>

                <button
                  type="button"
                  onClick={closeHistory}
                  disabled={historyLoading}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
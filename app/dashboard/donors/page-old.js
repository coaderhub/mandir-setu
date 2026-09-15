'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

export default function DonorsPage() {
  const [donors, setDonors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] =
    useState('active');

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] =
    useState(false);

  const [editingDonor, setEditingDonor] =
    useState(null);

  const [actionDonor, setActionDonor] =
    useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] =
    useState('');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    notes: '',
  });

  useEffect(() => {
    loadDonors('', statusFilter);
  }, [statusFilter]);

  async function loadDonors(
    searchValue = search,
    selectedStatus = statusFilter
  ) {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();

      params.set('status', selectedStatus);

      if (searchValue.trim()) {
        params.set(
          'search',
          searchValue.trim()
        );
      }

      const response = await fetch(
        `/api/donors?${params.toString()}`,
        {
          method: 'GET',
          cache: 'no-store',
        }
      );

      const result =
        await response.json();

      if (!response.ok || !result.success) {
        if (response.status === 401) {
          window.location.href = '/login';
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
          'Unable to load donors.'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(event) {
    event.preventDefault();

    loadDonors(search, statusFilter);
  }

  function handleSearchChange(event) {
    setSearch(event.target.value);
  }

  function clearSearch() {
    setSearch('');
    loadDonors('', statusFilter);
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
      name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      notes: '',
    });
  }

  function openAddModal() {
    resetForm();

    setEditingDonor(null);
    setError('');
    setSuccess('');
    setModalOpen(true);
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

    setError('');
    setSuccess('');
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingDonor(null);
    setError('');
  }

  function openStatusConfirm(donor) {
    setActionDonor(donor);
    setError('');
    setConfirmOpen(true);
  }

  function closeConfirm() {
    if (saving) {
      return;
    }

    setConfirmOpen(false);
    setActionDonor(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!form.name.trim()) {
      setError(
        'Donor name is required.'
      );
      return;
    }

    try {
      setSaving(true);

      const isEditing =
        Boolean(editingDonor);

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email
          .trim()
          .toLowerCase(),
        address: form.address.trim(),
        city: form.city.trim(),
        notes: form.notes.trim(),
      };

      if (isEditing) {
        payload.id = editingDonor.id;
        payload.status =
          editingDonor.status;
      }

      const response = await fetch(
        '/api/donors',
        {
          method: isEditing
            ? 'PATCH'
            : 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify(payload),
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
            'Failed to save donor'
        );
      }

      setModalOpen(false);
      setEditingDonor(null);
      resetForm();

      setSuccess(
        isEditing
          ? 'Donor updated successfully.'
          : 'Donor added successfully.'
      );

      await loadDonors(
        search,
        statusFilter
      );
    } catch (error) {
      console.error(
        'Donor save error:',
        error
      );

      setError(
        error.message ||
          'Unable to save donor.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange() {
    if (!actionDonor) {
      return;
    }

    const newStatus =
      actionDonor.status === 'active'
        ? 'archived'
        : 'active';

    try {
      setSaving(true);
      setError('');

      const response = await fetch(
        '/api/donors',
        {
          method: 'PATCH',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            id: actionDonor.id,

            name:
              actionDonor.name || '',

            phone:
              actionDonor.phone || '',

            email:
              actionDonor.email || '',

            address:
              actionDonor.address || '',

            city:
              actionDonor.city || '',

            notes:
              actionDonor.notes || '',

            status: newStatus,
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
            'Failed to update donor'
        );
      }

      setConfirmOpen(false);
      setActionDonor(null);

      setSuccess(
        newStatus === 'archived'
          ? 'Donor archived successfully.'
          : 'Donor restored successfully.'
      );

      await loadDonors(
        search,
        statusFilter
      );
    } catch (error) {
      console.error(
        'Donor status error:',
        error
      );

      setError(
        error.message ||
          'Unable to update donor.'
      );
    } finally {
      setSaving(false);
    }
  }

  const totalDonors = donors.length;

  const activeCount = useMemo(() => {
    return donors.filter(
      (donor) =>
        donor.status === 'active'
    ).length;
  }, [donors]);

  const archivedCount =
    useMemo(() => {
      return donors.filter(
        (donor) =>
          donor.status === 'archived'
      ).length;
    }, [donors]);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1600px]">

        {/* PAGE HEADER */}
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold text-indigo-600">
              Donor Management
            </p>

            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Donors
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage temple donors, contact
              information and donor records.
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

            Add Donor
          </button>
        </div>

        {/* ALERTS */}
        {error && !modalOpen && !confirmOpen && (
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

        {/* SUMMARY CARDS */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <SummaryCard
            title="Total in View"
            value={totalDonors}
            description={
              statusFilter === 'active'
                ? 'Active donor records'
                : 'Archived donor records'
            }
            icon="♙"
          />

          <SummaryCard
            title="Active"
            value={activeCount}
            description="Active donor records"
            icon="✓"
          />

          <SummaryCard
            title="Archived"
            value={archivedCount}
            description="Archived donor records"
            icon="◷"
          />

          <SummaryCard
            title="Current View"
            value={
              statusFilter === 'active'
                ? 'Active'
                : 'Archived'
            }
            description="Selected donor status"
            icon="⌕"
          />

        </div>

        {/* MAIN CARD */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

          {/* TOOLBAR */}
          <div className="border-b border-slate-200 p-4 sm:p-5">

            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

              {/* SEARCH */}
              <form
                onSubmit={
                  handleSearchSubmit
                }
                className="flex flex-1 flex-col gap-3 sm:flex-row"
              >
                <div className="relative flex-1">

                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    ⌕
                  </span>

                  <input
                    type="search"
                    value={search}
                    onChange={
                      handleSearchChange
                    }
                    placeholder="Search donor by name, phone, email or city..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Search
                </button>

                {search && (
                  <button
                    type="button"
                    onClick={
                      clearSearch
                    }
                    className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    Clear
                  </button>
                )}
              </form>

              {/* STATUS FILTER */}
              <div className="flex w-full rounded-xl border border-slate-200 bg-slate-50 p-1 sm:w-fit">

                <button
                  type="button"
                  onClick={() =>
                    setStatusFilter(
                      'active'
                    )
                  }
                  className={`flex-1 rounded-lg px-5 py-2 text-sm font-semibold transition sm:flex-none ${
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
                      'archived'
                    )
                  }
                  className={`flex-1 rounded-lg px-5 py-2 text-sm font-semibold transition sm:flex-none ${
                    statusFilter ===
                    'archived'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Archived
                </button>

              </div>
            </div>
          </div>

          {/* TABLE CONTENT */}
          {loading ? (
            <DonorTableSkeleton />
          ) : donors.length === 0 ? (
            <EmptyDonors
              archived={
                statusFilter ===
                'archived'
              }
              search={search}
              onAdd={openAddModal}
            />
          ) : (
            <DonorTable
              donors={donors}
              onEdit={openEditModal}
              onStatusChange={
                openStatusConfirm
              }
            />
          )}
        </section>
      </div>

      {/* ADD / EDIT MODAL */}
      {modalOpen && (
        <DonorModal
          editingDonor={editingDonor}
          form={form}
          saving={saving}
          error={error}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}

      {/* ARCHIVE / RESTORE MODAL */}
      {confirmOpen && (
        <ConfirmModal
          donor={actionDonor}
          saving={saving}
          onConfirm={
            handleStatusChange
          }
          onClose={closeConfirm}
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
   DONOR MODAL
========================================= */

function DonorModal({
  editingDonor,
  form,
  saving,
  error,
  onChange,
  onSubmit,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">

      <div className="max-h-[95vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl">

        {/* HEADER */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">

          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {editingDonor
                ? 'Edit Donor'
                : 'Add New Donor'}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {editingDonor
                ? 'Update donor information.'
                : 'Enter the donor information.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* BODY */}
        <form
          onSubmit={onSubmit}
          className="p-5 sm:p-6"
        >

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-medium leading-5 text-red-700">
                {error}
              </p>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">

            <FormField
              label="Donor Name"
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="Rajesh Kumar"
              required
            />

            <FormField
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={onChange}
              placeholder="9876543210"
            />

            <FormField
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              placeholder="rajesh@example.com"
            />

            <FormField
              label="City"
              name="city"
              value={form.city}
              onChange={onChange}
              placeholder="Jalandhar"
            />

            <div className="sm:col-span-2">
              <FormField
                label="Address"
                name="address"
                value={
                  form.address
                }
                onChange={onChange}
                placeholder="Complete address"
              />
            </div>

            <div className="sm:col-span-2">

              <label
                htmlFor="notes"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Notes
              </label>

              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={form.notes}
                onChange={onChange}
                placeholder="Optional notes about the donor..."
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
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving...
                </>
              ) : editingDonor ? (
                'Save Changes'
              ) : (
                'Add Donor'
              )}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================
   CONFIRM MODAL
========================================= */

function ConfirmModal({
  donor,
  saving,
  onConfirm,
  onClose,
}) {
  const isArchive =
    donor?.status === 'active';

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">

      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${
            isArchive
              ? 'bg-amber-50 text-amber-600'
              : 'bg-indigo-50 text-indigo-600'
          }`}
        >
          {isArchive ? '!' : '↻'}
        </div>

        <h3 className="mt-5 text-lg font-bold text-slate-900">
          {isArchive
            ? 'Archive donor?'
            : 'Restore donor?'}
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {isArchive
            ? `${donor?.name || 'This donor'} will be archived and removed from the active donor list. The donor record will remain safely stored.`
            : `${donor?.name || 'This donor'} will be restored and become active again.`}
        </p>

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
            className={`h-11 rounded-xl px-5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isArchive
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {saving
              ? 'Processing...'
              : isArchive
                ? 'Archive Donor'
                : 'Restore Donor'}
          </button>

        </div>
      </div>
    </div>
  );
}

/* =========================================
   TABLE
========================================= */

function DonorTable({
  donors,
  onEdit,
  onStatusChange,
}) {
  return (
    <>
      {/* DESKTOP */}
      <div className="hidden overflow-x-auto md:block">

        <table className="w-full min-w-[1050px]">

          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70">

              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Donor
              </th>

              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Phone
              </th>

              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Email
              </th>

              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Location
              </th>

              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Status
              </th>

              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                Actions
              </th>

            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">

            {donors.map((donor) => (
              <tr
                key={donor.id}
                className="transition hover:bg-slate-50/70"
              >

                {/* DONOR */}
                <td className="px-6 py-4">

                  <div className="flex items-center gap-3">

                    <Avatar
                      name={donor.name}
                    />

                    <div className="min-w-0">

                      <p className="truncate text-sm font-semibold text-slate-900">
                        {donor.name}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">
                        Added{' '}
                        {formatDate(
                          donor.createdAt
                        )}
                      </p>

                    </div>
                  </div>
                </td>

                {/* PHONE */}
                <td className="px-6 py-4 text-sm text-slate-600">
                  {donor.phone || '—'}
                </td>

                {/* EMAIL */}
                <td className="max-w-[240px] px-6 py-4 text-sm text-slate-600">
                  <span className="block truncate">
                    {donor.email || '—'}
                  </span>
                </td>

                {/* CITY */}
                <td className="px-6 py-4 text-sm text-slate-600">
                  {donor.city || '—'}
                </td>

                {/* STATUS */}
                <td className="px-6 py-4">
                  <StatusBadge
                    status={
                      donor.status
                    }
                  />
                </td>

                {/* ACTIONS */}
                <td className="px-6 py-4">

                  <div className="flex justify-end gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        onEdit(donor)
                      }
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onStatusChange(
                          donor
                        )
                      }
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                        donor.status ===
                        'active'
                          ? 'border-amber-200 bg-white text-amber-700 hover:bg-amber-50'
                          : 'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      {donor.status ===
                      'active'
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

      {/* MOBILE */}
      <div className="divide-y divide-slate-100 md:hidden">

        {donors.map((donor) => (
          <div
            key={donor.id}
            className="p-5"
          >

            <div className="flex items-start gap-3">

              <Avatar
                name={donor.name}
              />

              <div className="min-w-0 flex-1">

                <div className="flex items-start justify-between gap-3">

                  <div className="min-w-0">

                    <h4 className="truncate text-sm font-bold text-slate-900">
                      {donor.name}
                    </h4>

                    <p className="mt-1 text-xs text-slate-400">
                      Added{' '}
                      {formatDate(
                        donor.createdAt
                      )}
                    </p>

                  </div>

                  <StatusBadge
                    status={
                      donor.status
                    }
                  />

                </div>

                <div className="mt-4 space-y-2">

                  {donor.phone && (
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">
                        Phone:
                      </span>{' '}
                      {donor.phone}
                    </p>
                  )}

                  {donor.email && (
                    <p className="break-all text-sm text-slate-600">
                      <span className="font-medium">
                        Email:
                      </span>{' '}
                      {donor.email}
                    </p>
                  )}

                  {donor.city && (
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">
                        City:
                      </span>{' '}
                      {donor.city}
                    </p>
                  )}

                </div>

                <div className="mt-4 flex gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      onEdit(donor)
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onStatusChange(
                        donor
                      )
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {donor.status ===
                    'active'
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
  );
}

/* =========================================
   EMPTY STATE
========================================= */

function EmptyDonors({
  archived,
  search,
  onAdd,
}) {
  return (
    <div className="px-5 py-16 text-center sm:px-6">

      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400">
        ♙
      </div>

      <h3 className="mt-5 text-base font-bold text-slate-900">
        {search
          ? 'No donors found'
          : archived
            ? 'No archived donors'
            : 'No donors yet'}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {search
          ? 'Try a different donor name, phone number, email or city.'
          : archived
            ? 'Archived donors will appear here when a donor is archived.'
            : 'Start building your donor database by adding your first donor.'}
      </p>

      {!archived && !search && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          + Add First Donor
        </button>
      )}

    </div>
  );
}

/* =========================================
   STATUS BADGE
========================================= */

function StatusBadge({
  status,
}) {
  const active =
    status === 'active';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-slate-100 text-slate-600'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active
            ? 'bg-emerald-500'
            : 'bg-slate-400'
        }`}
      />

      {active
        ? 'Active'
        : 'Archived'}
    </span>
  );
}

/* =========================================
   AVATAR
========================================= */

function Avatar({ name }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-sm font-bold text-indigo-700">
      {getInitials(name)}
    </div>
  );
}

/* =========================================
   FORM FIELD
========================================= */

function FormField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
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

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
      />
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
  const isSuccess =
    type === 'success';

  return (
    <div
      className={`mb-6 rounded-2xl border p-4 ${
        isSuccess
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-red-200 bg-red-50'
      }`}
    >
      <div className="flex items-start gap-3">

        <div
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            isSuccess
              ? 'bg-emerald-100 text-emerald-600'
              : 'bg-red-100 text-red-600'
          }`}
        >
          {isSuccess ? '✓' : '!'}
        </div>

        <p
          className={`text-sm font-medium leading-6 ${
            isSuccess
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
   LOADING SKELETON
========================================= */

function DonorTableSkeleton() {
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

          <div className="hidden h-4 w-32 rounded bg-slate-200 md:block" />

          <div className="hidden h-4 w-36 rounded bg-slate-200 lg:block" />

          <div className="hidden h-8 w-20 rounded-lg bg-slate-200 md:block" />

        </div>
      ))}
    </div>
  );
}

/* =========================================
   HELPERS
========================================= */

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
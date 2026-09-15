'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UserCog,
  UserX,
  X,
} from 'lucide-react';

import { useDashboard } from '@/app/dashboard/DashboardShell';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  role: 'cashier',
  password: '',
};

function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(
      (part) =>
        part[0]?.toUpperCase() || ''
    )
    .join('');
}

function formatDate(date) {
  if (!date) {
    return '-';
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  ).format(parsedDate);
}

function formatRole(role) {
  return role === 'admin'
    ? 'Admin'
    : 'Cashier';
}

export default function UsersPage() {
  const { user: currentUser } =
    useDashboard();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] =
    useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [pageError, setPageError] =
    useState('');
  const [successMessage, setSuccessMessage] =
    useState('');

  const [search, setSearch] =
    useState('');
  const [roleFilter, setRoleFilter] =
    useState('all');
  const [statusFilter, setStatusFilter] =
    useState('all');

  const [showModal, setShowModal] =
    useState(false);

  const [editingUser, setEditingUser] =
    useState(null);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [saving, setSaving] =
    useState(false);
  const [formError, setFormError] =
    useState('');

  const [fieldErrors, setFieldErrors] =
    useState({});

  const [showPassword, setShowPassword] =
    useState(false);

  const [statusModal, setStatusModal] =
    useState(null);

  const [statusUpdating, setStatusUpdating] =
    useState(false);

  const fetchUsers = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setPageError('');

        const response =
          await fetch('/api/users', {
            method: 'GET',
            cache: 'no-store',
          });

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              'Failed to load users'
          );
        }

        setUsers(
          Array.isArray(result.data)
            ? result.data
            : []
        );
      } catch (error) {
        console.error(
          'Users fetch error:',
          error
        );

        setPageError(
          error.message ||
            'Failed to load users'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timer =
      setTimeout(() => {
        setSuccessMessage('');
      }, 4000);

    return () => clearTimeout(timer);
  }, [successMessage]);

  const filteredUsers = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return users.filter((item) => {
      const matchesSearch =
        !query ||
        item.name
          ?.toLowerCase()
          .includes(query) ||
        item.email
          ?.toLowerCase()
          .includes(query) ||
        item.phone
          ?.toLowerCase()
          .includes(query);

      const matchesRole =
        roleFilter === 'all' ||
        item.role === roleFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        item.status === statusFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [
    users,
    search,
    roleFilter,
    statusFilter,
  ]);

  const summary = useMemo(
    () => ({
      total: users.length,

      admins: users.filter(
        (item) =>
          item.role === 'admin'
      ).length,

      cashiers: users.filter(
        (item) =>
          item.role === 'cashier'
      ).length,

      active: users.filter(
        (item) =>
          item.status === 'active'
      ).length,

      inactive: users.filter(
        (item) =>
          item.status === 'inactive'
      ).length,
    }),
    [users]
  );

  function openCreateModal() {
    setEditingUser(null);

    setForm({
      ...EMPTY_FORM,
    });

    setFormError('');
    setFieldErrors({});
    setShowPassword(false);
    setShowModal(true);
  }

  function openEditModal(item) {
    setEditingUser(item);

    setForm({
      name: item.name || '',
      email: item.email || '',
      phone: item.phone || '',
      role: item.role || 'cashier',
      password: '',
    });

    setFormError('');
    setFieldErrors({});
    setShowPassword(false);
    setShowModal(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingUser(null);

    setForm({
      ...EMPTY_FORM,
    });

    setFormError('');
    setFieldErrors({});
    setShowPassword(false);
  }

  function handleChange(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setFieldErrors((current) => ({
      ...current,
      [field]: '',
    }));

    setFormError('');
  }

  function validateForm() {
    const errors = {};

    if (!form.name.trim()) {
      errors.name = 'Full name is required.';
    }

    if (!form.email.trim()) {
      errors.email =
        'Email address is required.';
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {
      errors.email =
        'Enter a valid email address.';
    }

    if (!editingUser && !form.password) {
      errors.password =
        'Password is required.';
    }

    if (
      form.password &&
      form.password.length < 8
    ) {
      errors.password =
        'Password must be at least 8 characters.';
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setFormError('');

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
      };

      if (form.password) {
        payload.password =
          form.password;
      }

      const response = await fetch(
        '/api/users',
        {
          method: editingUser
            ? 'PATCH'
            : 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify(
            editingUser
              ? {
                  id: editingUser.id,
                  ...payload,
                }
              : {
                  ...payload,
                  password:
                    form.password,
                }
          ),
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
            'Unable to save user.'
        );
      }

      setShowModal(false);
      setEditingUser(null);

      setForm({
        ...EMPTY_FORM,
      });

      setFormError('');
      setFieldErrors({});

      setSuccessMessage(
        editingUser
          ? 'User details have been updated successfully.'
          : 'New user has been created successfully.'
      );

      await fetchUsers(true);
    } catch (error) {
      console.error(
        'User save error:',
        error
      );

      setFormError(
        error.message ||
          'Something went wrong. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  function openStatusModal(item) {
    if (
      currentUser?.id === item.id
    ) {
      setPageError(
        'You cannot deactivate your own account.'
      );

      return;
    }

    setStatusModal(item);
  }

  function closeStatusModal() {
    if (statusUpdating) {
      return;
    }

    setStatusModal(null);
  }

  async function handleStatusChange() {
    if (!statusModal) {
      return;
    }

    setStatusUpdating(true);
    setPageError('');

    try {
      const nextStatus =
        statusModal.status ===
        'active'
          ? 'inactive'
          : 'active';

      const response =
        await fetch('/api/users', {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            id: statusModal.id,
            status: nextStatus,
          }),
        });

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            'Failed to update user status.'
        );
      }

      setStatusModal(null);

      setSuccessMessage(
        nextStatus === 'active'
          ? 'User has been activated successfully.'
          : 'User has been deactivated successfully.'
      );

      await fetchUsers(true);
    } catch (error) {
      console.error(
        'User status error:',
        error
      );

      setPageError(
        error.message ||
          'Failed to update user status.'
      );
    } finally {
      setStatusUpdating(false);
    }
  }

  const hasFilters =
    Boolean(
      search ||
        roleFilter !== 'all' ||
        statusFilter !== 'all'
    );

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <UserCog size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Users
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage administrators and
              cashiers for your temple.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              fetchUsers(true)
            }
            disabled={refreshing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? 'animate-spin'
                  : ''
              }
            />

            <span className="hidden sm:inline">
              Refresh
            </span>
          </button>

          <button
            type="button"
            onClick={
              openCreateModal
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Plus size={18} />
            Add User
          </button>
        </div>
      </div>

      {/* SUCCESS MESSAGE */}
      {successMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2
            size={18}
            className="mt-0.5 shrink-0"
          />

          <span className="flex-1">
            {successMessage}
          </span>

          <button
            type="button"
            onClick={() =>
              setSuccessMessage('')
            }
            className="rounded-lg p-1 hover:bg-emerald-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* PAGE ERROR */}
      {pageError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />

          <span className="flex-1">
            {pageError}
          </span>

          <button
            type="button"
            onClick={() =>
              setPageError('')
            }
            className="rounded-lg p-1 hover:bg-red-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* SUMMARY */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <SummaryCard
          label="Total Users"
          value={summary.total}
          icon={
            <UserCog size={19} />
          }
        />

        <SummaryCard
          label="Admins"
          value={summary.admins}
          icon={
            <ShieldCheck
              size={19}
            />
          }
        />

        <SummaryCard
          label="Cashiers"
          value={summary.cashiers}
          icon={
            <UserCheck size={19} />
          }
        />

        <SummaryCard
          label="Active"
          value={summary.active}
          icon={
            <CheckCircle2
              size={19}
            />
          }
        />

        <SummaryCard
          label="Inactive"
          value={summary.inactive}
          icon={
            <UserX size={19} />
          }
        />
      </div>

      {/* FILTERS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search by name, email or phone..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(
                event.target.value
              )
            }
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
          >
            <option value="all">
              All Roles
            </option>

            <option value="admin">
              Admin
            </option>

            <option value="cashier">
              Cashier
            </option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
          >
            <option value="all">
              All Status
            </option>

            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>
          </select>
        </div>
      </section>

      {/* USERS TABLE */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Team Members
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            {filteredUsers.length} of{' '}
            {users.length} users shown
          </p>
        </div>

        {loading ? (
          <LoadingState />
        ) : filteredUsers.length ===
          0 ? (
          <EmptyState
            hasFilters={hasFilters}
            onAdd={
              openCreateModal
            }
          />
        ) : (
          <>
            {/* DESKTOP */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      User
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Contact
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Role
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Created
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(
                    (item) => (
                      <UserRow
                        key={`desktop-user-${item.id}`}
                        item={item}
                        currentUserId={
                          currentUser?.id
                        }
                        onEdit={
                          openEditModal
                        }
                        onStatus={
                          openStatusModal
                        }
                      />
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE */}
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredUsers.map(
                (item) => (
                  <MobileUserCard
                    key={`mobile-user-${item.id}`}
                    item={item}
                    currentUserId={
                      currentUser?.id
                    }
                    onEdit={
                      openEditModal
                    }
                    onStatus={
                      openStatusModal
                    }
                  />
                )
              )}
            </div>
          </>
        )}
      </section>

      {/* USER FORM MODAL */}
      {showModal && (
        <UserModal
          editingUser={
            editingUser
          }
          form={form}
          saving={saving}
          error={formError}
          fieldErrors={
            fieldErrors
          }
          showPassword={
            showPassword
          }
          onChange={
            handleChange
          }
          onTogglePassword={() =>
            setShowPassword(
              (current) =>
                !current
            )
          }
          onClose={
            closeModal
          }
          onSubmit={
            handleSubmit
          }
        />
      )}

      {/* STATUS MODAL */}
      {statusModal && (
        <StatusModal
          user={statusModal}
          loading={
            statusUpdating
          }
          onClose={
            closeStatusModal
          }
          onConfirm={
            handleStatusChange
          }
        />
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        {icon}
      </div>

      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function UserRow({
  item,
  currentUserId,
  onEdit,
  onStatus,
}) {
  const isCurrentUser =
    currentUserId === item.id;

  return (
    <tr className="transition hover:bg-slate-50/70">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600">
            {getInitials(
              item.name
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold text-slate-900">
                {item.name}
              </p>

              {isCurrentUser && (
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-600">
                  You
                </span>
              )}
            </div>

            <p className="truncate text-xs text-slate-500">
              {item.email}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4 text-sm text-slate-600">
        {item.phone || '-'}
      </td>

      <td className="px-5 py-4">
        <RoleBadge
          role={item.role}
        />
      </td>

      <td className="px-5 py-4">
        <StatusBadge
          status={item.status}
        />
      </td>

      <td className="px-5 py-4 text-sm text-slate-500">
        {formatDate(
          item.createdAt
        )}
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() =>
              onEdit(item)
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
            title="Edit user"
          >
            <Edit3 size={16} />
          </button>

          <button
            type="button"
            onClick={() =>
              onStatus(item)
            }
            disabled={
              isCurrentUser
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
            title={
              isCurrentUser
                ? 'You cannot change your own status'
                : item.status ===
                  'active'
                ? 'Deactivate user'
                : 'Activate user'
            }
          >
            {item.status ===
            'active' ? (
              <UserX size={16} />
            ) : (
              <UserCheck
                size={16}
              />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}

function MobileUserCard({
  item,
  currentUserId,
  onEdit,
  onStatus,
}) {
  const isCurrentUser =
    currentUserId === item.id;

  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600">
          {getInitials(
            item.name
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-900">
              {item.name}
            </p>

            {isCurrentUser && (
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                You
              </span>
            )}
          </div>

          <p className="mt-0.5 break-all text-sm text-slate-500">
            {item.email}
          </p>

          {item.phone && (
            <p className="mt-1 text-xs text-slate-400">
              {item.phone}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <RoleBadge
          role={item.role}
        />

        <StatusBadge
          status={item.status}
        />

        <span className="text-xs text-slate-400">
          Created{' '}
          {formatDate(
            item.createdAt
          )}
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() =>
            onEdit(item)
          }
          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Edit3 size={16} />
          Edit
        </button>

        <button
          type="button"
          onClick={() =>
            onStatus(item)
          }
          disabled={
            isCurrentUser
          }
          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {item.status ===
          'active' ? (
            <>
              <UserX size={16} />
              Deactivate
            </>
          ) : (
            <>
              <UserCheck
                size={16}
              />
              Activate
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function RoleBadge({ role }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        role === 'admin'
          ? 'bg-indigo-50 text-indigo-700'
          : 'bg-slate-100 text-slate-700'
      }`}
    >
      {role === 'admin' ? (
        <ShieldCheck size={13} />
      ) : (
        <UserCheck size={13} />
      )}

      {formatRole(role)}
    </span>
  );
}

function StatusBadge({ status }) {
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
        : 'Inactive'}
    </span>
  );
}

function LoadingState() {
  const skeletons = [
    'user-loading-1',
    'user-loading-2',
    'user-loading-3',
    'user-loading-4',
  ];

  return (
    <div className="space-y-4 p-5">
      {skeletons.map(
        (skeletonId) => (
          <div
            key={skeletonId}
            className="flex animate-pulse items-center gap-4"
          >
            <div className="h-10 w-10 rounded-full bg-slate-100" />

            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 rounded bg-slate-100" />

              <div className="h-3 w-56 rounded bg-slate-100" />
            </div>
          </div>
        )
      )}
    </div>
  );
}

function EmptyState({
  hasFilters,
  onAdd,
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-5 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <UserCog size={25} />
      </div>

      <h3 className="mt-4 text-base font-semibold text-slate-900">
        {hasFilters
          ? 'No users found'
          : 'No users yet'}
      </h3>

      <p className="mt-1 max-w-sm text-sm text-slate-500">
        {hasFilters
          ? 'Try changing your search or filters.'
          : 'Add your first administrator or cashier to get started.'}
      </p>

      {!hasFilters && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <Plus size={17} />
          Add User
        </button>
      )}
    </div>
  );
}

function UserModal({
  editingUser,
  form,
  saving,
  error,
  fieldErrors,
  showPassword,
  onChange,
  onTogglePassword,
  onClose,
  onSubmit,
}) {
  const isEditing =
    Boolean(editingUser);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[3px]"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* MODAL HEADER */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              {isEditing ? (
                <Edit3 size={19} />
              ) : (
                <UserPlusIcon />
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing
                  ? 'Edit User'
                  : 'Add New User'}
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                {isEditing
                  ? 'Update account information and access.'
                  : 'Create an account for your temple team.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </div>

        {/* MODAL CONTENT */}
        <div className="overflow-y-auto">
          <form
            onSubmit={onSubmit}
            className="space-y-5 p-6"
          >
            {/* API ERROR */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3.5">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                    <AlertCircle
                      size={17}
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-red-800">
                      Unable to save user
                    </p>

                    <p className="mt-0.5 text-sm leading-5 text-red-700">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* NAME / PHONE */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Full Name"
                required
                error={
                  fieldErrors.name
                }
              >
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    onChange(
                      'name',
                      event.target
                        .value
                    )
                  }
                  placeholder="Enter full name"
                  disabled={saving}
                  className={getInputClass(
                    fieldErrors.name
                  )}
                />
              </FormField>

              <FormField
                label="Phone"
                error={
                  fieldErrors.phone
                }
              >
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    onChange(
                      'phone',
                      event.target
                        .value
                    )
                  }
                  placeholder="9876543210"
                  disabled={saving}
                  className={getInputClass(
                    fieldErrors.phone
                  )}
                />
              </FormField>
            </div>

            {/* EMAIL */}
            <FormField
              label="Email Address"
              required
              error={
                fieldErrors.email
              }
            >
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  onChange(
                    'email',
                    event.target
                      .value
                  )
                }
                placeholder="user@example.com"
                disabled={saving}
                className={getInputClass(
                  fieldErrors.email
                )}
              />
            </FormField>

            {/* ROLE */}
            <FormField
              label="Role"
              required
              error={
                fieldErrors.role
              }
            >
              <select
                value={form.role}
                onChange={(event) =>
                  onChange(
                    'role',
                    event.target
                      .value
                  )
                }
                disabled={saving}
                className={getInputClass(
                  fieldErrors.role
                )}
              >
                <option value="cashier">
                  Cashier
                </option>

                <option value="admin">
                  Admin
                </option>
              </select>
            </FormField>

            {/* PASSWORD */}
            <FormField
              label={
                isEditing
                  ? 'New Password'
                  : 'Password'
              }
              required={!isEditing}
              error={
                fieldErrors.password
              }
              hint={
                isEditing
                  ? 'Leave blank to keep the current password.'
                  : 'Use at least 8 characters.'
              }
            >
              <div className="relative">
                <KeyRound
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={
                    form.password
                  }
                  onChange={(event) =>
                    onChange(
                      'password',
                      event.target
                        .value
                    )
                  }
                  placeholder={
                    isEditing
                      ? 'Enter new password'
                      : 'Minimum 8 characters'
                  }
                  disabled={saving}
                  className={`${getInputClass(
                    fieldErrors.password
                  )} pl-10 pr-16`}
                />

                <button
                  type="button"
                  onClick={
                    onTogglePassword
                  }
                  disabled={saving}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                >
                  {showPassword
                    ? 'Hide'
                    : 'Show'}
                </button>
              </div>
            </FormField>

            {/* SECURITY INFO */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
              <div className="flex gap-3">
                <ShieldCheck
                  size={19}
                  className="mt-0.5 shrink-0 text-indigo-600"
                />

                <div>
                  <p className="text-sm font-semibold text-indigo-900">
                    Secure organization access
                  </p>

                  <p className="mt-1 text-xs leading-5 text-indigo-700">
                    This user will only have
                    access to the current
                    temple organization.
                    Passwords are securely
                    hashed before storage.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* MODAL FOOTER */}
        <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              const formElement =
                document.getElementById(
                  'user-form'
                );

              formElement?.requestSubmit();
            }}
            disabled={saving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && (
              <RefreshCw
                size={16}
                className="animate-spin"
              />
            )}

            {saving
              ? 'Saving...'
              : isEditing
              ? 'Save Changes'
              : 'Create User'}
          </button>
        </div>
      </div>

      <form
        id="user-form"
        onSubmit={onSubmit}
        className="hidden"
      />
    </div>
  );
}

function UserPlusIcon() {
  return (
    <div className="relative">
      <UserCheck size={19} />

      <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
        +
      </span>
    </div>
  );
}

function FormField({
  label,
  required,
  error,
  hint,
  children,
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">
          {label}

          {required && (
            <span className="ml-1 text-red-500">
              *
            </span>
          )}
        </span>
      </div>

      {children}

      {error ? (
        <div className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle
            size={14}
            className="mt-px shrink-0"
          />

          <span>{error}</span>
        </div>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-400">
          {hint}
        </p>
      ) : null}
    </label>
  );
}

function getInputClass(error) {
  return `h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 ${
    error
      ? 'border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-4 focus:ring-red-50'
      : 'border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50'
  }`;
}

function StatusModal({
  user,
  loading,
  onClose,
  onConfirm,
}) {
  const activating =
    user.status === 'inactive';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[3px]"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                activating
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-amber-50 text-amber-600'
              }`}
            >
              {activating ? (
                <UserCheck
                  size={19}
                />
              ) : (
                <UserX size={19} />
              )}
            </div>

            <div>
              <h3 className="font-bold text-slate-900">
                {activating
                  ? 'Activate User'
                  : 'Deactivate User'}
              </h3>

              <p className="text-xs text-slate-500">
                Confirm account status change
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600">
              {getInitials(
                user.name
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {user.name}
              </p>

              <p className="truncate text-xs text-slate-500">
                {user.email}
              </p>
            </div>

            <div className="ml-auto">
              <StatusBadge
                status={user.status}
              />
            </div>
          </div>

          <div
            className={`mt-4 rounded-xl border p-4 ${
              activating
                ? 'border-emerald-100 bg-emerald-50'
                : 'border-amber-100 bg-amber-50'
            }`}
          >
            <p
              className={`text-sm leading-6 ${
                activating
                  ? 'text-emerald-800'
                  : 'text-amber-800'
              }`}
            >
              {activating
                ? `Activating ${user.name} will allow this user to log in and access the temple management system again.`
                : `Deactivating ${user.name} will prevent this user from logging in until the account is activated again.`}
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              activating
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {loading && (
              <RefreshCw
                size={16}
                className="animate-spin"
              />
            )}

            {loading
              ? 'Updating...'
              : activating
              ? 'Activate User'
              : 'Deactivate User'}
          </button>
        </div>
      </div>
    </div>
  );
}
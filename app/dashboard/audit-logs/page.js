'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';

import { useDashboard } from '@/app/dashboard/DashboardShell';

const ACTIONS = [
  'CREATE',
  'UPDATE',
  'VOID',
  'ARCHIVE',
  'RESTORE',
  'LOGIN',
  'LOGOUT',
  'SETTINGS_UPDATE',
  'OPENING_BALANCE_CREATE',
  'OPENING_BALANCE_UPDATE',
];

const MODULES = [
  'auth',
  'organization',
  'user',
  'donor',
  'donation',
  'expense',
  'opening_balance',
  'settings',
];

function formatDate(value) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );
}

function formatModule(value) {
  if (!value) {
    return '-';
  }

  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatAction(value) {
  if (!value) {
    return '-';
  }

  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function getActionClass(action) {
  switch (action) {
    case 'CREATE':
      return 'bg-emerald-50 text-emerald-700';

    case 'UPDATE':
    case 'SETTINGS_UPDATE':
      return 'bg-blue-50 text-blue-700';

    case 'VOID':
      return 'bg-red-50 text-red-700';

    case 'ARCHIVE':
      return 'bg-amber-50 text-amber-700';

    case 'RESTORE':
      return 'bg-purple-50 text-purple-700';

    case 'LOGIN':
      return 'bg-indigo-50 text-indigo-700';

    case 'LOGOUT':
      return 'bg-slate-100 text-slate-700';

    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function prettyJson(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return 'No data';
  }

  try {
    return JSON.stringify(
      value,
      null,
      2
    );
  } catch {
    return String(value);
  }
}

function JsonBlock({
  title,
  value,
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </div>

      <pre className="max-h-80 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700">
        {prettyJson(value)}
      </pre>
    </div>
  );
}

export default function AuditLogsPage() {
  const {
    organization,
  } = useDashboard();

  const [
    logs,
    setLogs,
  ] = useState([]);

  const [
    users,
    setUsers,
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
    error,
    setError,
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
    action,
    setAction,
  ] = useState('');

  const [
    module,
    setModule,
  ] = useState('');

  const [
    userId,
    setUserId,
  ] = useState('');

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    pagination,
    setPagination,
  ] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });

  const [
    selectedLog,
    setSelectedLog,
  ] = useState(null);

  const fetchLogs = useCallback(
    async (
      showLoader = true
    ) => {
      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError('');

        const params =
          new URLSearchParams();

        params.set(
          'page',
          String(page)
        );

        params.set(
          'limit',
          '25'
        );

        if (search) {
          params.set(
            'search',
            search
          );
        }

        if (action) {
          params.set(
            'action',
            action
          );
        }

        if (module) {
          params.set(
            'module',
            module
          );
        }

        if (userId) {
          params.set(
            'userId',
            userId
          );
        }

        const response =
          await fetch(
            `/api/audit-logs?${params.toString()}`,
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
              'Failed to load audit logs'
          );
        }

        setLogs(
          result.data.logs || []
        );

        setUsers(
          result.data.users || []
        );

        setPagination(
          result.data.pagination || {
            page,
            limit: 25,
            total: 0,
            totalPages: 0,
          }
        );
      } catch (fetchError) {
        console.error(
          'Audit logs fetch error:',
          fetchError
        );

        setError(
          fetchError.message ||
            'Failed to load audit logs'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      page,
      search,
      action,
      module,
      userId,
    ]
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  function handleSearch(event) {
    event.preventDefault();

    setPage(1);
    setSearch(
      searchInput.trim()
    );
  }

  function clearFilters() {
    setSearchInput('');
    setSearch('');
    setAction('');
    setModule('');
    setUserId('');
    setPage(1);
  }

  const hasFilters =
    Boolean(
      search ||
        action ||
        module ||
        userId
    );

  const activeFilterCount =
    [
      search,
      action,
      module,
      userId,
    ].filter(Boolean).length;

  const pageStart =
    pagination.total === 0
      ? 0
      : (pagination.page - 1) *
          pagination.limit +
        1;

  const pageEnd =
    Math.min(
      pagination.page *
        pagination.limit,
      pagination.total
    );

  const summaryText =
    useMemo(() => {
      if (
        pagination.total === 0
      ) {
        return 'No audit records found';
      }

      return `Showing ${pageStart}-${pageEnd} of ${pagination.total} records`;
    }, [
      pagination.total,
      pageStart,
      pageEnd,
    ]);

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <ShieldCheck
                size={22}
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Audit Logs
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Track important activity and
                changes made in your temple.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            fetchLogs(false)
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
      </div>

      {/* Organization */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Organization
            </p>

            <p className="mt-1 text-base font-semibold text-slate-900">
              {organization?.name ||
                'Temple'}
            </p>
          </div>

          <div className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700">
            Admin Only
          </div>
        </div>
      </div>

      {/* Filters */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <Filter
              size={17}
              className="text-slate-500"
            />

            <h2 className="font-semibold text-slate-900">
              Filters
            </h2>

            {activeFilterCount >
              0 && (
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                {activeFilterCount}
              </span>
            )}
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={
                clearFilters
              }
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <form
            onSubmit={
              handleSearch
            }
            className="relative lg:col-span-2"
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
              onChange={(event) =>
                setSearchInput(
                  event.target.value
                )
              }
              placeholder="Search description, reason or record ID..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            />
          </form>

          <select
            value={action}
            onChange={(event) => {
              setAction(
                event.target.value
              );
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
          >
            <option value="">
              All Actions
            </option>

            {ACTIONS.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {formatAction(
                    item
                  )}
                </option>
              )
            )}
          </select>

          <select
            value={module}
            onChange={(event) => {
              setModule(
                event.target.value
              );
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
          >
            <option value="">
              All Modules
            </option>

            {MODULES.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {formatModule(
                    item
                  )}
                </option>
              )
            )}
          </select>

          <select
            value={userId}
            onChange={(event) => {
              setUserId(
                event.target.value
              );
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 md:col-span-2 lg:col-span-1"
          >
            <option value="">
              All Users
            </option>

            {users.map(
              (user) => (
                <option
                  key={user.id}
                  value={user.id}
                >
                  {user.name}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {/* Error */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-center justify-between gap-4">
            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                fetchLogs()
              }
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Logs */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Activity History
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {summaryText}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({
              length: 7,
            }).map(
              (_, index) => (
                <div
                  key={index}
                  className="animate-pulse p-5"
                >
                  <div className="h-4 w-32 rounded bg-slate-100" />

                  <div className="mt-3 h-3 w-64 rounded bg-slate-100" />

                  <div className="mt-2 h-3 w-40 rounded bg-slate-100" />
                </div>
              )
            )}
          </div>
        ) : logs.length ===
          0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <ShieldCheck
                size={25}
              />
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-900">
              No audit logs found
            </h3>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              Important activity will appear
              here once audit logging is
              connected to your actions.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop */}

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Date
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      User
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Action
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Module
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Description
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      View
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {logs.map(
                    (log) => (
                      <tr
                        key={log.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                          {formatDate(
                            log.createdAt
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="text-sm font-semibold text-slate-900">
                            {log.user
                              ?.name ||
                              'System'}
                          </div>

                          <div className="mt-0.5 text-xs text-slate-500">
                            {log.user
                              ?.role ||
                              ''}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getActionClass(
                              log.action
                            )}`}
                          >
                            {formatAction(
                              log.action
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-slate-700">
                          {formatModule(
                            log.module
                          )}
                        </td>

                        <td className="max-w-md px-5 py-4">
                          <div className="truncate text-sm text-slate-700">
                            {log.description ||
                              '-'}
                          </div>

                          {log.reason && (
                            <div className="mt-1 truncate text-xs text-slate-400">
                              Reason:{' '}
                              {log.reason}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedLog(
                                log
                              )
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                            title="View audit details"
                          >
                            <Eye
                              size={16}
                            />
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile */}

            <div className="divide-y divide-slate-100 lg:hidden">
              {logs.map(
                (log) => (
                  <div
                    key={log.id}
                    className="p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getActionClass(
                              log.action
                            )}`}
                          >
                            {formatAction(
                              log.action
                            )}
                          </span>

                          <span className="text-xs font-medium text-slate-500">
                            {formatModule(
                              log.module
                            )}
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {log.description ||
                            '-'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedLog(
                            log
                          )
                        }
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500"
                      >
                        <Eye
                          size={16}
                        />
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-slate-400">
                          User
                        </p>

                        <p className="mt-1 font-medium text-slate-700">
                          {log.user
                            ?.name ||
                            'System'}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-400">
                          Date
                        </p>

                        <p className="mt-1 font-medium text-slate-700">
                          {formatDate(
                            log.createdAt
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        )}

        {/* Pagination */}

        {!loading &&
          pagination.total >
            0 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                {summaryText}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={
                    pagination.page <=
                    1
                  }
                  onClick={() =>
                    setPage(
                      (current) =>
                        Math.max(
                          1,
                          current - 1
                        )
                    )
                  }
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft
                    size={17}
                  />
                </button>

                <span className="min-w-20 text-center text-sm font-medium text-slate-700">
                  {pagination.page}{' '}
                  /{' '}
                  {pagination.totalPages ||
                    1}
                </span>

                <button
                  type="button"
                  disabled={
                    pagination.page >=
                    pagination.totalPages
                  }
                  onClick={() =>
                    setPage(
                      (current) =>
                        Math.min(
                          pagination.totalPages,
                          current + 1
                        )
                    )
                  }
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight
                    size={17}
                  />
                </button>
              </div>
            </div>
          )}
      </div>

      {/* Details Modal */}

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Audit Details
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {selectedLog.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedLog(
                    null
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X
                  size={18}
                />
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-400">
                    Action
                  </p>

                  <span
                    className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getActionClass(
                      selectedLog.action
                    )}`}
                  >
                    {formatAction(
                      selectedLog.action
                    )}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-400">
                    Module
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {formatModule(
                      selectedLog.module
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-400">
                    User
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {selectedLog.user
                      ?.name ||
                      'System'}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {selectedLog.user
                      ?.email ||
                      ''}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-400">
                    Date
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {formatDate(
                      selectedLog.createdAt
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Description
                  </p>

                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                    {selectedLog.description ||
                      'No description'}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Reason
                  </p>

                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                    {selectedLog.reason ||
                      'No reason provided'}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <JsonBlock
                  title="Old Values"
                  value={
                    selectedLog.oldValues
                  }
                />

                <JsonBlock
                  title="New Values"
                  value={
                    selectedLog.newValues
                  }
                />
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Record ID
                  </p>

                  <div className="mt-2 break-all rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-600">
                    {selectedLog.recordId ||
                      'N/A'}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    IP Address
                  </p>

                  <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-600">
                    {selectedLog.ipAddress ||
                      'Not available'}
                  </div>
                </div>
              </div>

              {selectedLog.userAgent && (
                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    User Agent
                  </p>

                  <div className="mt-2 break-all rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                    {
                      selectedLog.userAgent
                    }
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                onClick={() =>
                  setSelectedLog(
                    null
                  )
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
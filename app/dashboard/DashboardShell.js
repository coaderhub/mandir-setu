'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';
import {
  usePathname,
  useRouter,
} from 'next/navigation';

const DashboardContext =
  createContext(null);

export function useDashboard() {
  const context =
    useContext(DashboardContext);

  if (!context) {
    throw new Error(
      'useDashboard must be used inside DashboardShell'
    );
  }

  return context;
}

export default function DashboardShell({
  children,
  user,
  organization,
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const isAdmin =
    user?.role === 'admin';

  const navigation = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: '⌂',
    },
    {
      label: 'Donations',
      href: '/dashboard/donations',
      icon: '₹',
    },
    {
      label: 'Expenses',
      href: '/dashboard/expenses',
      icon: '↗',
    },
    {
      label: 'Donors',
      href: '/dashboard/donors',
      icon: '♙',
    },
    {
      label: 'Reports',
      href: '/dashboard/reports',
      icon: '▤',
    },
  ];

  const adminNavigation = [
    {
      label: 'Users',
      href: '/dashboard/users',
      icon: '♙',
    },
    {
      label: 'Settings',
      href: '/dashboard/settings',
      icon: '⚙',
    },
    {
      label: 'Audit Logs',
      href: '/dashboard/audit-logs',
      icon: '◷',
    },
  ];

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    }

    window.addEventListener(
      'resize',
      handleResize
    );

    return () => {
      window.removeEventListener(
        'resize',
        handleResize
      );
    };
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    try {
      setLoggingOut(true);

      const response = await fetch(
        '/api/auth/logout',
        {
          method: 'POST',
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
            'Logout failed'
        );
      }

      router.replace('/login');
      router.refresh();
    } catch (error) {
      console.error(
        'Logout error:',
        error
      );

      setLoggingOut(false);
    }
  }

  return (
    <DashboardContext.Provider
      value={{
        user,
        organization,
      }}
    >
      <div className="min-h-screen bg-slate-50 text-slate-900">

        {/* Mobile overlay */}
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() =>
              setSidebarOpen(false)
            }
            className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed
            inset-y-0
            left-0
            z-50
            flex
            w-[280px]
            flex-col
            border-r
            border-slate-200
            bg-white
            transition-transform
            duration-200
            lg:translate-x-0
            ${
              sidebarOpen
                ? 'translate-x-0'
                : '-translate-x-full'
            }
          `}
        >
          {/* Organization */}
          <div className="flex h-20 items-center border-b border-slate-200 px-6">
            <div className="flex min-w-0 items-center gap-3">

              {organization?.logo ? (
                <img
                  src={organization.logo}
                  alt={
                    organization.name ||
                    'Temple'
                  }
                  className="h-11 w-11 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
                  {getInitials(
                    organization?.name
                  )}
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  {organization?.name ||
                    'Temple Management'}
                </p>

                <p className="mt-0.5 truncate text-xs text-slate-500">
                  Temple Management
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setSidebarOpen(false)
              }
              className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
              aria-label="Close sidebar"
            >
              ×
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-4 py-6">

            <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Main Menu
            </p>

            <nav className="space-y-1">
              {navigation.map(
                (item) => (
                  <SidebarLink
                    key={item.href}
                    item={item}
                    active={isActivePath(
                      pathname,
                      item.href
                    )}
                    onClick={() =>
                      setSidebarOpen(false)
                    }
                  />
                )
              )}
            </nav>

            {isAdmin && (
              <>
                <p className="mb-3 mt-8 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Administration
                </p>

                <nav className="space-y-1">
                  {adminNavigation.map(
                    (item) => (
                      <SidebarLink
                        key={item.href}
                        item={item}
                        active={isActivePath(
                          pathname,
                          item.href
                        )}
                        onClick={() =>
                          setSidebarOpen(false)
                        }
                      />
                    )
                  )}
                </nav>
              </>
            )}
          </div>

          {/* User */}
          <div className="border-t border-slate-200 p-4">

            <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <Avatar
                name={user?.name}
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {user?.name ||
                    'User'}
                </p>

                <p className="truncate text-xs capitalize text-slate-500">
                  {user?.role ||
                    'User'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>
                {loggingOut
                  ? '...'
                  : '↪'}
              </span>

              {loggingOut
                ? 'Signing out...'
                : 'Sign out'}
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="lg:pl-[280px]">

          {/* Header */}
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">

              <div className="flex items-center gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setSidebarOpen(true)
                  }
                  className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 lg:hidden"
                  aria-label="Open navigation"
                >
                  ☰
                </button>

                <div>
                  <p className="text-xs font-medium text-slate-500">
                    {organization?.city
                      ? `${organization.city}${
                          organization.state
                            ? `, ${organization.state}`
                            : ''
                        }`
                      : 'Temple Management'}
                  </p>

                  <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
                    {getPageTitle(
                      pathname
                    )}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-3">

                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold text-slate-900">
                    {user?.name}
                  </p>

                  <p className="text-xs capitalize text-slate-500">
                    {user?.role}
                  </p>
                </div>

                <Avatar
                  name={user?.name}
                />
              </div>
            </div>
          </header>

          {/* Page content */}
          <main>
            {children}
          </main>

        </div>
      </div>
    </DashboardContext.Provider>
  );
}

function SidebarLink({
  item,
  active,
  onClick,
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`
        flex
        items-center
        gap-3
        rounded-xl
        px-3
        py-2.5
        text-sm
        font-semibold
        transition
        ${
          active
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }
      `}
    >
      <span
        className={`
          flex
          h-8
          w-8
          items-center
          justify-center
          rounded-lg
          text-sm
          ${
            active
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-500'
          }
        `}
      >
        {item.icon}
      </span>

      <span>{item.label}</span>
    </Link>
  );
}

function Avatar({ name }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
      {getInitials(name)}
    </div>
  );
}

function getInitials(name) {
  if (!name) {
    return 'TM';
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

function isActivePath(
  pathname,
  href
) {
  if (href === '/dashboard') {
    return pathname === '/dashboard';
  }

  return (
    pathname === href ||
    pathname.startsWith(
      `${href}/`
    )
  );
}

function getPageTitle(pathname) {
  if (pathname === '/dashboard') {
    return 'Dashboard';
  }

  if (
    pathname.startsWith(
      '/dashboard/donations'
    )
  ) {
    return 'Donations';
  }

  if (
    pathname.startsWith(
      '/dashboard/expenses'
    )
  ) {
    return 'Expenses';
  }

  if (
    pathname.startsWith(
      '/dashboard/donors'
    )
  ) {
    return 'Donors';
  }

  if (
    pathname.startsWith(
      '/dashboard/reports'
    )
  ) {
    return 'Reports';
  }

  if (
    pathname.startsWith(
      '/dashboard/users'
    )
  ) {
    return 'Users';
  }

  if (
    pathname.startsWith(
      '/dashboard/settings'
    )
  ) {
    return 'Settings';
  }

  if (
    pathname.startsWith(
      '/dashboard/audit-logs'
    )
  ) {
    return 'Audit Logs';
  }

  return 'Dashboard';
}
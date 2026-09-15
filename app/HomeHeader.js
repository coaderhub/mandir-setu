'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image'

import {
  Building2,
  ChevronDown,
  LayoutDashboard,
  LogIn,
  LogOut,
  User,
  UserRound,
} from 'lucide-react';

export default function HomeHeader() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const response = await fetch('/api/auth/me', {
          cache: 'no-store',
        });

        const result = await response.json();

        if (!mounted) return;

        if (result.success && result.data?.user) {
          setUser(result.data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Homepage auth check error:', error);

        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      'mousedown',
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      );
    };
  }, []);

  async function handleLogout() {
    try {
      setOpen(false);

      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      window.location.href = '/';
    }
  }

  function getInitials(name = '') {
    const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (!parts.length) {
      return 'U';
    }

    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return (
      parts[0].charAt(0) +
      parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3"
        >
          <div className="flex h-25 w-30 shrink-0 items-center justify-center">
			
			<Image
				src="/logo.png"
				alt="Temple Management Logo"
				width={100}
				height={100}
				className="object-contain"
				priority
			/>
          </div>

		  {/* <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-950 sm:text-base">
              Temple Management
            </p>

            <p className="hidden text-xs text-slate-500 sm:block">
              Secure • Transparent • Organized
            </p>
</div> */ }
        </Link>

        {/* Right Side */}
        <div className="shrink-0">
          {loading ? (
            <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-100" />
          ) : user ? (
            <div
              ref={dropdownRef}
              className="relative"
            >
              {/* Profile Button */}
              <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-left transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:gap-3 sm:px-3"
              >
                {/* Avatar */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-700">
                  {getInitials(user.name)}
                </div>

                {/* User Info */}
                <div className="hidden min-w-0 sm:block">
                  <p className="max-w-32 truncate text-xs font-semibold text-slate-900">
                    {user.name}
                  </p>

                  <p className="text-[11px] capitalize text-slate-500">
                    {user.role}
                  </p>
                </div>

                <ChevronDown
                  size={15}
                  className={`shrink-0 text-slate-500 transition-transform ${
                    open ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown */}
              {open && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10"
                >
                  {/* Profile Header */}
                  <div className="border-b border-slate-100 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700">
                        {getInitials(user.name)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {user.name}
                        </p>

                        <p className="truncate text-xs text-slate-500">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-600">
                        <UserRound size={12} />

                        {user.role}
                      </span>
                    </div>
                  </div>

                  {/* Menu */}
                  <div className="p-2">
                    <Link
                      href="/dashboard"
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <LayoutDashboard size={16} />
                      </span>

                      <span>Dashboard</span>
                    </Link>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <LogOut size={16} />
                      </span>

                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            >
              <LogIn size={16} />

              <span className="hidden sm:inline">
                Admin Login
              </span>

              <span className="sm:hidden">
                Login
              </span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
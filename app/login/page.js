'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError('');
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');

    if (!form.email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!form.password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
        }),
      });

      const result = await response.json();
console.log('LOGIN RESPONSE:', result);
      if (!response.ok || !result.success) {
        setError(result.message || 'Unable to login.');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Login request error:', error);

      setError(
        'Something went wrong. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left branding section */}
        <section className="relative hidden overflow-hidden bg-slate-950 lg:flex">
          <div className="absolute inset-0">
            <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />
          </div>

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-lg shadow-indigo-600/20">
                  TM
                </div>

                <div>
                  <h1 className="text-lg font-bold text-white">
                    Temple Management
                  </h1>

                  <p className="text-xs text-slate-400">
                    Management System
                  </p>
                </div>
              </div>
            </div>

            <div className="max-w-xl">
              <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                Secure Administration
              </span>

              <h2 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
                Manage your temple operations
                <span className="text-indigo-400"> with confidence.</span>
              </h2>

              <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
                Manage donations, expenses, users, reports and temple
                activities from one secure platform.
              </p>

              <div className="mt-10 grid grid-cols-3 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="text-xl font-bold text-white">Secure</div>
                  <div className="mt-1 text-xs text-slate-400">
                    Authentication
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="text-xl font-bold text-white">Multi</div>
                  <div className="mt-1 text-xs text-slate-400">
                    Organization
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="text-xl font-bold text-white">Audit</div>
                  <div className="mt-1 text-xs text-slate-400">
                    Ready
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} Temple Management System
            </p>
          </div>
        </section>

        {/* Login section */}
        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            {/* Mobile branding */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-lg shadow-indigo-600/20">
                TM
              </div>

              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  Temple Management
                </h1>

                <p className="text-xs text-slate-500">
                  Management System
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
              <div>
                <p className="text-sm font-semibold text-indigo-600">
                  Welcome back
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  Sign in
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Sign in to access your temple administration dashboard.
                </p>
              </div>

              {error && (
                <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                    !
                  </div>

                  <p className="text-sm font-medium leading-5 text-red-700">
                    {error}
                  </p>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="mt-7 space-y-5"
              >
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="admin@example.com"
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-slate-700"
                    >
                      Password
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      disabled={loading}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed"
                      aria-label={
                        showPassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                    >
                      {showPassword ? '◉' : '○'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Signing in...
                    </span>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </form>

              <div className="mt-7 border-t border-slate-100 pt-6">
                <p className="text-center text-xs leading-5 text-slate-400">
                  Your session is protected using secure
                  authentication and an HTTP-only session cookie.
                </p>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400 lg:hidden">
              © {new Date().getFullYear()} Temple Management System
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
'use client';

import {
  useEffect,
  useState,
} from 'react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    logo: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    country: 'India',

    publicSettings: {
      showDonations: true,
      showDonorNames: false,
      showDonationAmounts: false,
      showBalance: false,
    },
  });

  /*
   * Opening Balance
   */
  const [openingBalance, setOpeningBalance] =
    useState(null);

  const [openingBalanceAmount, setOpeningBalanceAmount] =
    useState('');

  const [openingBalanceNotes, setOpeningBalanceNotes] =
    useState('');

  const [openingBalanceYear, setOpeningBalanceYear] =
    useState('');

  const [openingBalanceLoading, setOpeningBalanceLoading] =
    useState(true);

  const [openingBalanceSaving, setOpeningBalanceSaving] =
    useState(false);

  const [openingBalanceError, setOpeningBalanceError] =
    useState('');

  const [openingBalanceSuccess, setOpeningBalanceSuccess] =
    useState('');

  /*
   * Get current financial year
   */
  function getCurrentFinancialYear() {
    const now = new Date();

    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    if (month >= 4) {
      return `${year}-${String(
        year + 1
      ).slice(-2)}`;
    }

    return `${year - 1}-${String(
      year
    ).slice(-2)}`;
  }

  /*
   * Load organization settings
   */
  async function loadSettings() {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        '/api/organization/settings',
        {
          cache: 'no-store',
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            'Failed to load settings'
        );
      }

      const organization =
        result.data || result.organization;

      if (!organization) {
        throw new Error(
          'Organization data not found'
        );
      }

      setForm({
        name: organization.name || '',
        slug: organization.slug || '',
        description:
          organization.description || '',
        logo: organization.logo || '',
        phone: organization.phone || '',
        email: organization.email || '',
        address:
          organization.address || '',
        city: organization.city || '',
        state:
          organization.state || '',
        country:
          organization.country || 'India',

        publicSettings: {
          showDonations:
            organization.publicSettings
              ?.showDonations ?? true,

          showDonorNames:
            organization.publicSettings
              ?.showDonorNames ?? false,

          showDonationAmounts:
            organization.publicSettings
              ?.showDonationAmounts ?? false,

          showBalance:
            organization.publicSettings
              ?.showBalance ?? false,
        },
      });
    } catch (error) {
      console.error(
        'Settings load error:',
        error
      );

      setError(
        error.message ||
          'Failed to load settings'
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * Load opening balance
   */
  async function loadOpeningBalance() {
    try {
      setOpeningBalanceLoading(true);
      setOpeningBalanceError('');

      const currentYear =
        getCurrentFinancialYear();

      setOpeningBalanceYear(
        currentYear
      );

      const response = await fetch(
        '/api/organization/opening-balance',
        {
          cache: 'no-store',
        }
      );

      const result =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            'Failed to load opening balance'
        );
      }

      setOpeningBalance(
        result.data || null
      );

      if (result.data) {
        setOpeningBalanceYear(
          result.data.financialYear ||
            currentYear
        );

        setOpeningBalanceAmount(
          String(
            result.data.amount ?? ''
          )
        );

        setOpeningBalanceNotes(
          result.data.notes || ''
        );
      } else {
        setOpeningBalanceAmount('');
        setOpeningBalanceNotes('');
      }
    } catch (error) {
      console.error(
        'Opening balance load error:',
        error
      );

      setOpeningBalanceError(
        error.message ||
          'Failed to load opening balance'
      );
    } finally {
      setOpeningBalanceLoading(false);
    }
  }

  /*
   * Initial load
   */
  useEffect(() => {
    loadSettings();
    loadOpeningBalance();
  }, []);

  /*
   * Generic form change
   */
  function handleChange(
    event
  ) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  /*
   * Public setting toggle
   */
  function handlePublicSettingChange(
    name
  ) {
    setForm((current) => ({
      ...current,

      publicSettings: {
        ...current.publicSettings,

        [name]:
          !current.publicSettings[name],
      },
    }));
  }

  /*
   * Save organization settings
   */
  async function handleSave(
    event
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (!form.name.trim()) {
        setError(
          'Temple name is required.'
        );

        return;
      }

      if (!form.slug.trim()) {
        setError(
          'Temple slug is required.'
        );

        return;
      }

      const response = await fetch(
        '/api/organization/settings',
        {
          method: 'PATCH',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            name: form.name.trim(),

            slug: form.slug
              .trim()
              .toLowerCase(),

            description:
              form.description.trim(),

            logo:
              form.logo.trim(),

            phone:
              form.phone.trim(),

            email:
              form.email.trim(),

            address:
              form.address.trim(),

            city:
              form.city.trim(),

            state:
              form.state.trim(),

            country:
              form.country.trim(),

            publicSettings:
              form.publicSettings,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            'Failed to save settings'
        );
      }

      setSuccess(
        'Temple settings saved successfully.'
      );
    } catch (error) {
      console.error(
        'Settings save error:',
        error
      );

      setError(
        error.message ||
          'Failed to save settings'
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * Save opening balance
   */
  async function handleOpeningBalanceSave() {
    try {
      setOpeningBalanceSaving(true);
      setOpeningBalanceError('');
      setOpeningBalanceSuccess('');

      if (
        openingBalanceAmount === '' ||
        openingBalanceAmount === null
      ) {
        setOpeningBalanceError(
          'Opening balance amount is required.'
        );

        return;
      }

      const numericAmount =
        Number(
          openingBalanceAmount
        );

      if (
        !Number.isFinite(
          numericAmount
        ) ||
        numericAmount < 0
      ) {
        setOpeningBalanceError(
          'Opening balance must be zero or greater.'
        );

        return;
      }

      if (
        !/^\d{4}-\d{2}$/.test(
          openingBalanceYear
        )
      ) {
        setOpeningBalanceError(
          'Please enter a valid financial year, for example 2026-27.'
        );

        return;
      }

      const method =
        openingBalance
          ? 'PATCH'
          : 'POST';

      const response = await fetch(
        '/api/organization/opening-balance',
        {
          method,

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            financialYear:
              openingBalanceYear,

            amount:
              numericAmount,

            notes:
              openingBalanceNotes.trim(),
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            'Failed to save opening balance'
        );
      }

      setOpeningBalance(
        result.data
      );

      setOpeningBalanceYear(
        result.data.financialYear
      );

      setOpeningBalanceAmount(
        String(result.data.amount)
      );

      setOpeningBalanceNotes(
        result.data.notes || ''
      );

      setOpeningBalanceSuccess(
        openingBalance
          ? 'Opening balance updated successfully.'
          : 'Opening balance created successfully.'
      );
    } catch (error) {
      console.error(
        'Opening balance save error:',
        error
      );

      setOpeningBalanceError(
        error.message ||
          'Failed to save opening balance'
      );
    } finally {
      setOpeningBalanceSaving(false);
    }
  }

  /*
   * Reset settings form
   */
  function handleCancel() {
    loadSettings();

    setError('');
    setSuccess('');
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />

          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-100" />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-5">
            <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Settings
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage your temple information,
          financial settings and public
          visibility.
        </p>
      </div>

      {/* Global alerts */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <svg
            className="mt-0.5 h-5 w-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
            />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>

          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <svg
            className="mt-0.5 h-5 w-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
            />
            <path d="m8 12 2.5 2.5L16 9" />
          </svg>

          <span>{success}</span>
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="space-y-6"
      >
        {/* Temple Information */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Temple Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Basic information displayed
              throughout the temple management
              system.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
            {/* Temple Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Temple Name
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Temple Name"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Public Slug
              </label>

              <input
                type="text"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="temple-name"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />

              <p className="mt-2 text-xs text-slate-500">
                Used for the public temple
                URL.
              </p>
            </div>

            {/* Logo */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Logo URL
              </label>

              <input
                type="url"
                name="logo"
                value={form.logo}
                onChange={handleChange}
                placeholder="https://example.com/logo.png"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Description
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Short description about the temple..."
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
        </section>

        {/* Contact & Location */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Contact & Location
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Contact details and temple
              location information.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
            {/* Phone */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Phone
              </label>

              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="temple@example.com"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Address
              </label>

              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={3}
                placeholder="Temple address..."
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* City */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                City
              </label>

              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="City"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* State */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                State
              </label>

              <input
                type="text"
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="State"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Country */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Country
              </label>

              <input
                type="text"
                name="country"
                value={form.country}
                onChange={handleChange}
                placeholder="India"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
        </section>

        {/* Public Visibility */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Public Visibility
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Choose what information can be
              displayed on the public temple
              page.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {/* Show Donations */}
            <VisibilityRow
              title="Show Donations"
              description="Allow donation information to be displayed publicly."
              checked={
                form.publicSettings
                  .showDonations
              }
              onChange={() =>
                handlePublicSettingChange(
                  'showDonations'
                )
              }
            />

            {/* Show Donor Names */}
            <VisibilityRow
              title="Show Donor Names"
              description="Display donor names on the public donation information."
              checked={
                form.publicSettings
                  .showDonorNames
              }
              onChange={() =>
                handlePublicSettingChange(
                  'showDonorNames'
                )
              }
            />

            {/* Show Donation Amounts */}
            <VisibilityRow
              title="Show Donation Amounts"
              description="Display individual donation amounts publicly."
              checked={
                form.publicSettings
                  .showDonationAmounts
              }
              onChange={() =>
                handlePublicSettingChange(
                  'showDonationAmounts'
                )
              }
            />

            {/* Show Balance */}
            <VisibilityRow
              title="Show Balance"
              description="Display the temple's financial balance publicly."
              checked={
                form.publicSettings
                  .showBalance
              }
              onChange={() =>
                handlePublicSettingChange(
                  'showBalance'
                )
              }
            />
          </div>
        </section>

        {/* Settings actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? 'Saving...'
              : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* Opening Balance */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Opening Balance
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Set the starting balance for a
                financial year. This amount is
                used to calculate the current
                temple balance.
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <rect
                  x="3"
                  y="5"
                  width="18"
                  height="14"
                  rx="2"
                />

                <path d="M3 10h18" />

                <path d="M7 15h3" />
              </svg>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Loading */}
          {openingBalanceLoading ? (
            <div className="space-y-5">
              <div className="h-12 animate-pulse rounded-xl bg-slate-100" />

              <div className="h-12 animate-pulse rounded-xl bg-slate-100" />

              <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
            </div>
          ) : (
            <>
              {/* Alerts */}
              {openingBalanceError && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <svg
                    className="mt-0.5 h-5 w-5 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                    />

                    <path d="M12 8v4" />

                    <path d="M12 16h.01" />
                  </svg>

                  <span>
                    {openingBalanceError}
                  </span>
                </div>
              )}

              {openingBalanceSuccess && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  <svg
                    className="mt-0.5 h-5 w-5 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                    />

                    <path d="m8 12 2.5 2.5L16 9" />
                  </svg>

                  <span>
                    {openingBalanceSuccess}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Financial Year */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Financial Year
                  </label>

                  <input
                    type="text"
                    value={
                      openingBalanceYear
                    }
                    onChange={(event) =>
                      setOpeningBalanceYear(
                        event.target.value
                      )
                    }
                    disabled={Boolean(
                      openingBalance
                    )}
                    placeholder="2026-27"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    Example: 2026-27
                  </p>
                </div>

                {/* Amount */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Opening Amount
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                      ₹
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        openingBalanceAmount
                      }
                      onChange={(event) =>
                        setOpeningBalanceAmount(
                          event.target.value
                        )
                      }
                      placeholder="50000"
                      className="w-full rounded-xl border border-slate-300 py-3 pl-9 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Notes
                </label>

                <textarea
                  value={
                    openingBalanceNotes
                  }
                  onChange={(event) =>
                    setOpeningBalanceNotes(
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder="Example: Closing balance carried forward from previous financial year."
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Existing balance */}
              {openingBalance && (
                <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                        Current Opening Balance
                      </p>

                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        ₹
                        {Number(
                          openingBalance.amount ||
                            0
                        ).toLocaleString(
                          'en-IN',
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Financial Year:{' '}
                        {
                          openingBalance.financialYear
                        }
                      </p>
                    </div>

                    <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
                      <p className="text-xs text-slate-500">
                        Last Updated
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {openingBalance.updatedAt
                          ? new Date(
                              openingBalance.updatedAt
                            ).toLocaleDateString(
                              'en-IN',
                              {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              }
                            )
                          : openingBalance.createdAt
                            ? new Date(
                                openingBalance.createdAt
                              ).toLocaleDateString(
                                'en-IN',
                                {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                }
                              )
                            : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Save */}
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={
                    handleOpeningBalanceSave
                  }
                  disabled={
                    openingBalanceSaving
                  }
                  className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {openingBalanceSaving
                    ? 'Saving...'
                    : openingBalance
                      ? 'Update Opening Balance'
                      : 'Set Opening Balance'}
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

/*
 * Public visibility toggle
 */
function VisibilityRow({
  title,
  description,
  checked,
  onChange,
}) {
  return (
    <div className="flex items-center justify-between gap-5 px-6 py-5">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-slate-900">
          {title}
        </h3>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
          checked
            ? 'bg-indigo-600'
            : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition ${
            checked
              ? 'translate-x-5'
              : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
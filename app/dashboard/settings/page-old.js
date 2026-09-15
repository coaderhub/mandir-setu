'use client';

import {
  useEffect,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    slug: '',
    logo: '',
    description: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    phone: '',
    email: '',
    publicSettings: {
      showDonations: true,
      showDonorNames: false,
      showDonationAmounts: false,
      showBalance: false,
    },
  });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        '/api/organization/settings',
        {
          method: 'GET',
          cache: 'no-store',
        }
      );

      const result =
        await response.json();

      if (!response.ok || !result.success) {
        if (response.status === 401) {
          router.replace('/login');
          return;
        }

        setError(
          result.message ||
            'Failed to load settings.'
        );

        return;
      }

      setForm({
        name: result.data.name || '',
        slug: result.data.slug || '',
        logo: result.data.logo || '',
        description:
          result.data.description || '',
        address:
          result.data.address || '',
        city:
          result.data.city || '',
        state:
          result.data.state || '',
        country:
          result.data.country ||
          'India',
        phone:
          result.data.phone || '',
        email:
          result.data.email || '',

        publicSettings: {
          showDonations:
            result.data.publicSettings
              ?.showDonations ?? true,

          showDonorNames:
            result.data.publicSettings
              ?.showDonorNames ?? false,

          showDonationAmounts:
            result.data.publicSettings
              ?.showDonationAmounts ??
            false,

          showBalance:
            result.data.publicSettings
              ?.showBalance ?? false,
        },
      });
    } catch (error) {
      console.error(
        'Settings load error:',
        error
      );

      setError(
        'Unable to load organization settings.'
      );
    } finally {
      setLoading(false);
    }
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

  function handleToggle(name) {
    setForm((current) => ({
      ...current,

      publicSettings: {
        ...current.publicSettings,

        [name]:
          !current.publicSettings[name],
      },
    }));

    setError('');
    setSuccess('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

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
        'Public slug is required.'
      );

      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        '/api/organization/settings',
        {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            name:
              form.name.trim(),

            slug:
              form.slug.trim(),

            logo:
              form.logo.trim(),

            description:
              form.description.trim(),

            address:
              form.address.trim(),

            city:
              form.city.trim(),

            state:
              form.state.trim(),

            country:
              form.country.trim(),

            phone:
              form.phone.trim(),

            email:
              form.email
                .trim()
                .toLowerCase(),

            publicSettings:
              form.publicSettings,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok || !result.success) {
        if (response.status === 401) {
          router.replace('/login');
          return;
        }

        setError(
          result.message ||
            'Failed to update settings.'
        );

        return;
      }

      setForm((current) => ({
        ...current,

        name:
          result.data.name || '',

        slug:
          result.data.slug || '',

        logo:
          result.data.logo || '',

        description:
          result.data.description || '',

        address:
          result.data.address || '',

        city:
          result.data.city || '',

        state:
          result.data.state || '',

        country:
          result.data.country ||
          'India',

        phone:
          result.data.phone || '',

        email:
          result.data.email || '',

        publicSettings: {
          showDonations:
            result.data.publicSettings
              ?.showDonations ?? true,

          showDonorNames:
            result.data.publicSettings
              ?.showDonorNames ?? false,

          showDonationAmounts:
            result.data.publicSettings
              ?.showDonationAmounts ??
            false,

          showBalance:
            result.data.publicSettings
              ?.showBalance ?? false,
        },
      }));

      setSuccess(
        'Organization settings updated successfully.'
      );
    } catch (error) {
      console.error(
        'Settings update error:',
        error
      );

      setError(
        'Something went wrong. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-5xl animate-pulse">

          <div className="h-8 w-64 rounded bg-slate-200" />

          <div className="mt-3 h-4 w-96 rounded bg-slate-200" />

          <div className="mt-8 h-96 rounded-2xl bg-white" />

        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

      <div className="mx-auto max-w-5xl">

        {/* Page header */}
        <div className="mb-8">

          <p className="text-sm font-semibold text-indigo-600">
            Administration
          </p>

          <div className="mt-1 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Organization Settings
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Manage your temple information
                and public visibility settings.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  '/dashboard'
                )
              }
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Back to Dashboard
            </button>

          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">

            <div className="flex items-start gap-3">

              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                !
              </div>

              <p className="text-sm font-medium leading-6 text-red-700">
                {error}
              </p>

            </div>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">

            <div className="flex items-start gap-3">

              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600">
                ✓
              </div>

              <p className="text-sm font-medium leading-6 text-emerald-700">
                {success}
              </p>

            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* Temple */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">

              <h3 className="text-base font-bold text-slate-900">
                Temple Information
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Basic information about your temple.
              </p>

            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">

              <FormField
                label="Temple Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Shri Ram Mandir"
                required
              />

              <FormField
                label="Public Slug"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="shri-ram-mandir"
                required
                help="Used in the public temple URL."
              />

              <div className="sm:col-span-2">
                <FormField
                  label="Logo URL"
                  name="logo"
                  value={form.logo}
                  onChange={handleChange}
                  placeholder="https://example.com/logo.png"
                  help="Logo upload can be added later."
                />
              </div>

              <div className="sm:col-span-2">

                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  value={
                    form.description
                  }
                  onChange={
                    handleChange
                  }
                  rows={4}
                  placeholder="Short description about your temple..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />

              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">

              <h3 className="text-base font-bold text-slate-900">
                Contact & Location
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Temple address and contact information.
              </p>

            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">

              <div className="sm:col-span-2">
                <FormField
                  label="Address"
                  name="address"
                  value={
                    form.address
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Main Temple Road"
                />
              </div>

              <FormField
                label="City"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Jalandhar"
              />

              <FormField
                label="State"
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="Punjab"
              />

              <FormField
                label="Country"
                name="country"
                value={
                  form.country
                }
                onChange={
                  handleChange
                }
                placeholder="India"
              />

              <FormField
                label="Phone"
                name="phone"
                value={form.phone}
                onChange={
                  handleChange
                }
                placeholder="9876543210"
              />

              <div className="sm:col-span-2">
                <FormField
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={
                    handleChange
                  }
                  placeholder="info@example.com"
                />
              </div>

            </div>
          </section>

          {/* Public Visibility */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">

              <h3 className="text-base font-bold text-slate-900">
                Public Visibility
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Control what visitors can see on the public temple page.
              </p>

            </div>

            <div className="divide-y divide-slate-100">

              <ToggleSetting
                title="Show Donations"
                description="Allow visitors to see donation information."
                checked={
                  form.publicSettings
                    .showDonations
                }
                onChange={() =>
                  handleToggle(
                    'showDonations'
                  )
                }
              />

              <ToggleSetting
                title="Show Donor Names"
                description="Display donor names on the public donation section."
                checked={
                  form.publicSettings
                    .showDonorNames
                }
                onChange={() =>
                  handleToggle(
                    'showDonorNames'
                  )
                }
              />

              <ToggleSetting
                title="Show Donation Amounts"
                description="Display individual donation amounts publicly."
                checked={
                  form.publicSettings
                    .showDonationAmounts
                }
                onChange={() =>
                  handleToggle(
                    'showDonationAmounts'
                  )
                }
              />

              <ToggleSetting
                title="Show Balance"
                description="Display the temple's current balance publicly."
                checked={
                  form.publicSettings
                    .showBalance
                }
                onChange={() =>
                  handleToggle(
                    'showBalance'
                  )
                }
              />

            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                router.push(
                  '/dashboard'
                )
              }
              className="h-12 rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-indigo-600 px-7 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  help = '',
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
        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
      />

      {help && (
        <p className="mt-1.5 text-xs text-slate-400">
          {help}
        </p>
      )}
    </div>
  );
}

function ToggleSetting({
  title,
  description,
  checked,
  onChange,
}) {
  return (
    <div className="flex items-center justify-between gap-6 px-5 py-5 sm:px-6">

      <div className="min-w-0">

        <h3 className="text-sm font-semibold text-slate-900">
          {title}
        </h3>

        <p className="mt-1 text-sm leading-5 text-slate-500">
          {description}
        </p>

      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked
            ? 'bg-indigo-600'
            : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            checked
              ? 'left-6'
              : 'left-1'
          }`}
        />
      </button>

    </div>
  );
}
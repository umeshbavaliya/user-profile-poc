import { useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import type { FormEvent } from 'react';
import { createProfileApi, deleteProfileApi, getProfilesApi, updateProfileApi } from './api';
import type { Country, Profile, ProfileForm, ValidationErrors } from './types';

const cityOptions: Record<Country, string[]> = {
  US: ['New York', 'Los Angeles', 'Chicago'],
  India: ['Mumbai', 'Delhi', 'Bangalore']
};

const initialFormState: ProfileForm = {
  first_name: '',
  last_name: '',
  dob: '',
  email: '',
  country: 'US',
  city: ''
};

const validateForm = (form: ProfileForm): ValidationErrors => {
  const errors: ValidationErrors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!form.first_name.trim()) errors.first_name = 'First Name is required.';
  if (!form.last_name.trim()) errors.last_name = 'Last Name is required.';
  if (!form.dob) errors.dob = 'Date of Birth is required.';
  if (!form.email.trim()) {
    errors.email = 'Email Address is required.';
  } else if (!emailRegex.test(form.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!form.country) errors.country = 'Country is required.';
  if (!form.city) errors.city = 'City is required.';

  return errors;
};

export const formatDob = (dob: string | Date) => {
  if (!dob) return '';

  // prefer explicit parsing for common slash format (DD/MM/YYYY)
  if (typeof dob === 'string' && dob.includes('/')) {
    const m = moment(dob, 'DD/MM/YYYY', true);
    if (m.isValid()) return m.format('DD-MM-YYYY');
  }

  const formatted = moment(dob).format('DD-MM-YYYY');
  return formatted === 'Invalid date' ? dob : formatted;
};

export const normalizeDobForInput = (dob: string) => {
  if (!dob) return '';

  const dateValue = typeof dob === 'string' ? dob.trim() : '';

  const isoMatch = dateValue.match(/^\d{4}-\d{2}-\d{2}$/);
  if (isoMatch) return dateValue;

  const dashParts = dateValue.split('-');
  if (dashParts.length === 3) {
    const [part1, part2, part3] = dashParts;
    if (part1.length === 4) {
      return `${part1}-${part2.padStart(2, '0')}-${part3.padStart(2, '0')}`;
    }
    return `${part3}-${part2.padStart(2, '0')}-${part1.padStart(2, '0')}`;
  }

  const slashParts = dateValue.split('/');
  if (slashParts.length === 3) {
    const [part1, part2, part3] = slashParts;
    if (part3.length === 4) {
      return `${part3}-${part2.padStart(2, '0')}-${part1.padStart(2, '0')}`;
    }
  }

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  return `${parsedDate.getFullYear()}-${`${parsedDate.getMonth() + 1}`.padStart(2, '0')}-${`${parsedDate.getDate()}`.padStart(2, '0')}`;
};

function App() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [form, setForm] = useState<ProfileForm>(initialFormState);
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});
  const [serverError, setServerError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeProfileId, setActiveProfileId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const cities = useMemo(() => cityOptions[form.country], [form.country]);

  const totalProfiles = useMemo(() => profiles.length, [profiles]);
  const usProfiles = useMemo(
    () => profiles.filter((profile) => profile.country === 'US').length,
    [profiles]
  );
  const indiaProfiles = useMemo(
    () => profiles.filter((profile) => profile.country === 'India').length,
    [profiles]
  );

  const fetchProfiles = async (search = '') => {
    setLoading(true);
    try {
      const result = await getProfilesApi(search);
      setProfiles(result.profiles);
    } catch (error) {
      setServerError((error as Error).message || 'Unable to load profiles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProfiles(searchTerm);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const resetForm = () => {
    setForm(initialFormState);
    setFieldErrors({});
    setActiveProfileId(null);
    setServerError('');
  };

  const openCreateModal = () => {
    resetForm();
    setSuccessMessage('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFieldErrors({});
    setServerError('');
  };

  const handleChange = (field: keyof ProfileForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: field === 'country' ? (value as Country) : value,
      ...(field === 'country' ? { city: '' } : {})
    }));

    setFieldErrors((current) => {
      const nextErrors = { ...current };

      if (field === 'country') {
        delete nextErrors.country;
        delete nextErrors.city;
      } else if (field === 'email') {
        const trimmedValue = value.trim();
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue);
        if (trimmedValue && emailValid) {
          delete nextErrors.email;
        }
      } else if (value.trim()) {
        delete nextErrors[field];
      }

      return nextErrors;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError('');
    setSuccessMessage('');

    const errors = validateForm(form);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      if (activeProfileId) {
        await updateProfileApi(activeProfileId, form);
        setSuccessMessage('Profile updated successfully.');
      } else {
        await createProfileApi(form);
        setSuccessMessage('Profile created successfully.');
      }
      resetForm();
      closeModal();
      fetchProfiles(searchTerm);
    } catch (error) {
      setServerError((error as Error).message || 'Unable to save profile.');
    }
  };

  const handleEdit = (profile: Profile) => {
    setActiveProfileId(profile.id ?? null);
    setForm({
      first_name: profile.first_name,
      last_name: profile.last_name,
      dob: new Date(profile.dob),
      email: profile.email,
      country: profile.country,
      city: profile.city
    });
    setFieldErrors({});
    setServerError('');
    setSuccessMessage('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm('Delete this profile?');
    if (!confirmed) return;

    try {
      await deleteProfileApi(id);
      setSuccessMessage('Profile deleted successfully.');
      fetchProfiles(searchTerm);
    } catch (error) {
      setServerError((error as Error).message || 'Unable to delete profile.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
            <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  User Management
                </h1>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-white text-2xl shadow-sm">
                  👤
                </div>
                <p className="mt-5 text-xs uppercase tracking-widest text-slate-500">Total Profiles</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{totalProfiles}</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-white text-2xl shadow-sm">
                  🌎
                </div>
                <p className="mt-5 text-xs uppercase tracking-widest text-slate-500">US Records</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">
                  {usProfiles} <span className="text-base font-medium text-slate-500">({totalProfiles ? Math.round((usProfiles / totalProfiles) * 100) : 0}%)</span>
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-white text-2xl shadow-sm">
                  🌍
                </div>
                <p className="mt-5 text-xs uppercase tracking-widest text-slate-500">India Records</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">
                  {indiaProfiles} <span className="text-base font-medium text-slate-500">({totalProfiles ? Math.round((indiaProfiles / totalProfiles) * 100) : 0}%)</span>
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1 min-w-[260px]">
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by first or last name..."
                  className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-3xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
                onClick={openCreateModal}
              >
                + Add User Profile
              </button>
            </div>
          </div>
        </header>

        <main className="mt-6 grid gap-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-950">Saved Profiles</h2>
              <p className="mt-1 text-sm text-slate-500">Search by first or last name.</p>
            </div>

            {successMessage && (
              <div className="mb-4 rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
                {successMessage}
              </div>
            )}
            {serverError && (
              <div className="mb-4 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
                {serverError}
              </div>
            )}

            <div className="overflow-hidden rounded-3xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 bg-white text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-500">User</th>
                    <th className="px-6 py-4 font-semibold text-slate-500">Date of Birth</th>
                    <th className="px-6 py-4 font-semibold text-slate-500">Email Address</th>
                    <th className="px-6 py-4 font-semibold text-slate-500">Location</th>
                    <th className="px-6 py-4 font-semibold text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {profiles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-sm text-slate-500">
                        {loading ? 'Loading profiles...' : 'No profiles available.'}
                      </td>
                    </tr>
                  ) : (
                    profiles.map((profile) => (
                      <tr key={profile.id} className="transition hover:bg-slate-50">
                        <td className="px-6 py-5 align-top">
                          <div className="flex items-center gap-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-lg font-semibold text-slate-900">
                              {profile.first_name.charAt(0)}{profile.last_name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-950">{profile.first_name} {profile.last_name}</p>
                              <p className="mt-1 text-xs text-slate-500">ID: {profile.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 align-top text-slate-700">{formatDob(profile.dob)}</td>
                        <td className="px-6 py-5 align-top text-slate-700">{profile.email}</td>
                        <td className="px-6 py-5 align-top">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${profile.country === 'India' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>
                              {profile.country}
                            </span>
                            <span className="text-sm text-slate-600">{profile.city}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 align-top">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(profile)}
                              className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(profile.id ?? 0)}
                              className="inline-flex h-10 items-center justify-center rounded-2xl bg-rose-500 px-4 text-sm font-semibold text-white transition hover:bg-rose-600"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 px-4 py-6">
            <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white p-8 shadow-2xl">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-950">{activeProfileId ? 'Edit Profile' : 'Create Profile'}</h2>
                  <p className="mt-2 text-sm text-slate-500">All fields are mandatory.</p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-3xl leading-none text-slate-400 transition hover:text-slate-700"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm text-slate-700">
                    <span className="font-semibold">First Name</span>
                    <input
                      value={form.first_name}
                      onChange={(event) => handleChange('first_name', event.target.value)}
                      placeholder="First Name"
                      className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    />
                    {fieldErrors.first_name && <div className="text-sm text-rose-600">{fieldErrors.first_name}</div>}
                  </label>

                  <label className="grid gap-2 text-sm text-slate-700">
                    <span className="font-semibold">Last Name</span>
                    <input
                      value={form.last_name}
                      onChange={(event) => handleChange('last_name', event.target.value)}
                      placeholder="Last Name"
                      className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    />
                    {fieldErrors.last_name && <div className="text-sm text-rose-600">{fieldErrors.last_name}</div>}
                  </label>

                  <label className="grid gap-2 text-sm text-slate-700">
                    <span className="font-semibold">Date of Birth</span>
                    <input
                      type="date"
                      value={form.dob}
                      onChange={(event) => handleChange('dob', event.target.value)}
                      className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    />
                    {fieldErrors.dob && <div className="text-sm text-rose-600">{fieldErrors.dob}</div>}
                  </label>

                  <label className="grid gap-2 text-sm text-slate-700">
                    <span className="font-semibold">Email Address</span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) => handleChange('email', event.target.value)}
                      placeholder="user@domain.com"
                      className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    />
                    {fieldErrors.email && <div className="text-sm text-rose-600">{fieldErrors.email}</div>}
                  </label>

                  <label className="grid gap-2 text-sm text-slate-700">
                    <span className="font-semibold">Country</span>
                    <select
                      value={form.country}
                      onChange={(event) => handleChange('country', event.target.value)}
                      className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    >
                      <option value="US">United States</option>
                      <option value="India">India</option>
                    </select>
                    {fieldErrors.country && <div className="text-sm text-rose-600">{fieldErrors.country}</div>}
                  </label>

                  <label className="grid gap-2 text-sm text-slate-700">
                    <span className="font-semibold">City</span>
                    <select
                      value={form.city}
                      onChange={(event) => handleChange('city', event.target.value)}
                      className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    >
                      <option value="">Select city</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.city && <div className="text-sm text-rose-600">{fieldErrors.city}</div>}
                  </label>
                </div>

                {serverError && <div className="mt-4 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">{serverError}</div>}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-3xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-200"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    {activeProfileId ? 'Update Profile' : 'Create Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

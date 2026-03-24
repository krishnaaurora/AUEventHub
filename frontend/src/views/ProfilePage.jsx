"use client";

import { useState } from "react";
import useSWR from "swr";
import { UserCircle, Pencil, Camera, Mail, Phone, IdCard, Building, UserCog, Calendar, Lock, Bell, ShieldCheck, Save, Key, TrendingUp, CheckCircle, Award, Users, Activity, Zap, Info } from "lucide-react";
import Image from "next/image";

export default function ProfilePage() {

  // Simulate user_id from localStorage/session (replace with real auth)
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('user_id') || '') : '';
  const fetcher = (url) => fetch(url).then((res) => res.json());
  const { data: user, error, isLoading, mutate } = useSWR(userId ? `/api/profile?user_id=${userId}` : null, fetcher, { revalidateOnFocus: true });
  const [form, setForm] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activity, setActivity] = useState([
    { icon: <CheckCircle className="h-4 w-4 text-emerald-500" />, text: "Registered for AI Workshop", date: "2026-03-10" },
    { icon: <Award className="h-4 w-4 text-indigo-500" />, text: "Certificate earned: Hackathon", date: "2026-02-28" },
    { icon: <TrendingUp className="h-4 w-4 text-amber-500" />, text: "Profile updated", date: "2026-02-15" },
  ]);
  const [aiInsight, setAiInsight] = useState("You mostly participate in technical workshops. Recommended upcoming events: AI Bootcamp, Data Science Summit.");

  // Keep form in sync with user data
  React.useEffect(() => {
    if (user) setForm(user);
  }, [user]);

  // Stats by role (simulate, replace with real API if available)
  const stats = user && user.role === "student"
    ? [
        { label: "Events Registered", value: 8, icon: <Users className="h-5 w-5 text-cyan-600" /> },
        { label: "Events Attended", value: 5, icon: <CheckCircle className="h-5 w-5 text-emerald-600" /> },
        { label: "Certificates Earned", value: 2, icon: <Award className="h-5 w-5 text-indigo-600" /> },
      ]
    : user && user.role === "organizer"
    ? [
        { label: "Events Created", value: 12, icon: <Users className="h-5 w-5 text-cyan-600" /> },
        { label: "Approved Events", value: 10, icon: <CheckCircle className="h-5 w-5 text-emerald-600" /> },
        { label: "Total Participants", value: 350, icon: <Users className="h-5 w-5 text-amber-600" /> },
      ]
    : user && user.role === "faculty"
    ? [
        { label: "Events Monitored", value: 7, icon: <Activity className="h-5 w-5 text-cyan-600" /> },
        { label: "Attendance Reports", value: 4, icon: <CheckCircle className="h-5 w-5 text-emerald-600" /> },
      ]
    : user
    ? [
        { label: "Events Reviewed", value: 20, icon: <TrendingUp className="h-5 w-5 text-cyan-600" /> },
        { label: "Events Approved", value: 18, icon: <CheckCircle className="h-5 w-5 text-emerald-600" /> },
        { label: "System Activity", value: 120, icon: <Zap className="h-5 w-5 text-indigo-600" /> },
      ]
    : [];

  // Handlers
  function handleEdit() {
    setEditMode(true);
  }
  function handleCancel() {
    setEditMode(false);
    setForm(user);
  }
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user._id, ...form }),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      mutate({ ...user, ...form }, false); // Optimistic update
      setEditMode(false);
    } catch (e) {
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }
  // Profile image upload
  const [uploading, setUploading] = useState(false);
  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', user._id);
      const res = await fetch('/api/profile-image', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      mutate({ ...user, profile_image: data.imageUrl }, false); // Optimistic update
      setForm({ ...form, profile_image: data.imageUrl });
    } catch (err) {
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-lg text-slate-500">Loading profile...</div>;
  }
  if (error || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-lg text-rose-500">Profile not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-2 md:px-8">
      <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar (optional) */}
        <aside className="hidden md:block col-span-1">
          <div className="sticky top-8 space-y-4">
            <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
              <div className="relative">
                <Image src={user.profile_image || "/assets/avatars/person1.png"} alt="Profile" width={96} height={96} className="rounded-full border-4 border-white shadow" />
                <label className="absolute bottom-2 right-2 bg-cyan-600 p-2 rounded-full text-white shadow hover:bg-cyan-700 transition cursor-pointer">
                  <Camera className="h-4 w-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                </label>
                {uploading && <span className="absolute left-1/2 -bottom-6 text-xs text-cyan-600 animate-pulse">Uploading...</span>}
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-800">{user.name}</h2>
              <p className="text-sm text-slate-500">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
              <p className="text-xs text-slate-400">{user.department}</p>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Mail className="h-3 w-3" /> {user.email}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="h-3 w-3" /> Joined {user.joined_at}</p>
              <button onClick={handleEdit} className="mt-4 w-full rounded-full bg-indigo-600 text-white py-2 font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"><Pencil className="h-4 w-4" /> Edit Profile</button>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Info className="h-4 w-4 text-cyan-600" /> AI Insights</h3>
              <p className="text-xs text-slate-600">{aiInsight}</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="col-span-2 space-y-8">
          {/* Profile Header (mobile) */}
          <div className="md:hidden bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <div className="relative">
              <Image src={user.profile_image || "/assets/avatars/person1.png"} alt="Profile" width={96} height={96} className="rounded-full border-4 border-white shadow" />
              <label className="absolute bottom-2 right-2 bg-cyan-600 p-2 rounded-full text-white shadow hover:bg-cyan-700 transition cursor-pointer">
                <Camera className="h-4 w-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
              </label>
              {uploading && <span className="absolute left-1/2 -bottom-6 text-xs text-cyan-600 animate-pulse">Uploading...</span>}
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-800">{user.name}</h2>
            <p className="text-sm text-slate-500">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
            <p className="text-xs text-slate-400">{user.department}</p>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Mail className="h-3 w-3" /> {user.email}</p>
            <p className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="h-3 w-3" /> Joined {user.joined_at}</p>
            <button onClick={handleEdit} className="mt-4 w-full rounded-full bg-indigo-600 text-white py-2 font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"><Pencil className="h-4 w-4" /> Edit Profile</button>
          </div>

          {/* Personal Information */}
          <section className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><UserCircle className="h-5 w-5 text-cyan-600" /> Personal Information</h3>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500">Full Name</label>
                <div className="flex items-center gap-2">
                  <input disabled={!editMode} name="name" value={form?.name || ''} onChange={handleChange} className="w-full rounded border px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:outline-none" />
                  <Pencil className="h-4 w-4 text-slate-400" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500">Email Address</label>
                <div className="flex items-center gap-2">
                  <input disabled name="email" value={form?.email || ''} className="w-full rounded border px-3 py-2 text-sm bg-gray-50" />
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500">Phone Number</label>
                <div className="flex items-center gap-2">
                  <input disabled={!editMode} name="phone" value={form?.phone || ''} onChange={handleChange} className="w-full rounded border px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:outline-none" />
                  <Phone className="h-4 w-4 text-slate-400" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500">University ID</label>
                <div className="flex items-center gap-2">
                  <input disabled={!editMode} name="university_id" value={form?.university_id || ''} onChange={handleChange} className="w-full rounded border px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:outline-none" />
                  <IdCard className="h-4 w-4 text-slate-400" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500">Department</label>
                <div className="flex items-center gap-2">
                  <input disabled={!editMode} name="department" value={form?.department || ''} onChange={handleChange} className="w-full rounded border px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:outline-none" />
                  <Building className="h-4 w-4 text-slate-400" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500">Role</label>
                <div className="flex items-center gap-2">
                  <input disabled name="role" value={form?.role ? form.role.charAt(0).toUpperCase() + form.role.slice(1) : ''} className="w-full rounded border px-3 py-2 text-sm bg-gray-50" />
                  <UserCog className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            </form>
            {editMode && (
              <div className="mt-6 flex gap-2">
                <button type="button" onClick={handleSave} disabled={saving} className="flex-1 rounded-full bg-emerald-600 text-white py-2 font-semibold hover:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-60"><Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}</button>
                <button type="button" onClick={handleCancel} disabled={saving} className="flex-1 rounded-full border border-slate-200 text-slate-600 py-2 font-semibold hover:bg-slate-50 transition">Cancel</button>
              </div>
            )}
          </section>

          {/* Account Settings */}
          <section className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Lock className="h-5 w-5 text-cyan-600" /> Account Settings</h3>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500">Change Password</label>
                <div className="flex items-center gap-2">
                  <input type="password" disabled name="password" value={''} className="w-full rounded border px-3 py-2 text-sm bg-gray-50" placeholder="Change password (not implemented)" />
                  <Key className="h-4 w-4 text-slate-400" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500">Enable Notifications</label>
                <div className="flex items-center gap-2">
                  <input type="checkbox" disabled checked={form?.notifications || false} className="h-5 w-5 text-cyan-600 rounded focus:ring-0" />
                  <Bell className="h-4 w-4 text-slate-400" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500">Two-Factor Authentication</label>
                <div className="flex items-center gap-2">
                  <input type="checkbox" disabled checked={form?.twofa || false} className="h-5 w-5 text-cyan-600 rounded focus:ring-0" />
                  <ShieldCheck className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            </form>
            {editMode && (
              <div className="mt-6 flex gap-2">
                <button type="button" disabled className="flex-1 rounded-full bg-indigo-600 text-white py-2 font-semibold opacity-60 flex items-center justify-center gap-2"><Save className="h-4 w-4" /> Update Password</button>
              </div>
            )}
          </section>

          {/* Activity Overview */}
          <section className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-cyan-600" /> Activity Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-xl bg-gray-50 p-5 flex items-center gap-4 shadow-sm border hover:shadow transition">
                  <div className="bg-white rounded-full p-3 shadow flex items-center justify-center">{stat.icon}</div>
                  <div>
                    <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
                    <div className="text-xs text-slate-500 font-semibold mt-1">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Activity Timeline */}
          <section className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Activity className="h-5 w-5 text-cyan-600" /> Recent Activity</h3>
            <ol className="relative border-l-2 border-cyan-100 ml-2">
              {activity.map((item, idx) => (
                <li key={idx} className="mb-8 ml-6">
                  <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-cyan-100 rounded-full ring-8 ring-white">
                    {item.icon}
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-slate-700">{item.text}</span>
                    <span className="text-xs text-slate-400">{item.date}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </main>
      </div>
    </div>
  );
  // If you have any <Link> components in this file, add prefetch for faster navigation.
}

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
  Save, Mail, Bell, LogOut, RefreshCw,
  User, Phone
} from 'lucide-react';
import { PROVINCES, EDUCATION_LEVELS, UNIVERSITY_TYPES, UNIVERSITY_LEVELS, COOPERATION_TYPES } from '@/lib/utils';
import type { UserFilters, Profile } from '@/lib/types';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [filters, setFilters] = useState<UserFilters | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    const supabase = createClient();
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const [profileRes, filtersRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('user_filters').select('*').eq('user_id', user.id).single(),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
        setNickname(profileRes.data.nickname || '');
      }
      if (filtersRes.data) setFilters(filtersRes.data);
      setLoading(false);
    };
    fetchData();
  }, [router]);

  const toggleArrayFilter = (key: keyof UserFilters, value: string) => {
    if (!filters) return;
    const arr = filters[key] as string[];
    setFilters({
      ...filters,
      [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
    });
  };

  const saveFilters = async () => {
    if (!filters) return;
    setSaving(true);
    const supabase = createClient();

    await supabase.from('user_filters').update({
      provinces: filters.provinces,
      education: filters.education,
      university_types: filters.university_types,
      university_levels: filters.university_levels,
      cooperation_types: filters.cooperation_types,
      notify_email: filters.notify_email,
      notify_in_app: filters.notify_in_app,
    }).eq('id', filters.id);

    if (profile && nickname !== profile.nickname) {
      await supabase.from('profiles').update({ nickname }).eq('id', profile.id);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <RefreshCw size={24} className="animate-spin text-[var(--muted)]" />
      </div>
    );
  }

  if (!filters) return null;

  return (
    <div className="pb-24">
      {/* Gradient header */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white">
        <div className="container-main py-6 pb-8">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <User size={18} />
            个人设置
          </h1>
        </div>
      </div>

      <div className="container-main -mt-4 relative z-10 space-y-3">
        {/* Profile info */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">账号信息</h2>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Mail size={14} className="text-gray-400" />
            {profile?.email}
          </div>
          <div className="flex items-center gap-2">
            <User size={14} className="text-gray-400" />
            <input
              type="text"
              className="input flex-1"
              placeholder="设置昵称"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
            />
          </div>
        </div>

        {/* Filter preferences */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">筛选偏好</h2>

          <FilterGroup label="关注省份">
            <div className="flex flex-wrap gap-1.5">
              {PROVINCES.map(p => (
                <ChipBtn
                  key={p}
                  active={filters.provinces.includes(p)}
                  onClick={() => toggleArrayFilter('provinces', p)}
                >{p}</ChipBtn>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup label="学历要求">
            <div className="flex flex-wrap gap-1.5">
              {EDUCATION_LEVELS.map(e => (
                <ChipBtn
                  key={e}
                  active={filters.education.includes(e)}
                  onClick={() => toggleArrayFilter('education', e)}
                >{e}</ChipBtn>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup label="办学性质">
            <div className="flex flex-wrap gap-1.5">
              {UNIVERSITY_TYPES.map(t => (
                <ChipBtn
                  key={t}
                  active={filters.university_types.includes(t)}
                  onClick={() => toggleArrayFilter('university_types', t)}
                >{t}</ChipBtn>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup label="院校层次">
            <div className="flex flex-wrap gap-1.5">
              {UNIVERSITY_LEVELS.map(l => (
                <ChipBtn
                  key={l}
                  active={filters.university_levels.includes(l)}
                  onClick={() => toggleArrayFilter('university_levels', l)}
                >{l}</ChipBtn>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup label="聘用方式">
            <div className="flex flex-wrap gap-1.5">
              {COOPERATION_TYPES.map(c => (
                <ChipBtn
                  key={c}
                  active={filters.cooperation_types.includes(c)}
                  onClick={() => toggleArrayFilter('cooperation_types', c)}
                >{c}</ChipBtn>
              ))}
            </div>
          </FilterGroup>
        </div>

        {/* Notification preferences */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">通知设置</h2>

          <label className="flex items-center justify-between text-sm py-1">
            <div className="flex items-center gap-2 text-gray-600">
              <Mail size={14} className="text-gray-400" />
              邮件通知
            </div>
            <input
              type="checkbox"
              className="w-4 h-4 rounded accent-indigo-600"
              checked={filters.notify_email}
              onChange={e => setFilters({ ...filters, notify_email: e.target.checked })}
            />
          </label>

          <label className="flex items-center justify-between text-sm py-1">
            <div className="flex items-center gap-2 text-gray-600">
              <Bell size={14} className="text-gray-400" />
              站内通知
            </div>
            <input
              type="checkbox"
              className="w-4 h-4 rounded accent-indigo-600"
              checked={filters.notify_in_app}
              onChange={e => setFilters({ ...filters, notify_in_app: e.target.checked })}
            />
          </label>
        </div>

        {/* Save & Logout */}
        <div className="flex items-center gap-2">
          <button className="btn btn-primary flex-1" onClick={saveFilters} disabled={saving}>
            {saving ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {saving ? '保存中...' : saved ? '已保存' : '保存设置'}
          </button>
          <button className="btn btn-secondary" onClick={handleLogout}>
            <LogOut size={14} />
            退出
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-[var(--muted)] mb-1.5">{label}</p>
      {children}
    </div>
  );
}

function ChipBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button className={`chip ${active ? 'chip-active' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { useRouter } from 'next/navigation';
import {
  Shield, Plus, Copy, Check, RefreshCw, Trash2,
  Key, Calendar, User, X
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { InviteCode } from '@/lib/types';

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      if (profile?.email !== 'admin@gaoxiaozhaopin.com') {
        router.push('/');
        return;
      }

      setIsAdmin(true);
      fetchInviteCodes();
      setLoading(false);
    });
  }, [router]);

  const fetchInviteCodes = async () => {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from('invite_codes')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setInviteCodes(data);
  };

  const generateCode = async () => {
    setGenerating(true);
    const adminClient = createAdminClient();

    const code = Array.from({ length: 8 }, () =>
      'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]
    ).join('');

    await adminClient.from('invite_codes').insert({
      code,
      created_by: (await (await createClient()).auth.getUser()).data.user?.id,
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
    });

    await fetchInviteCodes();
    setGenerating(false);
  };

  const deleteCode = async (id: string) => {
    const adminClient = createAdminClient();
    await adminClient.from('invite_codes').delete().eq('id', id);
    setInviteCodes(prev => prev.filter(c => c.id !== id));
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <RefreshCw size={24} className="animate-spin text-[var(--muted)]" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="container-main py-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield size={18} />
          <h1 className="text-lg font-bold">管理后台</h1>
        </div>
        <button className="btn btn-primary btn-sm" onClick={generateCode} disabled={generating}>
          <Plus size={14} />
          {generating ? '生成中...' : '生成邀请码'}
        </button>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-[var(--muted)] mb-3">邀请码列表</h2>

        {inviteCodes.length === 0 ? (
          <p className="text-sm text-[var(--muted)] text-center py-8">暂无邀请码</p>
        ) : (
          <div className="space-y-2">
            {inviteCodes.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] text-sm"
              >
                <div className="flex items-center gap-3">
                  <Key size={14} className="text-[var(--muted)]" />
                  <code className="font-mono font-bold tracking-wider">{item.code}</code>
                  <button
                    className="text-[var(--muted)] hover:text-[var(--primary)]"
                    onClick={() => copyCode(item.code, item.id)}
                  >
                    {copiedId === item.id ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                  {item.used_by ? (
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      已使用
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-green-600">
                      <Calendar size={12} />
                      {item.expires_at ? `有效期至 ${formatDate(item.expires_at)}` : '永久有效'}
                    </span>
                  )}
                  <button
                    className="text-[var(--muted)] hover:text-red-500"
                    onClick={() => deleteCode(item.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card mt-4">
        <h2 className="text-sm font-semibold text-[var(--muted)] mb-2">使用说明</h2>
        <ul className="text-sm space-y-1 text-[var(--muted)]">
          <li>• 邀请码为 8 位字母数字组合，区分大小写</li>
          <li>• 每个邀请码只能使用一次</li>
          <li>• 邀请码默认 90 天有效</li>
          <li>• 管理员账号：admin@gaoxiaozhaopin.com</li>
        </ul>
      </div>
    </div>
  );
}

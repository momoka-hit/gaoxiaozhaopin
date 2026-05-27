'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'invite' | 'register'>('invite');
  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const verifyInviteCode = async () => {
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { data, error: err } = await supabase
      .from('invite_codes')
      .select('id, used_by, expires_at')
      .eq('code', inviteCode.trim())
      .single();

    if (err || !data) {
      setError('邀请码无效，请检查后重试');
      setLoading(false);
      return;
    }

    if (data.used_by) {
      setError('该邀请码已被使用');
      setLoading(false);
      return;
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      setError('邀请码已过期');
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep('register');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次密码不一致');
      return;
    }
    if (password.length < 6) {
      setError('密码至少6位');
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname: nickname || email.split('@')[0] } },
    });

    if (authErr) {
      setError(authErr.message === 'User already registered'
        ? '该邮箱已注册'
        : '注册失败，请重试'
      );
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError('注册失败');
      setLoading(false);
      return;
    }

    // Mark invite code as used via server API
    const res = await fetch('/api/invite/use', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: inviteCode.trim(), userId: authData.user.id }),
    });

    if (!res.ok) {
      // Don't block registration if marking fails
      console.error('Failed to mark invite code as used');
    }

    // Update profile nickname
    if (nickname) {
      await supabase
        .from('profiles')
        .update({ nickname })
        .eq('id', authData.user.id);
    }

    setLoading(false);
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--primary)]">高校招聘通</h1>
          <p className="text-[var(--muted)] mt-1 text-sm">高校行政辅导员招聘信息平台</p>
        </div>

        {step === 'invite' ? (
          <div className="card space-y-4">
            <h2 className="text-lg font-semibold">输入邀请码</h2>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">邀请码</label>
              <input
                type="text"
                className="input text-center text-lg tracking-widest"
                placeholder="请输入邀请码"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                required
              />
            </div>

            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={verifyInviteCode}
              disabled={loading || !inviteCode.trim()}
            >
              {loading ? '验证中...' : '验证邀请码'}
            </button>

            <p className="text-sm text-center text-[var(--muted)]">
              已有账号？
              <Link href="/login" className="text-[var(--primary)] hover:underline ml-1">
                去登录
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="card space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle size={16} />
              <span className="text-sm font-medium">邀请码验证通过</span>
            </div>

            <h2 className="text-lg font-semibold">设置账号</h2>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">昵称（可选）</label>
              <input
                type="text"
                className="input"
                placeholder="如何称呼您"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">邮箱</label>
              <input
                type="email"
                className="input"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">密码</label>
              <input
                type="password"
                className="input"
                placeholder="至少6位"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">确认密码</label>
              <input
                type="password"
                className="input"
                placeholder="再次输入密码"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? (
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <UserPlus size={16} />
              )}
              {loading ? '注册中...' : '注册'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

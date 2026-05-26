'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (err) {
      setError(err.message === 'Invalid login credentials'
        ? '邮箱或密码错误'
        : err.message === 'Email not confirmed'
        ? '邮箱未验证'
        : '登录失败，请重试'
      );
      setLoading(false);
      return;
    }

    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--primary)]">高校招聘通</h1>
          <p className="text-[var(--muted)] mt-1 text-sm">高校行政辅导员招聘信息平台</p>
        </div>

        <form onSubmit={handleLogin} className="card space-y-4">
          <h2 className="text-lg font-semibold">登录</h2>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">邮箱</label>
            <input
              type="email"
              className="input"
              placeholder="请输入邮箱"
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
              placeholder="请输入密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <LogIn size={16} />
            )}
            {loading ? '登录中...' : '登录'}
          </button>

          <p className="text-sm text-center text-[var(--muted)]">
            还没有账号？
            <Link href="/register" className="text-[var(--primary)] hover:underline ml-1">
              使用邀请码注册
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

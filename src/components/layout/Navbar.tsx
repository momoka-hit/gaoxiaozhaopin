'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Bell, Filter, Home, LogOut, Menu, User, X, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let channel: any;

    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('read', false);
        setUnreadCount(count || 0);

        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', user.id)
          .single();
        if (profile?.email === 'admin@gaoxiaozhaopin.com') {
          setIsAdmin(true);
        }

        channel = supabase
          .channel('notifications')
          .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
            () => setUnreadCount(c => c + 1)
          )
          .subscribe();
      }
    };
    fetchData();

    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navLinks = [
    { href: '/', label: '招聘信息', icon: Home },
    { href: '/notifications', label: '通知', icon: Bell, badge: unreadCount },
    { href: '/profile', label: '筛选设置', icon: Filter },
  ];

  if (isAdmin) {
    navLinks.push({ href: '/admin', label: '管理', icon: Shield });
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[var(--border)]">
      <div className="container-main flex items-center justify-between h-14">
        <Link href="/" className="font-bold text-lg text-[var(--primary)]">
          高校招聘通
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname === link.href
                  ? 'text-[var(--primary)] bg-blue-50'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-gray-50'
              }`}
            >
              <link.icon size={16} />
              {link.label}
              {link.badge && link.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
                  {link.badge > 99 ? '99+' : link.badge}
                </span>
              )}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-gray-50 ml-2"
          >
            <LogOut size={16} />
            退出
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden p-2 rounded-lg hover:bg-gray-50"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-[var(--border)] bg-white">
          <div className="container-main py-2 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm ${
                  pathname === link.href
                    ? 'text-[var(--primary)] bg-blue-50'
                    : 'text-[var(--muted)]'
                }`}
              >
                <link.icon size={16} />
                {link.label}
                {link.badge && link.badge > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-[var(--muted)] w-full"
            >
              <LogOut size={16} />
              退出
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

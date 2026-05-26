'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Bell, CheckCheck, RefreshCw, AlertCircle, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Notification } from '@/lib/types';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
      setLoading(false);
    };

    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const markRead = async (id: string) => {
    const supabase = createClient();
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="container-main py-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell size={18} />
          <h1 className="text-lg font-bold">通知</h1>
          {unreadCount > 0 && (
            <span className="badge text-white text-xs" style={{ background: 'var(--primary)' }}>
              {unreadCount} 条未读
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
            <CheckCheck size={14} />
            全部已读
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw size={24} className="animate-spin text-[var(--muted)]" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Bell size={32} className="text-[var(--muted)]" />
          <p className="text-sm text-[var(--muted)]">暂无通知</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`card flex items-start gap-3 cursor-pointer transition-colors ${
                !n.read ? 'border-[var(--primary)] bg-blue-50/30' : ''
              }`}
              onClick={() => {
                if (!n.read) markRead(n.id);
                if (n.recruitment_id) {
                  window.location.href = `/jobs/${n.recruitment_id}`;
                }
              }}
            >
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                n.read ? 'bg-transparent' : 'bg-[var(--primary)]'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{n.title}</p>
                {n.content && <p className="text-sm text-[var(--muted)] mt-0.5">{n.content}</p>}
                <p className="text-xs text-[var(--muted)] mt-1">{formatDate(n.created_at)}</p>
              </div>
              <ChevronRight size={14} className="text-[var(--muted)] flex-shrink-0 mt-1" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

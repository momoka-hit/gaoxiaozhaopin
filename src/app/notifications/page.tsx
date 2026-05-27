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
    <div className="pb-24">
      {/* Gradient header */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white">
        <div className="container-main py-6 pb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={18} />
              <h1 className="text-lg font-bold">通知</h1>
              {unreadCount > 0 && (
                <span className="bg-white/20 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                  {unreadCount} 条未读
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button className="text-sm text-indigo-200 hover:text-white flex items-center gap-1 transition-colors" onClick={markAllRead}>
                <CheckCheck size={14} />
                全部已读
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container-main -mt-4 relative z-10">
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <RefreshCw size={24} className="animate-spin text-indigo-300" />
            <p className="text-sm text-gray-400 font-medium">加载通知...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 flex flex-col items-center gap-3 text-center">
            <Bell size={36} className="text-gray-300" />
            <p className="text-gray-500 font-medium">暂无通知</p>
            <p className="text-xs text-gray-400">当有新的招聘信息时会在这里通知你</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`bg-white rounded-2xl border p-4 flex items-start gap-3 cursor-pointer transition-all active:scale-[0.99] ${
                  !n.read ? 'border-indigo-300 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  if (!n.read) markRead(n.id);
                  if (n.recruitment_id) {
                    window.location.href = `/jobs/${n.recruitment_id}`;
                  }
                }}
              >
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                  n.read ? 'bg-gray-200' : 'bg-indigo-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.read ? 'font-semibold text-gray-800' : 'font-medium text-gray-600'}`}>{n.title}</p>
                  {n.content && <p className="text-sm text-gray-400 mt-0.5">{n.content}</p>}
                  <p className="text-xs text-gray-400 mt-1">{formatDate(n.created_at)}</p>
                </div>
                <ChevronRight size={15} className="text-gray-300 flex-shrink-0 mt-1" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

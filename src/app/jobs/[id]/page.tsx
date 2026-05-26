'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  ArrowLeft, Building, MapPin, GraduationCap, Clock, Calendar,
  Users, FileText, ExternalLink, ChevronLeft
} from 'lucide-react';
import { formatDate, getDaysUntil } from '@/lib/utils';
import type { Recruitment, University } from '@/lib/types';

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [recruitment, setRecruitment] = useState<(Recruitment & { university?: University }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('recruitments')
      .select('*, university:universities(*)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          router.push('/');
          return;
        }
        setRecruitment(data);
        setLoading(false);

        // Mark as reviewed
        supabase.from('recruitments').update({ is_new: false }).eq('id', id).then(() => {});
      });
  }, [id, router]);

  if (loading || !recruitment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  const daysUntil = getDaysUntil(recruitment.deadline);
  const deadlineClass = daysUntil !== null && daysUntil <= 3 ? 'deadline-urgent' :
    daysUntil !== null && daysUntil <= 7 ? 'deadline-soon' : 'deadline-normal';

  const detailItems = [
    { label: '招聘单位', value: recruitment.university?.name, icon: Building },
    { label: '所在省份', value: recruitment.university?.province, icon: MapPin },
    { label: '办学性质', value: recruitment.university?.nature, icon: Building },
    { label: '院校层次', value: recruitment.university?.level, icon: GraduationCap },
    { label: '学历要求', value: recruitment.education_requirement, icon: GraduationCap },
    { label: '聘用方式', value: recruitment.cooperation_type, icon: FileText },
    { label: '岗位类型', value: recruitment.position_type?.join('、'), icon: Users },
    { label: '发布时间', value: formatDate(recruitment.publish_date), icon: Calendar },
    { label: '截止日期', value: formatDate(recruitment.deadline), icon: Clock },
    { label: '报名人数', value: recruitment.registered_count?.toString(), icon: Users },
    { label: '录取人数', value: recruitment.enrolled_count?.toString(), icon: Users },
    { label: '录取人层次', value: recruitment.enrollee_level, icon: GraduationCap },
    { label: '考查形式', value: recruitment.exam_format, icon: FileText },
  ];

  return (
    <div className="container-main py-4 pb-20">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] mb-4"
      >
        <ChevronLeft size={16} />
        返回
      </button>

      <div className="card space-y-6">
        {/* Title */}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            {recruitment.is_new && (
              <span className="badge text-white" style={{ background: 'var(--primary)' }}>新</span>
            )}
            {recruitment.position_type?.map(pt => (
              <span key={pt} className="badge text-xs" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                {pt}
              </span>
            ))}
          </div>
          <h1 className="text-xl font-bold mt-2">{recruitment.title}</h1>
          {recruitment.university && (
            <p className="text-[var(--muted)] mt-1">
              {recruitment.university.name}
              {recruitment.university.city && ` · ${recruitment.university.city}`}
              {recruitment.university.nature && ` · ${recruitment.university.nature}`}
              {recruitment.university.level && ` · ${recruitment.university.level}`}
            </p>
          )}
        </div>

        {/* Deadline */}
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${deadlineClass}`}>
          {recruitment.deadline ? (
            <>截止日期：{formatDate(recruitment.deadline)}
              {daysUntil !== null && daysUntil >= 0 && `（还有 ${daysUntil} 天）`}
              {daysUntil !== null && daysUntil < 0 && '（已截止）'}
            </>
          ) : '截止日期：未标明'}
        </div>

        {/* Detail grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {detailItems.filter(i => i.value).map(item => (
            <div key={item.label} className="flex items-start gap-2 text-sm">
              <item.icon size={14} className="mt-0.5 text-[var(--muted)] flex-shrink-0" />
              <div>
                <span className="text-[var(--muted)] text-xs">{item.label}</span>
                <p className="font-medium">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Source & Original link */}
        {recruitment.original_url && (
          <a
            href={recruitment.original_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary w-full flex items-center justify-center gap-2"
          >
            <ExternalLink size={14} />
            查看原文公告
          </a>
        )}

        <p className="text-xs text-[var(--muted)] text-center">
          来源：{recruitment.source} | 更新时间：{formatDate(recruitment.updated_at)}
        </p>
      </div>
    </div>
  );
}

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
    <div className="pb-24">
      {/* Loading state */}
      {(loading || !recruitment) && (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
        </div>
      )}

      {!loading && recruitment && (<>
        {/* Gradient header */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white">
          <div className="container-main py-5 pb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-sm text-indigo-200 hover:text-white mb-4 transition-colors"
            >
              <ChevronLeft size={16} />
              返回
            </button>

            <div className="flex items-center gap-2 flex-wrap mb-2">
              {recruitment.is_new && (
                <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">NEW</span>
              )}
              {recruitment.position_type?.map(pt => (
                <span key={pt} className={`tag border ${
                  pt === '辅导员' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  pt === '行政' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                  'bg-gray-50 text-gray-600 border-gray-200'
                }`}>
                  {pt}
                </span>
              ))}
            </div>
            <h1 className="text-xl font-bold leading-snug">{recruitment.title}</h1>
            {recruitment.university && (
              <p className="text-indigo-200 text-sm mt-1.5">
                {recruitment.university.name}
                {recruitment.university.city && ` · ${recruitment.university.city}`}
                {recruitment.university.nature && ` · ${recruitment.university.nature}`}
                {recruitment.university.level && ` · ${recruitment.university.level}`}
              </p>
            )}
          </div>
        </div>

        <div className="container-main -mt-4 relative z-10 space-y-3">
          {/* Deadline badge */}
          <div className={`px-4 py-3 rounded-xl text-sm font-medium ${deadlineClass}`}>
            {recruitment.deadline ? (
              <>截止日期：{formatDate(recruitment.deadline)}
                {daysUntil !== null && daysUntil >= 0 && `（还有 ${daysUntil} 天）`}
                {daysUntil !== null && daysUntil < 0 && '（已截止）'}
              </>
            ) : '截止日期：未标明'}
          </div>

          {/* Detail cards */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-400 mb-4">招聘详情</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {detailItems.filter(i => i.value).map(item => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <item.icon size={15} className="text-indigo-500" />
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">{item.label}</span>
                    <p className="text-sm font-medium text-gray-700">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Source & Original link */}
          {recruitment.original_url && (
            <a
              href={recruitment.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              <ExternalLink size={14} />
              查看原文公告
            </a>
          )}

          <p className="text-xs text-gray-400 text-center pt-2">
            来源：{recruitment.source} | 更新时间：{formatDate(recruitment.updated_at)}
          </p>
        </div>
      </>)}
    </div>
  );
}

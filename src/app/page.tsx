'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  Search, SlidersHorizontal, RefreshCw, Building2, MapPin,
  GraduationCap, AlertCircle, Bell, FilterX, ChevronRight,
  Sparkles, Timer
} from 'lucide-react';
import { formatDate, getDaysUntil, PROVINCES, EDUCATION_LEVELS, UNIVERSITY_TYPES, UNIVERSITY_LEVELS, COOPERATION_TYPES } from '@/lib/utils';
import type { Recruitment, University } from '@/lib/types';

interface Filters {
  provinces: string[];
  education: string[];
  universityTypes: string[];
  universityLevels: string[];
  cooperationTypes: string[];
  positionType: string[];
  search: string;
  sortBy: 'latest' | 'deadline';
}

export default function HomePage() {
  const [recruitments, setRecruitments] = useState<(Recruitment & { university?: University })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filters, setFilters] = useState<Filters>({
    provinces: [],
    education: [],
    universityTypes: [],
    universityLevels: [],
    cooperationTypes: [],
    positionType: [],
    search: '',
    sortBy: 'latest',
  });

  const fetchRecruitments = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from('recruitments')
      .select('*, university:universities(*)')
      .order(filters.sortBy === 'deadline' ? 'deadline' : 'publish_date', { ascending: filters.sortBy === 'deadline', nullsFirst: false });

    if (filters.provinces.length > 0) {
      query = query.in('university.province', filters.provinces);
    }
    if (filters.education.length > 0) {
      const eduConditions = filters.education.map(e => `education_requirement.ilike.%${e}%`);
      query = query.or(eduConditions.join(','));
    }
    if (filters.universityTypes.length > 0) {
      query = query.in('university.nature', filters.universityTypes);
    }
    if (filters.universityLevels.length > 0) {
      query = query.in('university.level', filters.universityLevels);
    }
    if (filters.cooperationTypes.length > 0) {
      query = query.in('cooperation_type', filters.cooperationTypes);
    }
    if (filters.positionType.length > 0) {
      const posConditions = filters.positionType.map(p => `position_type.cs.{${p}}`);
      query = query.or(posConditions.join(','));
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,university.name.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error('Fetch error:', error);
    } else {
      setRecruitments(data || []);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchRecruitments();
    // Fetch unread count
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('notifications').select('*', { count: 'exact', head: true })
          .eq('user_id', user.id).eq('read', false)
          .then(({ count }) => setUnreadCount(count || 0));
      }
    });
  }, [fetchRecruitments]);

  const toggleFilter = (key: keyof Filters, value: string) => {
    setFilters(prev => {
      const arr = prev[key] as string[];
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
      };
    });
  };

  const clearFilters = () => {
    setFilters({
      provinces: [],
      education: [],
      universityTypes: [],
      universityLevels: [],
      cooperationTypes: [],
      positionType: [],
      search: '',
      sortBy: 'latest',
    });
  };

  const hasActiveFilters = Object.entries(filters).some(([key, val]) =>
    key !== 'sortBy' && key !== 'search' && Array.isArray(val) && val.length > 0
  ) || filters.search !== '';

  const activeFilterCount = Object.entries(filters).reduce((count, [key, val]) => {
    if (key !== 'sortBy' && Array.isArray(val)) return count + val.length;
    return count;
  }, 0) + (filters.search ? 1 : 0);

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white">
        <div className="container-main py-6 pb-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <Sparkles size={20} />
                高校招聘通
              </h1>
              <p className="text-indigo-200 text-sm mt-0.5">高校行政辅导员招聘信息聚合</p>
            </div>
            <Link
              href="/notifications"
              className="relative p-2.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full font-bold shadow-lg">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" />
            <input
              type="text"
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/15 text-white placeholder:text-indigo-200/70 text-[15px] border border-white/10 focus:bg-white/20 focus:outline-none focus:border-white/30 transition-all"
              placeholder="搜索高校、岗位名称..."
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div className="container-main -mt-4 relative z-10 space-y-3">
        {/* Action bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm ${
                showFilters
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
              }`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal size={15} />
              筛选
              {activeFilterCount > 0 && (
                <span className="ml-1 bg-indigo-500 text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {hasActiveFilters && (
              <button
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-gray-700 hover:bg-white/80 transition-all"
                onClick={clearFilters}
              >
                <FilterX size={14} />
                清除
              </button>
            )}
            <div className="flex bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <button
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  filters.sortBy === 'latest' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setFilters(prev => ({ ...prev, sortBy: 'latest' }))}
              >
                最新
              </button>
              <button
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  filters.sortBy === 'deadline' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setFilters(prev => ({ ...prev, sortBy: 'deadline' }))}
              >
                截止
              </button>
            </div>
          </div>
          {!loading && (
            <span className="text-xs text-gray-400 font-medium">{recruitments.length} 条</span>
          )}
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-4 animate-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-semibold text-sm text-gray-700">筛选条件</h3>
              {hasActiveFilters && (
                <button className="text-xs text-indigo-500 hover:text-indigo-700 font-medium" onClick={clearFilters}>
                  重置
                </button>
              )}
            </div>

            <FilterSection label="省份">
              {PROVINCES.map(p => (
                <Chip key={p} active={filters.provinces.includes(p)} onClick={() => toggleFilter('provinces', p)}>{p}</Chip>
              ))}
            </FilterSection>

            <FilterSection label="学历">
              {EDUCATION_LEVELS.map(e => (
                <Chip key={e} active={filters.education.includes(e)} onClick={() => toggleFilter('education', e)}>{e}</Chip>
              ))}
            </FilterSection>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FilterSection label="办学性质">
                  {UNIVERSITY_TYPES.map(t => (
                    <Chip key={t} active={filters.universityTypes.includes(t)} onClick={() => toggleFilter('universityTypes', t)}>{t}</Chip>
                  ))}
                </FilterSection>
              </div>
              <div>
                <FilterSection label="院校层次">
                  {UNIVERSITY_LEVELS.map(l => (
                    <Chip key={l} active={filters.universityLevels.includes(l)} onClick={() => toggleFilter('universityLevels', l)}>{l}</Chip>
                  ))}
                </FilterSection>
              </div>
            </div>

            <FilterSection label="聘用方式">
              {COOPERATION_TYPES.map(c => (
                <Chip key={c} active={filters.cooperationTypes.includes(c)} onClick={() => toggleFilter('cooperationTypes', c)}>{c}</Chip>
              ))}
            </FilterSection>

            <FilterSection label="岗位类型">
              {['行政', '辅导员'].map(p => (
                <Chip key={p} active={filters.positionType.includes(p)} onClick={() => toggleFilter('positionType', p)}>{p}</Chip>
              ))}
            </FilterSection>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <RefreshCw size={28} className="animate-spin text-indigo-300" />
            <p className="text-sm text-gray-400 font-medium">加载招聘信息...</p>
          </div>
        ) : recruitments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 flex flex-col items-center gap-3 text-center">
            <AlertCircle size={36} className="text-gray-300" />
            <p className="text-gray-500 font-medium">
              {hasActiveFilters ? '没有符合条件的招聘信息' : '暂无招聘信息'}
            </p>
            <p className="text-xs text-gray-400">
              {hasActiveFilters ? '试试调整筛选条件' : '爬虫正在采集中，请稍后再来看看'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recruitments.map((item, i) => (
              <JobCard key={item.id} recruitment={item} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button className={`chip ${active ? 'chip-active' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}

function JobCard({ recruitment, index }: { recruitment: Recruitment & { university?: University }; index: number }) {
  const daysUntil = getDaysUntil(recruitment.deadline);
  const deadlineClass = daysUntil !== null && daysUntil <= 3 ? 'deadline-urgent' :
    daysUntil !== null && daysUntil <= 7 ? 'deadline-soon' : 'deadline-normal';

  const positionColors: Record<string, string> = {
    '辅导员': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    '行政': 'bg-violet-50 text-violet-700 border-violet-200',
  };

  const coopColors: Record<string, string> = {
    '编制': 'bg-blue-50 text-blue-700 border-blue-200',
    '人事代理': 'bg-amber-50 text-amber-700 border-amber-200',
    '劳务派遣': 'bg-orange-50 text-orange-700 border-orange-200',
    '合同制': 'bg-gray-50 text-gray-600 border-gray-200',
  };

  return (
    <Link
      href={`/jobs/${recruitment.id}`}
      className="block bg-white rounded-2xl border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-md transition-all active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            {recruitment.is_new && (
              <span className="badge bg-indigo-500 text-white text-[10px] px-2 py-0.5">NEW</span>
            )}
            <h3 className="font-semibold text-[15px] leading-snug text-gray-800 line-clamp-2">
              {recruitment.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2.5">
            <Building2 size={14} className="flex-shrink-0" />
            <span className="truncate font-medium text-gray-600">
              {recruitment.university?.name || '未知高校'}
            </span>
            {recruitment.university?.province && (
              <>
                <span className="text-gray-300">·</span>
                <MapPin size={13} className="flex-shrink-0" />
                <span>{recruitment.university.province}</span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {recruitment.position_type?.map(pt => (
              <span key={pt} className={`tag border ${positionColors[pt] || 'bg-gray-50 text-gray-600'}`}>
                {pt}
              </span>
            ))}
            {recruitment.cooperation_type && (
              <span className={`tag border ${coopColors[recruitment.cooperation_type] || ''}`}>
                {recruitment.cooperation_type}
              </span>
            )}
            {recruitment.education_requirement && (
              <span className="tag border bg-gray-50 text-gray-600 border-gray-200">
                <GraduationCap size={11} />
                {recruitment.education_requirement}
              </span>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 text-right">
          <div className={deadlineClass}>
            <Timer size={11} className="inline mr-0.5" />
            {recruitment.deadline ? (
              <>{daysUntil !== null && daysUntil >= 0 ? `${daysUntil}天` : '已截止'}</>
            ) : '待定'}
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">
            {formatDate(recruitment.publish_date)}
          </p>
        </div>
      </div>
    </Link>
  );
}

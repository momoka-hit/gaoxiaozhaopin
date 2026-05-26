'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  Search, Filter, RefreshCw, Building, MapPin, GraduationCap,
  AlertCircle
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
    <div className="container-main py-4 space-y-4 pb-20">
      {/* Search bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text"
            className="input pl-9"
            placeholder="搜索高校、岗位..."
            value={filters.search}
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
        <button
          className={`btn btn-secondary relative ${hasActiveFilters ? 'text-[var(--primary)] border-[var(--primary)]' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
          筛选
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-[var(--primary)] text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">筛选条件</h3>
            {hasActiveFilters && (
              <button className="text-xs text-[var(--primary)] hover:underline" onClick={clearFilters}>
                清除全部
              </button>
            )}
          </div>

          <FilterSection label="省份">
            {PROVINCES.map(p => (
              <Chip key={p} active={filters.provinces.includes(p)} onClick={() => toggleFilter('provinces', p)}>{p}</Chip>
            ))}
          </FilterSection>

          <FilterSection label="学历要求">
            {EDUCATION_LEVELS.map(e => (
              <Chip key={e} active={filters.education.includes(e)} onClick={() => toggleFilter('education', e)}>{e}</Chip>
            ))}
          </FilterSection>

          <FilterSection label="办学性质">
            {UNIVERSITY_TYPES.map(t => (
              <Chip key={t} active={filters.universityTypes.includes(t)} onClick={() => toggleFilter('universityTypes', t)}>{t}</Chip>
            ))}
          </FilterSection>

          <FilterSection label="院校层次">
            {UNIVERSITY_LEVELS.map(l => (
              <Chip key={l} active={filters.universityLevels.includes(l)} onClick={() => toggleFilter('universityLevels', l)}>{l}</Chip>
            ))}
          </FilterSection>

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

          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--muted)]">排序：</span>
            <button
              className={`chip ${filters.sortBy === 'latest' ? 'chip-active' : ''}`}
              onClick={() => setFilters(prev => ({ ...prev, sortBy: 'latest' }))}
            >
              最新发布
            </button>
            <button
              className={`chip ${filters.sortBy === 'deadline' ? 'chip-active' : ''}`}
              onClick={() => setFilters(prev => ({ ...prev, sortBy: 'deadline' }))}
            >
              截止日期
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw size={24} className="animate-spin text-[var(--muted)]" />
          <p className="text-sm text-[var(--muted)]">加载中...</p>
        </div>
      ) : recruitments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertCircle size={24} className="text-[var(--muted)]" />
          <p className="text-sm text-[var(--muted)]">
            {hasActiveFilters ? '没有符合条件的招聘信息，试试调整筛选条件' : '暂无招聘信息'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted)]">共 {recruitments.length} 条招聘信息</p>
          {recruitments.map(item => (
            <JobCard key={item.id} recruitment={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-[var(--muted)] mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
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

function JobCard({ recruitment }: { recruitment: Recruitment & { university?: University } }) {
  const daysUntil = getDaysUntil(recruitment.deadline);
  const deadlineClass = daysUntil !== null && daysUntil <= 3 ? 'deadline-urgent' :
    daysUntil !== null && daysUntil <= 7 ? 'deadline-soon' : '';

  return (
    <Link
      href={`/jobs/${recruitment.id}`}
      className="card block hover:border-[var(--primary)] hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {recruitment.is_new && (
              <span className="badge text-white" style={{ background: 'var(--primary)' }}>新</span>
            )}
            <h3 className="font-medium text-base truncate">{recruitment.title}</h3>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm text-[var(--muted)]">
            <span className="flex items-center gap-1">
              <Building size={14} />
              {recruitment.university?.name || '未知高校'}
            </span>
            {recruitment.university?.province && (
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {recruitment.university.province}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {recruitment.cooperation_type && (
              <span className="badge text-xs" style={{ background: '#eff6ff', color: '#2563eb' }}>
                {recruitment.cooperation_type}
              </span>
            )}
            {recruitment.education_requirement && (
              <span className="badge text-xs" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                <GraduationCap size={10} className="mr-0.5" />
                {recruitment.education_requirement}
              </span>
            )}
            {recruitment.position_type?.map(pt => (
              <span key={pt} className="badge text-xs" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                {pt}
              </span>
            ))}
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className={`text-xs px-2 py-1 rounded-full font-medium ${deadlineClass || 'deadline-normal'}`}>
            {recruitment.deadline ? (
              <>截止 {formatDate(recruitment.deadline)}{daysUntil !== null && daysUntil >= 0 && ` (${daysUntil}天)`}</>
            ) : '无截止日期'}
          </div>
          <p className="text-xs text-[var(--muted)] mt-1">
            发布 {formatDate(recruitment.publish_date)}
          </p>
        </div>
      </div>
    </Link>
  );
}

export type UniversityNature = '公办' | '民办';
export type UniversityLevel = '本科' | '专科' | '高职';
export type CooperationType = '编制' | '人事代理' | '劳务派遣' | '合同制' | '未标明' | '其他';
export type PositionType = '行政' | '辅导员';
export type NotificationType = 'new_post' | 'deadline_reminder' | 'update';
export type CrawlSourceType = 'university_website' | 'province_hr' | 'aggregator';

export interface University {
  id: string;
  name: string;
  province: string;
  city: string | null;
  nature: UniversityNature | null;
  level: UniversityLevel | null;
  website: string | null;
  active: boolean;
  created_at: string;
}

export interface Recruitment {
  id: string;
  university_id: string;
  university?: University;
  title: string;
  original_url: string | null;
  source: string;
  source_url: string | null;
  position_type: PositionType[];
  education_requirement: string | null;
  cooperation_type: CooperationType | null;
  publish_date: string | null;
  deadline: string | null;
  exam_format: string | null;
  registered_count: number | null;
  enrolled_count: number | null;
  enrollee_level: string | null;
  is_new: boolean;
  notified: boolean;
  reviewed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  nickname: string | null;
  phone: string | null;
  created_at: string;
}

export interface InviteCode {
  id: string;
  code: string;
  used_by: string | null;
  used_at: string | null;
  created_by: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  recruitment_id: string | null;
  title: string;
  content: string | null;
  type: NotificationType;
  read: boolean;
  created_at: string;
  recruitment?: Recruitment;
}

export interface UserFilters {
  id: string;
  user_id: string;
  provinces: string[];
  education: string[];
  university_types: string[];
  university_levels: string[];
  cooperation_types: string[];
  notify_email: boolean;
  notify_in_app: boolean;
  created_at: string;
  updated_at: string;
}

export interface CrawlSource {
  id: string;
  name: string;
  url: string;
  type: CrawlSourceType;
  province: string | null;
  active: boolean;
  last_crawled_at: string | null;
  created_at: string;
}

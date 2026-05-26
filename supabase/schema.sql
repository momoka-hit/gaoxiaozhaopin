-- 高校招聘信息平台 数据库 Schema

-- 高校表
CREATE TABLE universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  province TEXT NOT NULL,
  city TEXT,
  nature TEXT CHECK (nature IN ('公办', '民办')),
  level TEXT CHECK (level IN ('本科', '专科', '高职')),
  website TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 招聘岗位表
CREATE TABLE recruitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES universities(id),
  title TEXT NOT NULL,
  original_url TEXT UNIQUE,
  source TEXT NOT NULL,
  source_url TEXT,

  -- 岗位类型
  position_type TEXT[],

  -- 要求
  education_requirement TEXT,
  cooperation_type TEXT CHECK (cooperation_type IN ('编制', '人事代理', '劳务派遣', '合同制', '未标明', '其他')),

  -- 时间
  publish_date DATE,
  deadline DATE,

  -- 详情（多渠道补充）
  exam_format TEXT,
  registered_count INTEGER,
  enrolled_count INTEGER,
  enrollee_level TEXT,

  -- 状态
  is_new BOOLEAN DEFAULT true,
  notified BOOLEAN DEFAULT false,
  reviewed BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 爬虫来源表
CREATE TABLE crawl_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT CHECK (type IN ('university_website', 'province_hr', 'aggregator')),
  province TEXT,
  active BOOLEAN DEFAULT true,
  last_crawled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户扩展表
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nickname TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 邀请码表
CREATE TABLE invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- 通知表
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recruitment_id UUID REFERENCES recruitments(id),
  title TEXT NOT NULL,
  content TEXT,
  type TEXT CHECK (type IN ('new_post', 'deadline_reminder', 'update')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户筛选偏好表
CREATE TABLE user_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  provinces TEXT[] DEFAULT '{}',
  education TEXT[] DEFAULT '{}',
  university_types TEXT[] DEFAULT '{}',
  university_levels TEXT[] DEFAULT '{}',
  cooperation_types TEXT[] DEFAULT '{}',
  notify_email BOOLEAN DEFAULT true,
  notify_in_app BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_recruitments_university_id ON recruitments(university_id);
CREATE INDEX idx_recruitments_publish_date ON recruitments(publish_date DESC);
CREATE INDEX idx_recruitments_deadline ON recruitments(deadline);
CREATE INDEX idx_recruitments_cooperation_type ON recruitments(cooperation_type);
CREATE INDEX idx_recruitments_is_new ON recruitments(is_new);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_universities_province ON universities(province);

-- 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recruitments_updated_at
  BEFORE UPDATE ON recruitments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_filters_updated_at
  BEFORE UPDATE ON user_filters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 新用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  INSERT INTO public.user_filters (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Row Level Security
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_filters ENABLE ROW LEVEL SECURITY;

-- 所有已认证用户可以查看招聘信息
CREATE POLICY "Users can view universities"
  ON universities FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view recruitments"
  ON recruitments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view their filters"
  ON user_filters FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their filters"
  ON user_filters FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- 插入初始爬虫来源
INSERT INTO crawl_sources (name, url, type, province) VALUES
-- 陕西省
('陕西高校人才网', 'https://www.sxgxrc.com/', 'aggregator', '陕西'),
('陕西省人社厅', 'https://rst.shaanxi.gov.cn/', 'province_hr', '陕西'),
-- 四川省
('四川高校人才网', 'https://www.scgxrc.com/', 'aggregator', '四川'),
('四川省人社厅', 'https://rst.sc.gov.cn/', 'province_hr', '四川'),
-- 甘肃
('甘肃省人社厅', 'https://rst.gansu.gov.cn/', 'province_hr', '甘肃'),
-- 河南
('河南省人社厅', 'https://hrss.henan.gov.cn/', 'province_hr', '河南'),
-- 山西
('山西省人社厅', 'https://rst.shanxi.gov.cn/', 'province_hr', '山西'),
-- 湖北
('湖北省人社厅', 'https://rst.hubei.gov.cn/', 'province_hr', '湖北'),
-- 重庆
('重庆市人社局', 'https://rlsbj.cq.gov.cn/', 'province_hr', '重庆'),
-- 聚合平台
('高校人才网', 'https://www.gaoxiaojob.com/', 'aggregator', null),
('硕博招聘在线', 'https://www.gxzpw.org/', 'aggregator', null);

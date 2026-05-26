import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export interface RawRecruitment {
  title: string;
  original_url: string;
  source: string;
  source_url: string;
  position_type: string[];
  education_requirement?: string;
  cooperation_type?: string;
  publish_date?: string;
  deadline?: string;
  university_name?: string;
  university_province?: string;
  exam_format?: string;
  registered_count?: number;
  enrolled_count?: number;
  enrollee_level?: string;
}

export async function upsertRecruitment(item: RawRecruitment) {
  // Find or create university
  let universityId: string | null = null;
  if (item.university_name) {
    const { data: existing } = await supabase
      .from('universities')
      .select('id')
      .eq('name', item.university_name)
      .maybeSingle();

    if (existing) {
      universityId = existing.id;
    } else {
      const { data: newUni } = await supabase
        .from('universities')
        .insert({
          name: item.university_name,
          province: item.university_province || '未知',
          active: true,
        })
        .select('id')
        .single();
      if (newUni) universityId = newUni.id;
    }
  }

  // Check if already exists by URL
  const { data: existing } = await supabase
    .from('recruitments')
    .select('id, notified')
    .eq('original_url', item.original_url)
    .maybeSingle();

  if (existing) {
    // Update supplementary info (don't overwrite existing values with null)
    const updateData: Record<string, any> = {};
    if (item.education_requirement) updateData.education_requirement = item.education_requirement;
    if (item.cooperation_type) updateData.cooperation_type = item.cooperation_type;
    if (item.exam_format) updateData.exam_format = item.exam_format;
    if (item.registered_count) updateData.registered_count = item.registered_count;
    if (item.enrolled_count) updateData.enrolled_count = item.enrolled_count;
    if (item.enrollee_level) updateData.enrollee_level = item.enrollee_level;
    if (item.position_type.length > 0) updateData.position_type = item.position_type;

    if (Object.keys(updateData).length > 0) {
      await supabase.from('recruitments').update(updateData).eq('id', existing.id);
    }
    return { isNew: false, id: existing.id };
  }

  // Insert new
  const { data: inserted } = await supabase
    .from('recruitments')
    .insert({
      university_id: universityId,
      title: item.title,
      original_url: item.original_url,
      source: item.source,
      source_url: item.source_url,
      position_type: item.position_type,
      education_requirement: item.education_requirement || null,
      cooperation_type: item.cooperation_type || null,
      publish_date: item.publish_date || null,
      deadline: item.deadline || null,
      exam_format: item.exam_format || null,
      registered_count: item.registered_count || null,
      enrolled_count: item.enrolled_count || null,
      enrollee_level: item.enrollee_level || null,
      is_new: true,
      notified: false,
    })
    .select('id')
    .single();

  return { isNew: true, id: inserted?.id || null };
}

export async function sendNotifications(recruitmentId: string, title: string) {
  // Get all users who have email notifications enabled (we'll just create in-app notifications for all users)
  const { data: users } = await supabase
    .from('user_filters')
    .select('user_id, notify_in_app, notify_email');

  if (!users) return;

  const notifications = users.map(u => ({
    user_id: u.user_id,
    recruitment_id: recruitmentId,
    title: `新岗位发布：${title}`,
    content: '有新的招聘信息，点击查看详情',
    type: 'new_post' as const,
  }));

  if (notifications.length > 0) {
    await supabase.from('notifications').insert(notifications);
  }
}

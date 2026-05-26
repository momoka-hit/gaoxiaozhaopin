import { supabase } from './supabase';

interface EnvConfig {
  resendApiKey?: string;
  fromEmail?: string;
  appUrl?: string;
}

async function getConfig(): Promise<EnvConfig> {
  return {
    resendApiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.NOTIFICATION_EMAIL_FROM || 'noreply@gaoxiaozhaopin.com',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://gaoxiaozhaopin.vercel.app',
  };
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  config: EnvConfig
): Promise<boolean> {
  if (!config.resendApiKey) {
    console.log(`  [Email disabled - no RESEND_API_KEY] Would send to ${to}: ${subject}`);
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.fromEmail,
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`  Failed to send email: ${err}`);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error(`  Email error: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('=== Email Notification Service ===');
  const config = await getConfig();

  // Get un-notified recruitments
  const { data: newPosts, error } = await supabase
    .from('recruitments')
    .select('id, title, original_url, source, university:universities(name, province)')
    .eq('notified', false)
    .limit(20);

  if (error || !newPosts || newPosts.length === 0) {
    console.log('No new posts to notify about');
    return;
  }

  console.log(`Found ${newPosts.length} un-notified posts`);

  // Get all users who want email notifications
  const { data: users } = await supabase
    .from('user_filters')
    .select('user_id, notify_email')
    .eq('notify_email', true);

  if (!users || users.length === 0) {
    console.log('No users subscribed to email notifications');
    // Still mark as notified so they don't pile up
    const ids = newPosts.map(p => p.id);
    await supabase.from('recruitments').update({ notified: true }).in('id', ids);
    return;
  }

  console.log(`Notifying ${users.length} users`);

  let emailCount = 0;
  for (const userPref of users) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, nickname')
      .eq('id', userPref.user_id)
      .single();

    if (!profile?.email) continue;

    const name = profile.nickname || profile.email.split('@')[0];

    const itemsHtml = newPosts.map(p => {
      const uniName = (p as any).university?.name || '';
      const province = (p as any).university?.province || '';
      return `
        <tr>
          <td style="padding:12px;border-bottom:1px solid #eee;">
            <a href="${config.appUrl}/jobs/${p.id}" style="color:#2563eb;text-decoration:none;font-weight:500;">
              ${p.title}
            </a>
            <div style="color:#64748b;font-size:13px;margin-top:4px;">
              ${uniName} ${province} · 来源：${p.source}
            </div>
          </td>
        </tr>`;
    }).join('');

    const html = `
      <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
        <div style="background:#2563eb;padding:24px;border-radius:12px 12px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">高校招聘通</h1>
        </div>
        <div style="background:white;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px;">
          <p style="color:#0f172a;font-size:15px;">Hi ${name}，</p>
          <p style="color:#64748b;font-size:14px;">有 ${newPosts.length} 条新的招聘信息：</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            ${itemsHtml}
          </table>
          <a href="${config.appUrl}"
             style="display:inline-block;background:#2563eb;color:white;padding:10px 24px;
                    border-radius:8px;text-decoration:none;font-size:14px;margin-top:8px;">
            查看全部
          </a>
          <p style="color:#94a3b8;font-size:12px;margin-top:16px;">
            此邮件由系统自动发送，如需退订请在个人设置中关闭邮件通知
          </p>
        </div>
      </div>`;

    const sent = await sendEmail(
      profile.email,
      `【高校招聘通】${newPosts.length} 条新招聘信息`,
      html,
      config
    );

    if (sent) emailCount++;
  }

  // Mark as notified
  const ids = newPosts.map(p => p.id);
  await supabase.from('recruitments').update({ notified: true }).in('id', ids);

  console.log(`Emails sent: ${emailCount}/${users.length}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

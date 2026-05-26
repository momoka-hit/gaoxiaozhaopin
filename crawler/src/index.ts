import { sources } from './sources';
import { upsertRecruitment, sendNotifications } from './supabase';

async function main() {
  console.log('=== GaoXiaoZhaoPin Crawler ===');
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log(`Sources to crawl: ${sources.map(s => s.name).join(', ')}`);
  console.log('');

  let totalNew = 0;
  let totalUpdated = 0;

  for (const source of sources) {
    console.log(`[${source.name}] Starting crawl...`);
    try {
      const items = await source.crawl();
      console.log(`[${source.name}] Found ${items.length} items`);

      for (const item of items) {
        const { isNew, id } = await upsertRecruitment(item);
        if (isNew) {
          totalNew++;
          if (id) {
            // Send notifications for new posts
            await sendNotifications(id, item.title);
          }
        } else {
          totalUpdated++;
        }
      }

      console.log(`[${source.name}] Done: ${items.length} processed`);
    } catch (err: any) {
      console.error(`[${source.name}] Failed: ${err.message}`);
    }
    console.log('');
  }

  console.log('=== Crawl Complete ===');
  console.log(`New: ${totalNew}`);
  console.log(`Updated: ${totalUpdated}`);
  console.log(`Ended at: ${new Date().toISOString()}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

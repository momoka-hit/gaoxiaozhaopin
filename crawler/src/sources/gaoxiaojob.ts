import axios from 'axios';
import * as cheerio from 'cheerio';
import { CrawlSource } from './index';
import { RawRecruitment } from '../supabase';
import { decodeBody } from './encoding';

const BASE_URL = 'https://www.gaoxiaojob.com';
const TIMEOUT = 30000;

async function crawlListings(): Promise<RawRecruitment[]> {
  const results: RawRecruitment[] = [];

  // Categories: 辅导员招聘, 行政管理岗
  const categories = [
    { path: '/zhaopin/fudaoyuan/', type: ['辅导员'] as string[] },
    { path: '/zhaopin/xingzheng/', type: ['行政'] as string[] },
  ];

  for (const cat of categories) {
    try {
      console.log(`Crawling: ${BASE_URL}${cat.path}`);
      const resp = await axios.get(`${BASE_URL}${cat.path}`, {
        timeout: TIMEOUT,
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'zh-CN,zh;q=0.9',
        },
      });

      const ct = resp.headers['content-type'];
      const html = decodeBody(resp.data, typeof ct === 'string' ? ct : undefined);
      const $ = cheerio.load(html);

      // Try multiple possible listing selectors
      const items = $([
        '.job-list li', '.recruit-list li', '.article-list li',
        '.list-item', '.post-item', 'table tr',
        '[class*="list"] li', '[class*="job"] li',
      ].join(','));

      items.each((_, el) => {
        const linkEl = $(el).find('a').first();
        const title = linkEl.text().trim();
        const href = linkEl.attr('href');

        if (!title || !href || title.length < 5) return;

        const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href.startsWith('/') ? '' : '/'}${href}`;
        const dateText = $(el).find('.date, .time, .time').first().text().trim();
        const content = $(el).text().trim();

        // Detect university name
        const uniMatch = title.match(/(.{2,20}(?:大学|学院|学校|研究院|所))/);
        const universityName = uniMatch ? uniMatch[1] : null;

        // Detect province
        const provinceMatch = content.match(/(陕西|四川|甘肃|河南|山西|湖北|重庆|宁夏|青海|北京|上海|广东|浙江|江苏|山东)/);
        const province = provinceMatch ? provinceMatch[1] : null;

        // Detect education requirement
        const eduMatch = content.match(/(博士|硕士|本科|大专)/);
        const education = eduMatch ? eduMatch[1] : null;

        // Detect cooperation type
        const coopMatch = content.match(/(编制|人事代理|劳务派遣|合同制)/);
        const cooperationType = coopMatch ? coopMatch[1] : null;

        // Detect deadline
        const deadlineMatch = content.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})/g);
        const deadline = deadlineMatch ? deadlineMatch[deadlineMatch.length - 1] : undefined;

        // Detect position type from category
        const positionType = [...cat.type];
        if (content.includes('辅导员') && !positionType.includes('辅导员')) positionType.push('辅导员');
        if ((content.includes('行政') || content.includes('管理')) && !positionType.includes('行政')) positionType.push('行政');

        // Detect exam format
        const examMatch = content.match(/(笔试|面试|笔试.*面试|试讲|答辩)/);
        const examFormat = examMatch ? examMatch[1] : undefined;

        // Parse date
        let publishDate: string | undefined;
        if (dateText) {
          const dMatch = dateText.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})/);
          if (dMatch) publishDate = dMatch[1];
        }

        results.push({
          title,
          original_url: fullUrl,
          source: '高校人才网',
          source_url: `${BASE_URL}${cat.path}`,
          position_type: positionType,
          education_requirement: education || undefined,
          cooperation_type: cooperationType || undefined,
          publish_date: publishDate,
          deadline: deadline,
          university_name: universityName || undefined,
          university_province: province || undefined,
          exam_format: examFormat,
        });
      });

      console.log(`  Found ${items.length} items on ${cat.path}`);
    } catch (err: any) {
      console.error(`  Error crawling ${cat.path}: ${err.message}`);
    }
  }

  return results;
}

export const gaoxiaojobScraper: CrawlSource = {
  name: '高校人才网',
  crawl: crawlListings,
};

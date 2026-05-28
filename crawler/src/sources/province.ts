import axios from 'axios';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import { CrawlSource, HR_URLS } from './index';
import { RawRecruitment } from '../supabase';
import { detectEncoding, decodeBody } from './encoding';

const TIMEOUT = 30000;

async function crawlProvinceSites(): Promise<RawRecruitment[]> {
  const results: RawRecruitment[] = [];

  for (const [province, sites] of Object.entries(HR_URLS)) {
    for (const site of sites) {
      try {
        console.log(`Crawling: ${site.name} (${site.url})`);
        const resp = await axios.get(site.url, {
          timeout: TIMEOUT,
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'zh-CN,zh;q=0.9',
          },
        });

        const html = decodeBody(resp.data, resp.headers['content-type']);
        const $ = cheerio.load(html);
        const items = $([
          '.news-list li', '.list li', '.article-list li',
          '.tr_main tr', 'ul li', 'table tr',
          '[class*="list"] li', '[class*="news"] li',
        ].join(','));

        let count = 0;
        items.each((_, el) => {
          const linkEl = $(el).find('a').first();
          const title = linkEl.text().trim();
          const href = linkEl.attr('href');

          if (!title || !href || title.length < 5) return;
          if (title.includes('首页') || title.includes('下一页') || title.includes('>>')) return;

          // Only keep titles related to recruitment
          const keywords = ['招聘', '聘用', '引进', '人才', '选聘', '招录', '录用', '公招', '考核'];
          const hasKeyword = keywords.some(k => title.includes(k));
          if (!hasKeyword && !title.includes('大学') && !title.includes('学院') && !title.includes('辅导员')) {
            return;
          }

          const fullUrl = href.startsWith('http') ? href : new URL(href, site.url).href;
          const dateText = $(el).find('.date, .time, span:last-child').last().text().trim();

          // Extract info from title
          const uniMatch = title.match(/(.{2,20}(?:大学|学院|学校|研究院|所))/);
          const universityName = uniMatch ? uniMatch[1] : null;

          const eduMatch = title.match(/(博士|硕士|本科|大专)/);
          const education = eduMatch ? eduMatch[1] : null;

          const coopMatch = title.match(/(编制|人事代理|劳务派遣|合同制)/);
          const cooperationType = coopMatch ? coopMatch[1] : null;

          const positionType: string[] = [];
          if (title.includes('辅导员') || title.includes('学生工作') || title.includes('思政')) {
            positionType.push('辅导员');
          }
          if (title.includes('行政') || title.includes('管理') || title.includes('职员') || title.includes('党政')) {
            positionType.push('行政');
          }
          if (positionType.length === 0) {
            positionType.push('行政'); // Default for university recruitment
          }

          const deadlineMatch = title.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})/);
          const deadline = deadlineMatch ? deadlineMatch[1] : undefined;

          let publishDate: string | undefined;
          if (dateText) {
            const dMatch = dateText.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})/);
            if (dMatch) publishDate = dMatch[1];
          }

          results.push({
            title,
            original_url: fullUrl,
            source: site.name,
            source_url: site.url,
            position_type: positionType,
            education_requirement: education || undefined,
            cooperation_type: cooperationType || undefined,
            publish_date: publishDate,
            deadline: deadline,
            university_name: universityName || undefined,
            university_province: province,
          });

          count++;
        });

        console.log(`  Found ${count} relevant items on ${site.name}`);
      } catch (err: any) {
        console.error(`  Error crawling ${site.name}: ${err.message}`);
      }
    }
  }

  return results;
}

export const provinceHrScraper: CrawlSource = {
  name: '各省人社厅',
  crawl: crawlProvinceSites,
};

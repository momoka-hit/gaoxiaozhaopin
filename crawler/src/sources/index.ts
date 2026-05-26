import { RawRecruitment } from '../supabase';

export interface CrawlSource {
  name: string;
  crawl: () => Promise<RawRecruitment[]>;
}

import { gaoxiaojobScraper } from './gaoxiaojob';
import { provinceHrScraper } from './province';

export const sources: CrawlSource[] = [
  gaoxiaojobScraper,
  provinceHrScraper,
];

// Source URLs by province
export const HR_URLS: Record<string, { name: string; url: string }[]> = {
  '陕西': [
    { name: '陕西省人社厅', url: 'https://rst.shaanxi.gov.cn/newstyle/sy/tzgg/' },
  ],
  '四川': [
    { name: '四川省人社厅', url: 'https://rst.sc.gov.cn/rst/tzgg/' },
  ],
  '甘肃': [
    { name: '甘肃省人社厅', url: 'https://rst.gansu.gov.cn/rst/tzgg/' },
  ],
  '河南': [
    { name: '河南省人社厅', url: 'https://hrss.henan.gov.cn/tzgg/' },
  ],
  '山西': [
    { name: '山西省人社厅', url: 'https://rst.shanxi.gov.cn/zwyw/tzgg/' },
  ],
  '湖北': [
    { name: '湖北省人社厅', url: 'https://rst.hubei.gov.cn/bmdt/tzgg/' },
  ],
  '重庆': [
    { name: '重庆市人社局', url: 'https://rlsbj.cq.gov.cn/zwxx/tzgg/' },
  ],
};

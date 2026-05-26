import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | null): string {
  if (!date) return '待定';
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function isDeadlinePassed(date: string | null): boolean {
  if (!date) return false;
  return new Date(date) < new Date();
}

export function getDaysUntil(date: string | null): number | null {
  if (!date) return null;
  const diff = new Date(date).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export const PROVINCES = ['陕西', '四川', '甘肃', '河南', '山西', '湖北', '重庆', '宁夏', '青海'];
export const EDUCATION_LEVELS = ['博士', '硕士', '本科', '大专'];
export const UNIVERSITY_TYPES = ['公办', '民办'];
export const UNIVERSITY_LEVELS = ['本科', '专科', '高职'];
export const COOPERATION_TYPES = ['编制', '人事代理', '劳务派遣', '合同制'];

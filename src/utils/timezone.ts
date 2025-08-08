/**
 * 时区处理工具
 * 处理应用中的时间转换和本地时区操作
 */

/**
 * 获取当前本地时间（UTC+8）的 ISO 字符串
 * 用于数据库存储
 */
export function getCurrentLocalTime(): string {
  const now = new Date();
  // 直接使用 UTC 时间，避免时区转换问题
  return now.toISOString();
}

/**
 * 获取指定天数后的本地时间
 * @param days 天数
 * @returns ISO 时间字符串
 */
export function getLocalTimeAfterDays(days: number): string {
  const now = new Date();
  now.setDate(now.getDate() + days);
  return now.toISOString();
}

/**
 * 转换 UTC 时间为本地显示时间
 * @param utcTimeString UTC 时间字符串
 * @returns 本地时间的 Date 对象
 */
export function convertUTCToLocal(utcTimeString: string): Date {
  const utcDate = new Date(utcTimeString);
  const utc8Offset = 8 * 60;
  return new Date(utcDate.getTime() + utc8Offset * 60000);
}

/**
 * 检查日期是否是今天（本地时区）
 * @param dateString 日期字符串
 * @returns 是否是今天
 */
export function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  const utc8Offset = 8 * 60;
  
  const localDate = new Date(date.getTime() + (utc8Offset + today.getTimezoneOffset()) * 60000);
  const localToday = new Date(today.getTime() + (utc8Offset + today.getTimezoneOffset()) * 60000);
  
  return localDate.toDateString() === localToday.toDateString();
}

/**
 * 格式化时间为本地显示格式
 * @param dateString 时间字符串
 * @param options 格式化选项
 * @returns 格式化后的时间字符串
 */
export function formatLocalTime(
  dateString: string, 
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }
): string {
  const localDate = convertUTCToLocal(dateString);
  return localDate.toLocaleString('zh-CN', options);
}

/**
 * 获取今天开始时间的 ISO 字符串（本地时区）
 * @returns 今天 00:00:00 的 ISO 字符串
 */
export function getTodayStartTime(): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

/**
 * 获取今天结束时间的 ISO 字符串（本地时区）
 * @returns 今天 23:59:59 的 ISO 字符串
 */
export function getTodayEndTime(): string {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  return now.toISOString();
}
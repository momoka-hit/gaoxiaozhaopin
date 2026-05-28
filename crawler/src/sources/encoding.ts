import iconv from 'iconv-lite';

export function detectEncoding(htmlBuffer: Buffer, contentType: string | undefined): string {
  // 1. Check Content-Type header
  if (contentType) {
    const match = contentType.match(/charset\s*=\s*([^\s;]+)/i);
    if (match) return match[1].toLowerCase();
  }
  // 2. Check HTML meta charset
  const ascii = htmlBuffer.toString('ascii');
  const metaMatch = ascii.match(/<meta[^>]+charset\s*=\s*["']?\s*([^\s"';>]+)/i);
  if (metaMatch) return metaMatch[1].toLowerCase();
  // 3. Default to UTF-8
  return 'utf-8';
}

export function decodeBody(data: any, contentType: string | undefined): string {
  // Convert ArrayBuffer to Buffer if needed
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const encoding = detectEncoding(buffer, contentType);
  const normalized = encoding.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  // Only transcode if it's explicitly a Chinese encoding
  const chineseEncodings = ['gbk', 'gb2312', 'gb18030', 'big5', 'big5hkscs', 'euc-cn'];
  if (chineseEncodings.includes(normalized)) {
    try {
      return iconv.decode(buffer, normalized);
    } catch {
      // fallback
    }
  }

  // For unknown/utf-8, try UTF-8 first
  const utf8 = buffer.toString('utf-8');
  // Check if it looks like valid Chinese (presence of CJK characters)
  if (/[一-鿿]/.test(utf8)) return utf8;

  // No CJK found - might be GBK misidentified. Try GBK.
  if (!/^utf-?8$/.test(normalized)) {
    try {
      const gbk = iconv.decode(buffer, 'gbk');
      if (/[一-鿿]/.test(gbk)) return gbk;
    } catch {
      // ignore
    }
  }

  // Last resort: try GBK for all Chinese-hosted content
  try {
    const gbkFallback = iconv.decode(buffer, 'gbk');
    if (gbkFallback.includes('�')) return utf8; // GBK produced garbage
    return gbkFallback;
  } catch {
    return utf8;
  }
}

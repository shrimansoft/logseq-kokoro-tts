export function cleanLogseqText(input: string): string {
  return input
    .replace(/\[\[(.*?)\]\]/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/^\s*\w+::.*$/gm, '')
    .replace(/#[\w-]+/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/{{/g, '')
    .replace(/}}/g, '')
    .trim();
}

export function truncateText(text: string, maxLength: number = 5000): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

import { TtsSettings } from './types';

export const DEFAULT_SETTINGS: TtsSettings = {
  serverUrl: 'http://localhost:8880',
  voice: 'af_bella',
  speed: 1.0,
  responseFormat: 'wav',
  cleanText: true,
  showStatus: true,
};

export function getSettings(): TtsSettings {
  const stored = logseq.storage?.getItem?.('settings');
  if (stored) {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }
  return { ...DEFAULT_SETTINGS };
}

export async function saveSettings(settings: TtsSettings): Promise<void> {
  if (logseq.storage?.setItem) {
    await logseq.storage.setItem('settings', JSON.stringify(settings));
  }
}

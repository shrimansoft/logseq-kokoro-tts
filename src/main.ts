import { DEFAULT_SETTINGS, getSettings, saveSettings } from './settings';
import { getBlockByUuid, getSelectedBlocks } from './logseq-db';
import { cleanLogseqText, truncateText } from './text';
import { generateSpeech, formatTtsError } from './tts';
import { playAudioBlob, stopAudio, replayLastAudio, releaseAudio } from './audio';
import { TtsSettings } from './types';

let settings: TtsSettings = { ...DEFAULT_SETTINGS };

function debugLog(message: string, details?: unknown): void {
  console.log('[Kokoro TTS Local]', message, details ?? '');
}

function showStatus(msg: string): void {
  if (settings.showStatus) {
    logseq.UI?.showMsg?.(msg, 'success');
  }
}

function showError(msg: string): void {
  logseq.UI?.showMsg?.(msg, 'error');
}

async function speakText(text: string, blockCount: number): Promise<void> {
  const cleanedText = settings.cleanText ? cleanLogseqText(text) : text;

  if (!cleanedText.trim()) {
    showError('No readable text found.');
    return;
  }

  const truncated = truncateText(cleanedText);
  if (truncated !== cleanedText) {
    showError('Text too long. Only the first portion will be spoken.');
  }

  showStatus(blockCount > 1 ? `Generating speech for ${blockCount} blocks...` : 'Generating speech...');

  const audioBlob = await generateSpeech({
    text: truncated,
    serverUrl: settings.serverUrl,
    voice: settings.voice,
    speed: settings.speed,
    format: settings.responseFormat,
  });

  await playAudioBlob(audioBlob);
  showStatus('Playing.');
}

async function speakSelectedBlocks(fallbackUuid?: string): Promise<void> {
  try {
    showStatus('Getting selected blocks...');

    let blocks = await getSelectedBlocks();
    if (!blocks.length && fallbackUuid) {
      const fallbackBlock = await getBlockByUuid(fallbackUuid);
      blocks = fallbackBlock ? [fallbackBlock] : [];
    }

    const readableBlocks = blocks.filter((block) => block.content.trim());
    if (!readableBlocks.length) {
      showError('No selected blocks with readable text.');
      return;
    }

    await speakText(readableBlocks.map((block) => block.content).join('\n'), readableBlocks.length);
  } catch (error) {
    showError(formatTtsError(error));
  }
}

async function handleStop(): Promise<void> {
  stopAudio();
  showStatus('Stopped.');
}

async function handleReplay(): Promise<void> {
  try {
    await replayLastAudio();
    showStatus('Replaying.');
  } catch (error) {
    showError(formatTtsError(error));
  }
}

function runAsync(action: () => Promise<void>): void {
  action().catch((error) => {
    showError(formatTtsError(error));
  });
}

export async function loadSettings(): Promise<void> {
  debugLog('Loading settings.');
  settings = await getSettings();
  debugLog('Settings loaded.', settings);
}

export async function openSettings(): Promise<void> {
  const template = `
    <style>
      .logseq-kokoro-settings { padding: 8px; }
      .logseq-kokoro-settings label { display: block; margin: 8px 0 4px; font-size: 13px; }
      .logseq-kokoro-settings input, .logseq-kokoro-settings select { width: 100%; padding: 4px 6px; font-size: 13px; }
    </style>
    <div class="logseq-kokoro-settings">
      <label>Server URL</label>
      <input id="serverUrl" value="${settings.serverUrl}" />
      <label>Voice</label>
      <input id="voice" value="${settings.voice}" />
      <label>Speed</label>
      <input id="speed" type="number" step="0.1" min="0.5" max="2.0" value="${settings.speed}" />
      <label>Format</label>
      <select id="responseFormat">
        <option value="mp3" ${settings.responseFormat === 'mp3' ? 'selected' : ''}>mp3</option>
        <option value="wav" ${settings.responseFormat === 'wav' ? 'selected' : ''}>wav</option>
        <option value="opus" ${settings.responseFormat === 'opus' ? 'selected' : ''}>opus</option>
        <option value="flac" ${settings.responseFormat === 'flac' ? 'selected' : ''}>flac</option>
      </select>
      <label><input type="checkbox" id="cleanText" ${settings.cleanText ? 'checked' : ''} /> Clean Logseq syntax</label>
      <label><input type="checkbox" id="showStatus" ${settings.showStatus ? 'checked' : ''} /> Show status messages</label>
    </div>
  `;

  await logseq.UI?.showModal?.('Kokoro TTS Settings', {
    content: template,
    buttons: [],
  });

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save';
  saveBtn.onclick = async () => {
    const newSettings: TtsSettings = {
      serverUrl: (document.getElementById('serverUrl') as HTMLInputElement).value,
      voice: (document.getElementById('voice') as HTMLInputElement).value,
      speed: parseFloat((document.getElementById('speed') as HTMLInputElement).value),
      responseFormat: (document.getElementById('responseFormat') as HTMLSelectElement).value as TtsSettings['responseFormat'],
      cleanText: (document.getElementById('cleanText') as HTMLInputElement).checked,
      showStatus: (document.getElementById('showStatus') as HTMLInputElement).checked,
    };
    settings = newSettings;
    await saveSettings(newSettings);
    logseq.UI?.hideModal?.();
    showStatus('Settings saved.');
  };

  setTimeout(() => {
    const modalEl = document.querySelector('.logseq-modal-container');
    if (modalEl) {
      const btnContainer = document.createElement('div');
      btnContainer.style.padding = '8px';
      btnContainer.appendChild(saveBtn);
      modalEl.appendChild(btnContainer);
    }
  }, 100);
}

export async function init(): Promise<void> {
  debugLog('Init started.', {
    hasLogseq: typeof logseq !== 'undefined',
    hasEditor: Boolean(logseq.Editor),
    hasApp: Boolean(logseq.App),
    hasUI: Boolean(logseq.UI),
    hasStorage: Boolean(logseq.storage),
  });

  await loadSettings();

  window.addEventListener('beforeunload', releaseAudio);

  logseq.Editor?.registerBlockContextMenuItem?.('Speak selected block(s)', (event) => {
    runAsync(() => speakSelectedBlocks(event.uuid));
  });
  debugLog('Registered block context menu item.', { label: 'Speak selected block(s)' });

  logseq.App?.registerCommandPalette?.({ key: 'kokoro-tts-speak-selected-blocks', label: 'Kokoro TTS: Speak selected block(s)' }, () => runAsync(() => speakSelectedBlocks()));
  debugLog('Registered command palette action.', { key: 'kokoro-tts-speak-selected-blocks' });

  logseq.App?.registerCommandPalette?.({ key: 'kokoro-tts-stop-audio', label: 'Kokoro TTS: Stop audio' }, () => runAsync(handleStop));
  debugLog('Registered command palette action.', { key: 'kokoro-tts-stop-audio' });

  logseq.App?.registerCommandPalette?.({ key: 'kokoro-tts-replay-audio', label: 'Kokoro TTS: Replay last audio' }, () => runAsync(handleReplay));
  debugLog('Registered command palette action.', { key: 'kokoro-tts-replay-audio' });

  logseq.App?.registerCommandPalette?.({ key: 'kokoro-tts-open-settings', label: 'Kokoro TTS: Open settings' }, () => runAsync(openSettings));
  debugLog('Registered command palette action.', { key: 'kokoro-tts-open-settings' });

  logseq.UI?.showMsg?.('Kokoro TTS plugin loaded.', 'success');
  debugLog('Init completed.');
}

export { speakSelectedBlocks, handleStop, handleReplay };

debugLog('Bundle loaded, calling logseq.ready.');
logseq.ready?.(() => {
  debugLog('logseq.ready callback fired.');
  runAsync(init);
});

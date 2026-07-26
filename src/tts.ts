import { GenerateSpeechOptions } from './types';

export async function generateSpeech(options: GenerateSpeechOptions): Promise<Blob> {
  const serverUrl = options.serverUrl.replace(/\/+$/, '');

  const response = await fetch(`${serverUrl}/v1/audio/speech`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'kokoro',
      input: options.text,
      voice: options.voice,
      response_format: options.format,
      speed: options.speed,
    }),
  }).catch((error) => {
    throw new Error(`Kokoro request failed. This is usually CORS when Logseq calls ${serverUrl}. ${String(error)}`);
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Kokoro API failed: ${response.status} ${errorText}`);
  }

  return await response.blob();
}

export function formatTtsError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('fetch') || error.message.includes('ECONNREFUSED')) {
      return 'Kokoro server not reachable. Start localhost:8880.';
    }
    if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
      return 'Kokoro request blocked by CORS. Run npm run proxy and set Server URL to http://localhost:8881.';
    }
    return error.message;
  }
  return 'An unknown error occurred.';
}

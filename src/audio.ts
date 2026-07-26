let currentAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;
let lastBlob: Blob | null = null;

export async function playAudioBlob(blob: Blob): Promise<void> {
  stopAudio();

  if (currentUrl) {
    URL.revokeObjectURL(currentUrl);
  }

  lastBlob = blob;
  currentUrl = URL.createObjectURL(blob);
  currentAudio = new Audio(currentUrl);

  try {
    await currentAudio.play();
  } catch {
    throw new Error('Audio play blocked. Click inside Logseq and try again.');
  }
}

export function stopAudio(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
}

export async function replayLastAudio(): Promise<void> {
  if (!lastBlob) {
    throw new Error('No previous audio to replay.');
  }
  await playAudioBlob(lastBlob);
}

export function releaseAudio(): void {
  stopAudio();
  if (currentUrl) {
    URL.revokeObjectURL(currentUrl);
    currentUrl = null;
  }
  lastBlob = null;
}

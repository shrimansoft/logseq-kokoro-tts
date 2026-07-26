export interface TtsSettings {
  serverUrl: string;
  voice: string;
  speed: number;
  responseFormat: 'mp3' | 'wav' | 'opus' | 'flac';
  cleanText: boolean;
  showStatus: boolean;
}

export interface GenerateSpeechOptions {
  text: string;
  serverUrl: string;
  voice: string;
  speed: number;
  format: 'mp3' | 'wav' | 'opus' | 'flac';
}

export interface LogseqBlock {
  uuid: string;
  content: string;
  name?: string;
  pageUuid?: string;
}

declare global {
  const logseq: {
    ready?: (callback: () => void | Promise<void>) => Promise<void> | void;
    on?: (event: string, callback: () => void | Promise<void>) => void;
    storage?: {
      getItem?: (key: string) => string | null;
      setItem?: (key: string, value: string) => void | Promise<void>;
    };
    UI?: {
      showMsg?: (message: string, status?: 'success' | 'warning' | 'error') => void;
      showModal?: (
        title: string,
        options: { content: string; buttons?: unknown[] }
      ) => Promise<{ on?: (...args: unknown[]) => void }> | { on?: (...args: unknown[]) => void };
      hideModal?: () => void;
    };
    Editor?: {
      getCurrentBlock?: () => Promise<unknown | null>;
      getBlockByUuid?: (uuid: string) => Promise<unknown | null>;
      getSelectedBlocks?: () => Promise<unknown[] | null>;
      registerSlashCommand?: (command: string, callback: () => void | Promise<void>) => void;
      registerSlashMenu?: (
        command: string,
        options: { label: string; callback: () => void | Promise<void> }
      ) => void;
      registerBlockContextMenuItem?: (
        label: string,
        callback: (event: { uuid: string }) => void | Promise<void>
      ) => void;
    };
    App?: {
      registerCommandPalette?: (
        command: { key: string; label: string },
        callback: () => void | Promise<void>
      ) => void;
    };
  };
}

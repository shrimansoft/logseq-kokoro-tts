import { LogseqBlock } from './types';

type LogseqApiBlock = {
  uuid?: string;
  content?: string;
  name?: string;
  pageUuid?: string;
};

export async function getCurrentBlock(): Promise<LogseqBlock | null> {
  try {
    const block = await logseq.Editor?.getCurrentBlock?.() as LogseqApiBlock | null | undefined;
    if (!block) return null;
    return {
      uuid: block.uuid || '',
      content: block.content || '',
      name: block.name,
      pageUuid: block.pageUuid,
    };
  } catch (error) {
    console.error('Failed to get current block:', error);
    return null;
  }
}

export async function getBlockByUuid(uuid: string): Promise<LogseqBlock | null> {
  try {
    const block = await logseq.Editor?.getBlockByUuid?.(uuid) as LogseqApiBlock | null | undefined;
    if (!block) return null;
    return {
      uuid: block.uuid || uuid,
      content: block.content || '',
      name: block.name,
      pageUuid: block.pageUuid,
    };
  } catch (error) {
    console.error('Failed to get block by uuid:', error);
    return null;
  }
}

export async function getSelectedBlocks(): Promise<LogseqBlock[]> {
  try {
    const blocks = await logseq.Editor?.getSelectedBlocks?.() as LogseqApiBlock[] | null | undefined;
    if (!blocks?.length) return [];

    return blocks.map((block) => ({
      uuid: block.uuid || '',
      content: block.content || '',
      name: block.name,
      pageUuid: block.pageUuid,
    }));
  } catch (error) {
    console.error('Failed to get selected blocks:', error);
    return [];
  }
}

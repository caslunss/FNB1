import type {Friend} from '../types/workspace';

export const SOCIAL_PAGE_SIZE = 100;
export interface SocialCursor { createdAt: string; id: string }
interface PageResult<T> { data: T[] | null; error: unknown }

function requireActive(signal: AbortSignal) {
  signal.throwIfAborted();
}

/** Re-read a full first page with a stable timestamp/id order before continuing. */
export async function readSocialPages<T extends Friend>(
  fetchPage: (cursor: SocialCursor | undefined) => PromiseLike<PageResult<T>>,
  signal: AbortSignal,
): Promise<T[]> {
  const rows: T[] = [], ids = new Set<string>();
  let cursor: SocialCursor | undefined;
  for (;;) {
    requireActive(signal);
    const result = await fetchPage(cursor);
    requireActive(signal);
    if (result.error) throw result.error;
    if (!Array.isArray(result.data)) throw Error('Página social inválida.');
    for (const row of result.data) {
      if (!/^[a-f0-9-]{36}$/i.test(row.id) ||
          !/^\d{4}-\d{2}-\d{2}T[\d:.+-]+Z?$/.test(row.created_at) ||
          !Number.isFinite(Date.parse(row.created_at)) || ids.has(row.id))
        throw Error('Paginação social inconsistente.');
      ids.add(row.id);
      rows.push(row);
    }
    const last = result.data.at(-1);
    if (result.data.length < SOCIAL_PAGE_SIZE || !last) return rows;
    cursor = {createdAt: last.created_at, id: last.id};
  }
}

interface UsernameRow {user_id: string; username: string}
export async function readUsernameBatches(
  ids: string[],
  fetchBatch: (batch: string[]) => PromiseLike<PageResult<UsernameRow>>,
  signal: AbortSignal,
): Promise<Record<string, string>> {
  const unique = [...new Set(ids)], rows: UsernameRow[] = [];
  for (let start = 0; start < unique.length; start += SOCIAL_PAGE_SIZE) {
    requireActive(signal);
    const result = await fetchBatch(unique.slice(start, start + SOCIAL_PAGE_SIZE));
    requireActive(signal);
    if (result.error) throw result.error;
    if (!Array.isArray(result.data)) throw Error('Usuários indisponíveis.');
    rows.push(...result.data);
  }
  return Object.fromEntries(rows.map(row => [row.user_id, row.username]));
}

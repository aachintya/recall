import { savedSessionSchema, type SavedSession } from '../../shared/schema';

export const STORAGE_KEY = 'recall.sessions.v1';
export const MAX_SESSIONS = 20;

export function loadSessions(): SavedSession[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    const ids = new Set<string>();
    return raw.slice(0, MAX_SESSIONS).flatMap((item) => {
      const parsed = savedSessionSchema.safeParse(item);
      if (!parsed.success || ids.has(parsed.data.id)) return [];
      ids.add(parsed.data.id);
      return [parsed.data];
    });
  } catch {
    return [];
  }
}

export function persistSessions(sessions: SavedSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
    return true;
  } catch {
    return false;
  }
}

export function readTheme(): 'light' | 'dark' {
  try {
    return localStorage.getItem('recall.theme') === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

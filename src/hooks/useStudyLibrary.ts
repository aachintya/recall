import { useCallback, useRef, useState } from 'react';
import type { SavedSession, StudySet } from '../../shared/schema';
import { loadSessions, MAX_SESSIONS, persistSessions } from '../lib/storage';

export function useStudyLibrary() {
  const [sessions, setSessions] = useState(loadSessions);
  const [saved, setSaved] = useState(true);
  const current = useRef(sessions);

  const update = useCallback((change: (sessions: SavedSession[]) => SavedSession[]) => {
    const next = change(current.current).slice(0, MAX_SESSIONS);
    current.current = next;
    setSessions(next);
    setSaved(persistSessions(next));
  }, []);

  const saveSet = useCallback(
    (set: StudySet, source: SavedSession['source']) => {
      const existing =
        source === 'example' &&
        current.current.find(
          (session) => session.source === 'example' && session.set.title === set.title,
        );
      if (existing) return existing.id;
      const session: SavedSession = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        source,
        set,
        knownCards: [],
      };
      update((sessions) => [session, ...sessions]);
      return session.id;
    },
    [update],
  );

  const remember = useCallback(
    (id: string, knownCards: number[]) => {
      update((sessions) =>
        sessions.map((session) => (session.id === id ? { ...session, knownCards } : session)),
      );
    },
    [update],
  );

  const remove = useCallback(
    (id: string) => {
      const removed = current.current.find((session) => session.id === id);
      if (removed) update((sessions) => sessions.filter((session) => session.id !== id));
      return removed;
    },
    [update],
  );

  const restore = useCallback(
    (removed: SavedSession) => {
      update((sessions) =>
        [removed, ...sessions.filter((session) => session.id !== removed.id)].sort(
          (a, b) => b.createdAt - a.createdAt,
        ),
      );
    },
    [update],
  );

  return { sessions, saved, saveSet, remember, remove, restore };
}

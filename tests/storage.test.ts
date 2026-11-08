// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadSessions, persistSessions, STORAGE_KEY } from '../src/lib/storage';
import { examples } from '../src/data/examples';

const session = {
  id: 'example-id',
  createdAt: 1_800_000_000_000,
  source: 'example' as const,
  set: examples.react,
  knownCards: [0, 2],
};
beforeEach(() => localStorage.clear());

describe('saved sessions', () => {
  it('round-trips a session with progress', () => {
    expect(persistSessions([session])).toBe(true);
    expect(loadSessions()).toEqual([session]);
  });
  it('counts a remembered card only once while preserving the saved set', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ ...session, knownCards: [0, 0, 0, 0, 0, 0] }]),
    );
    expect(loadSessions()).toEqual([{ ...session, knownCards: [0] }]);
  });
  it.each(['broken JSON', '{}', 'null'])('recovers from malformed stored data', (value) => {
    localStorage.setItem(STORAGE_KEY, value);
    expect(loadSessions()).toEqual([]);
  });
  it('skips invalid entries and duplicates while keeping valid sets', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ ...session, id: 'invalid', knownCards: [10] }, null, session, session]),
    );
    expect(loadSessions()).toEqual([session]);
  });
  it('handles unavailable browser storage without crashing', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('Quota exceeded');
    });
    expect(persistSessions([session])).toBe(false);
  });
});

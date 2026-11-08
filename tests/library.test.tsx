// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useStudyLibrary } from '../src/hooks/useStudyLibrary';
import { examples } from '../src/data/examples';
import { loadSessions } from '../src/lib/storage';

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('study library ownership', () => {
  it('resumes an example and keeps its remembered cards in storage', () => {
    const { result } = renderHook(useStudyLibrary);
    let id!: string;
    act(() => {
      id = result.current.saveSet(examples.react, 'example');
    });
    act(() => result.current.remember(id, [0, 2]));
    act(() => expect(result.current.saveSet(examples.react, 'example')).toBe(id));
    expect(result.current.sessions).toHaveLength(1);
    expect(loadSessions()[0].knownCards).toEqual([0, 2]);
  });

  it('undoes a deletion without overwriting a set saved afterwards', () => {
    const { result } = renderHook(useStudyLibrary);
    act(() => result.current.saveSet(examples.react, 'ai'));
    const original = result.current.sessions[0];
    act(() => result.current.remove(original.id));
    act(() => result.current.saveSet(examples.space, 'ai'));
    act(() => result.current.restore(original));
    expect(result.current.sessions.map((session) => session.set.title)).toEqual(
      expect.arrayContaining([examples.react.title, examples.space.title]),
    );
    expect(loadSessions()).toHaveLength(2);
  });

  it('keeps edits and undo available in memory when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Unavailable');
    });
    const { result } = renderHook(useStudyLibrary);
    act(() => result.current.saveSet(examples.react, 'example'));
    const original = result.current.sessions[0];
    act(() => result.current.remember(original.id, [1]));
    const remembered = result.current.sessions[0];
    act(() => result.current.remove(original.id));
    act(() => result.current.saveSet(examples.space, 'example'));
    act(() => result.current.restore(remembered));
    expect(result.current.saved).toBe(false);
    expect(result.current.sessions).toHaveLength(2);
    expect(
      result.current.sessions.find((session) => session.id === original.id)?.knownCards,
    ).toEqual([1]);
  });

  it('keeps the 20 newest sets even when several saves happen before a render', () => {
    const { result } = renderHook(useStudyLibrary);
    const ids: string[] = [];
    act(() => {
      for (let i = 0; i < 21; i++) ids.push(result.current.saveSet(examples.react, 'ai'));
    });
    expect(result.current.sessions).toHaveLength(20);
    expect(result.current.sessions[0].id).toBe(ids[20]);
    expect(result.current.sessions.some((session) => session.id === ids[0])).toBe(false);
  });
});

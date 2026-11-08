// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useGeneration } from '../src/hooks/useGeneration';
import { examples } from '../src/data/examples';

const input = {
  notes: 'Teach me how plants make food.',
  count: 6 as const,
  difficulty: 'standard' as const,
};
const response = (set: unknown) => new Response(JSON.stringify({ set }));
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((accept) => {
    resolve = accept;
  });
  return { promise, resolve };
}
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('generation lifecycle', () => {
  it('ignores an old response even if its transport ignores abort', async () => {
    const first = deferred<Response>();
    const second = deferred<Response>();
    const fetcher = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    vi.stubGlobal('fetch', fetcher);
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useGeneration(onSuccess));
    let old!: Promise<void>;
    let latest!: Promise<void>;
    act(() => {
      old = result.current.generate(input);
    });
    act(() => {
      latest = result.current.generate({ ...input, notes: 'Teach me React components.' });
    });
    expect(fetcher.mock.calls[0][1].signal.aborted).toBe(true);
    await act(async () => {
      second.resolve(response(examples.react));
      await latest;
    });
    expect(onSuccess).toHaveBeenCalledExactlyOnceWith(examples.react);
    await act(async () => {
      first.resolve(response(examples.photosynthesis));
      await old;
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(result.current.state.status).not.toBe('loading');
  });
  it('ignores a late failure after cancellation or opening an example', async () => {
    const pending = deferred<Response>();
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(pending.promise));
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useGeneration(onSuccess));
    let operation!: Promise<void>;
    act(() => {
      operation = result.current.generate(input);
    });
    act(() => result.current.cancel());
    await act(async () => {
      pending.resolve(
        new Response(
          JSON.stringify({ error: { code: 'TIMEOUT', message: 'Too late', retryable: true } }),
          { status: 504 },
        ),
      );
      await operation;
    });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(result.current.state).toEqual({ status: 'idle' });
    expect(result.current.state.status).not.toBe('loading');
  });
  it('rejects a wrong shape from the server instead of rendering it', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ cards: null })));
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useGeneration(onSuccess));
    await act(async () => {
      await result.current.generate(input);
    });
    expect(result.current.state).toMatchObject({
      status: 'error',
      error: { code: 'INVALID_OUTPUT' },
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });
  it('recovers after a failed request, clearing the previous error', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValueOnce(new TypeError('offline'))
        .mockResolvedValueOnce(response(examples.react)),
    );
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useGeneration(onSuccess));
    await act(async () => {
      await result.current.generate(input);
    });
    expect(result.current.state).toMatchObject({
      status: 'error',
      error: { code: 'NETWORK_ERROR' },
    });
    await act(async () => {
      await result.current.generate(input);
    });
    expect(result.current.state).toEqual({ status: 'idle' });
    expect(onSuccess).toHaveBeenCalledExactlyOnceWith(examples.react);
  });
  it('shows a slow state and times out without clearing the user’s input', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, options) =>
          new Promise((_resolve, reject) =>
            options.signal.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError')),
            ),
          ),
      ),
    );
    const { result } = renderHook(() => useGeneration(vi.fn()));
    let operation!: Promise<void>;
    act(() => {
      operation = result.current.generate(input);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8000);
    });
    expect(result.current.state.status).toBe('slow');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(42_000);
      await operation;
    });
    expect(result.current.state).toMatchObject({ status: 'error', error: { code: 'TIMEOUT' } });
    expect(result.current.state.status).not.toBe('loading');
  });
  it('aborts outstanding work when the hook unmounts', async () => {
    const pending = deferred<Response>();
    const fetcher = vi.fn().mockReturnValue(pending.promise);
    vi.stubGlobal('fetch', fetcher);
    const { result, unmount } = renderHook(() => useGeneration(vi.fn()));
    act(() => {
      void result.current.generate(input);
    });
    unmount();
    expect(fetcher.mock.calls[0][1].signal.aborted).toBe(true);
    pending.resolve(response(examples.react));
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
  });

  it('reports a hard deadline even if the transport ignores abort, then ignores its result', async () => {
    vi.useFakeTimers();
    const pending = deferred<Response>();
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(pending.promise));
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useGeneration(onSuccess));
    let operation!: Promise<void>;
    act(() => {
      operation = result.current.generate(input);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50_000);
    });
    expect(result.current.state).toMatchObject({ status: 'error', error: { code: 'TIMEOUT' } });
    await act(async () => {
      pending.resolve(response(examples.react));
      await operation;
    });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(result.current.state).toMatchObject({ status: 'error', error: { code: 'TIMEOUT' } });
  });

  it('clears request timers immediately when cancelled', async () => {
    vi.useFakeTimers();
    const pending = deferred<Response>();
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(pending.promise));
    const { result } = renderHook(() => useGeneration(vi.fn()));
    let operation!: Promise<void>;
    act(() => {
      operation = result.current.generate(input);
    });
    act(() => result.current.cancel());
    expect(vi.getTimerCount()).toBe(0);
    await act(async () => {
      pending.resolve(response(examples.react));
      await operation;
    });
    expect(result.current.state).toEqual({ status: 'idle' });
  });

  it('distinguishes an unreadable server response from a connection failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not JSON')));
    const { result } = renderHook(() => useGeneration(vi.fn()));
    await act(async () => {
      await result.current.generate(input);
    });
    expect(result.current.state).toMatchObject({
      status: 'error',
      error: { code: 'INVALID_RESPONSE' },
    });
  });
});

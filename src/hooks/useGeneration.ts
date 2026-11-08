import { useCallback, useEffect, useRef, useState } from 'react';
import { GENERATION_TIMEOUT_MS } from '../../shared/generation';
import {
  errorResponseSchema,
  generationResponseSchema,
  type GenerationError,
  type GenerationRequest,
  type StudySet,
} from '../../shared/schema';

export type GenerationState =
  { status: 'idle' | 'loading' | 'slow' } | { status: 'error'; error: GenerationError };

export function useGeneration(onSuccess: (set: StudySet) => void) {
  const [state, setState] = useState<GenerationState>({ status: 'idle' });
  const sequence = useRef(0);
  const active = useRef<{ controller: AbortController; dispose: () => void } | null>(null);
  const success = useRef(onSuccess);
  success.current = onSuccess;

  const stop = useCallback(() => {
    sequence.current += 1;
    active.current?.controller.abort();
    active.current?.dispose();
    active.current = null;
  }, []);
  const cancel = useCallback(() => {
    stop();
    setState({ status: 'idle' });
  }, [stop]);
  useEffect(() => stop, [stop]);

  const generate = useCallback(
    async (request: GenerationRequest) => {
      stop();
      const id = sequence.current;
      const controller = new AbortController();
      const fail = (error: GenerationError) => {
        if (id === sequence.current) setState({ status: 'error', error });
      };
      setState({ status: 'loading' });
      const slowTimer = setTimeout(() => {
        if (id === sequence.current) setState({ status: 'slow' });
      }, 8000);
      const timeout = setTimeout(() => {
        if (id !== sequence.current) return;
        stop();
        setState({
          status: 'error',
          error: {
            code: 'TIMEOUT',
            retryable: true,
            message:
              'The study set took too long to generate. Your notes are still here. Try again.',
          },
        });
      }, GENERATION_TIMEOUT_MS);
      const dispose = () => {
        clearTimeout(slowTimer);
        clearTimeout(timeout);
      };
      active.current = { controller, dispose };

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
          signal: controller.signal,
        });
        let body: unknown;
        try {
          body = await response.json();
        } catch {
          fail({
            code: 'INVALID_RESPONSE',
            message: 'The server returned an unreadable response. Try again.',
            retryable: true,
          });
          return;
        }
        if (id !== sequence.current) return;
        if (!response.ok) {
          const parsed = errorResponseSchema.safeParse(body);
          fail(
            parsed.success
              ? parsed.data.error
              : {
                  code: 'SERVER_ERROR',
                  message:
                    'The server couldn’t create this study set. Your notes are still here. Try again.',
                  retryable: true,
                },
          );
          return;
        }
        const parsed = generationResponseSchema.safeParse(body);
        if (!parsed.success || parsed.data.set.cards.length !== request.count) {
          fail({
            code: 'INVALID_OUTPUT',
            message: 'The study set was incomplete. Your notes are still here. Try again.',
            retryable: true,
          });
          return;
        }
        success.current(parsed.data.set);
        if (id === sequence.current) setState({ status: 'idle' });
      } catch {
        fail({
          code: 'NETWORK_ERROR',
          message: 'Couldn’t reach the server. Check your connection and try again.',
          retryable: true,
        });
      } finally {
        dispose();
        if (id === sequence.current) active.current = null;
      }
    },
    [stop],
  );

  return { state, generate, cancel };
}

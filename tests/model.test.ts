import { describe, expect, it, vi } from 'vitest';
import { generateStudySet, parseModelOutput, readConfig, type LlmConfig } from '../server/llm';
import { examples } from '../src/data/examples';
import type { GenerationRequest } from '../shared/schema';

const set = examples.photosynthesis;
const request: GenerationRequest = {
  notes: 'Explain photosynthesis to me.',
  count: 6,
  difficulty: 'standard',
};
const config: LlmConfig = {
  apiKey: 'server-only-test-key',
  model: 'gemini-2.5-flash',
  timeoutMs: 1000,
};
const completion = (content: unknown, extra = {}) =>
  new Response(
    JSON.stringify({
      candidates: [{ content: { parts: [{ text: content }] }, finishReason: 'STOP', ...extra }],
    }),
  );
const fetchResult = (response: Response) => vi.fn<typeof fetch>().mockResolvedValue(response);

describe('the model output boundary', () => {
  it('accepts valid JSON and a single complete Markdown fence', () => {
    expect(parseModelOutput(JSON.stringify(set), 6)).toEqual(set);
    expect(parseModelOutput(`\`\`\`json\n${JSON.stringify(set)}\n\`\`\``, 6)).toEqual(set);
  });
  it.each(['', '  ', null, undefined])('rejects empty output: %s', (value) => {
    expect(() => parseModelOutput(value)).toThrow(
      expect.objectContaining({ code: 'EMPTY_OUTPUT' }),
    );
  });
  it.each(['{"cards": [', 'Here you go: {}', '<script>alert(1)</script>', '```json\n{}'])(
    'rejects malformed JSON without attempting unsafe repairs',
    (raw) => {
      expect(() => parseModelOutput(raw)).toThrow(
        expect.objectContaining({ code: 'MALFORMED_JSON' }),
      );
    },
  );
  it.each([
    {},
    [],
    { ...set, cards: [] },
    { ...set, title: ' ' },
    { ...set, cards: [{ question: 'Broken' }] },
    { ...set, quiz: set.quiz.slice(1) },
  ])('rejects an incorrect structure', (raw) => {
    expect(() => parseModelOutput(JSON.stringify(raw))).toThrow(
      expect.objectContaining({ code: 'INVALID_OUTPUT' }),
    );
  });
  it('rejects invalid answer indices, duplicate options, and duplicate questions', () => {
    for (const update of [
      { ...set.quiz[0], correctIndex: 4 },
      { ...set.quiz[0], correctIndex: 1.5 },
      { ...set.quiz[0], options: ['Same', 'same', 'Other', 'Third'] },
      { ...set.quiz[0], options: ['Only one'] },
      { ...set.quiz[0], options: ['   ', 'Two', 'Three', 'Four'] },
    ]) {
      expect(() =>
        parseModelOutput(JSON.stringify({ ...set, quiz: [update, ...set.quiz.slice(1)] })),
      ).toThrow(expect.objectContaining({ code: 'INVALID_OUTPUT' }));
    }
    expect(() =>
      parseModelOutput(JSON.stringify({ ...set, cards: [set.cards[0], ...set.cards.slice(0, 5)] })),
    ).toThrow();
  });
  it('enforces the requested count and response size', () => {
    expect(() => parseModelOutput(JSON.stringify(set), 8)).toThrow(
      expect.objectContaining({ code: 'INVALID_OUTPUT' }),
    );
    expect(() => parseModelOutput('x'.repeat(100_001))).toThrow(
      expect.objectContaining({ code: 'INVALID_OUTPUT' }),
    );
  });
});

describe('provider integration', () => {
  it('caps server deadlines below the browser timeout', () => {
    vi.stubEnv('LLM_TIMEOUT_MS', '120000');
    try {
      expect(readConfig().timeoutMs).toBe(45_000);
    } finally {
      vi.unstubAllEnvs();
    }
  });
  it('makes a real-format structured request with the credential on the server', async () => {
    const fetcher = fetchResult(completion(JSON.stringify(set)));
    expect(await generateStudySet(request, config, undefined, fetcher)).toEqual(set);
    const [url, options] = fetcher.mock.calls[0];
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    );
    expect(options?.headers).toMatchObject({ 'x-goog-api-key': 'server-only-test-key' });
    const body = JSON.parse(options!.body as string);
    expect(body.generationConfig.responseMimeType).toBe('application/json');
    expect(body.generationConfig.responseJsonSchema.required).toContain('cards');
    expect(String(url)).not.toContain(config.apiKey);
    expect(body.contents[0].parts[0].text).toContain(request.notes);
  });
  it('fails clearly when no API key is configured', async () => {
    const fetcher = vi.fn<typeof fetch>();
    await expect(
      generateStudySet(request, { ...config, apiKey: '' }, undefined, fetcher),
    ).rejects.toMatchObject({ code: 'NOT_CONFIGURED', status: 503 });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([
    [401, 'PROVIDER_AUTH'],
    [403, 'PROVIDER_AUTH'],
    [429, 'RATE_LIMITED'],
    [500, 'PROVIDER_ERROR'],
  ])('maps provider HTTP %s to a safe error', async (status, code) => {
    await expect(
      generateStudySet(
        request,
        config,
        undefined,
        fetchResult(new Response('secret upstream details', { status: Number(status) })),
      ),
    ).rejects.toMatchObject({ code });
  });
  it('recognizes Gemini’s HTTP 400 invalid-key response without exposing upstream text', async () => {
    await expect(
      generateStudySet(
        request,
        config,
        undefined,
        fetchResult(
          new Response(
            JSON.stringify({
              error: {
                message: 'private credential detail',
                details: [{ reason: 'API_KEY_INVALID' }],
              },
            }),
            { status: 400 },
          ),
        ),
      ),
    ).rejects.toMatchObject({ code: 'PROVIDER_AUTH', status: 503, retryable: false });
  });
  it('ignores thinking parts and joins only the generated answer', async () => {
    const text = JSON.stringify(set);
    const response = new Response(
      JSON.stringify({
        candidates: [
          {
            finishReason: 'STOP',
            content: {
              parts: [
                { text: 'private reasoning', thought: true },
                { text: text.slice(0, 20) },
                { text: text.slice(20) },
              ],
            },
          },
        ],
      }),
    );
    expect(await generateStudySet(request, config, undefined, fetchResult(response))).toEqual(set);
  });
  it('handles a prompt blocked before candidates are generated', async () => {
    await expect(
      generateStudySet(
        request,
        config,
        undefined,
        fetchResult(
          new Response(
            JSON.stringify({
              promptFeedback: { blockReason: 'SAFETY' },
            }),
          ),
        ),
      ),
    ).rejects.toMatchObject({ code: 'MODEL_REFUSAL', status: 422 });
  });
  it.each([
    [completion('', {}), 'EMPTY_OUTPUT'],
    [completion(JSON.stringify(set), { finishReason: 'MAX_TOKENS' }), 'TRUNCATED_OUTPUT'],
    [completion(null, { finishReason: 'SAFETY', content: undefined }), 'MODEL_REFUSAL'],
    [new Response('not JSON'), 'INVALID_OUTPUT'],
    [new Response('{}'), 'INVALID_OUTPUT'],
  ])('rejects unusable completion envelopes', async (response, code) => {
    await expect(
      generateStudySet(request, config, undefined, fetchResult(response as Response)),
    ).rejects.toMatchObject({ code });
  });
  it('turns network failures into a retryable error', async () => {
    await expect(
      generateStudySet(
        request,
        config,
        undefined,
        vi.fn<typeof fetch>().mockRejectedValue(new TypeError('fetch failed')),
      ),
    ).rejects.toMatchObject({ code: 'NETWORK_ERROR', retryable: true });
  });
  it('aborts a slow provider request at its deadline', async () => {
    vi.useFakeTimers();
    try {
      const fetcher = vi.fn<typeof fetch>().mockImplementation(
        (_url, options) =>
          new Promise((_resolve, reject) => {
            options?.signal?.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError')),
            );
          }),
      );
      const pending = expect(
        generateStudySet(request, config, undefined, fetcher),
      ).rejects.toMatchObject({ code: 'TIMEOUT', status: 504 });
      await vi.advanceTimersByTimeAsync(1000);
      await pending;
      expect(fetcher.mock.calls[0][1]?.signal?.aborted).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
  it('keeps the deadline active while consuming a stalled response body', async () => {
    vi.useFakeTimers();
    try {
      const fetcher = vi.fn<typeof fetch>().mockImplementation(async (_url, options) => {
        const stream = new ReadableStream({
          start(controller) {
            options?.signal?.addEventListener('abort', () =>
              controller.error(new DOMException('Aborted', 'AbortError')),
            );
          },
        });
        return new Response(stream);
      });
      const pending = expect(
        generateStudySet(request, config, undefined, fetcher),
      ).rejects.toMatchObject({ code: 'TIMEOUT' });
      await vi.advanceTimersByTimeAsync(1000);
      await pending;
    } finally {
      vi.useRealTimers();
    }
  });
  it('passes browser cancellation through to the provider', async () => {
    const controller = new AbortController();
    const fetcher = vi.fn<typeof fetch>().mockImplementation(
      (_url, options) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        }),
    );
    const pending = expect(
      generateStudySet(request, config, controller.signal, fetcher),
    ).rejects.toMatchObject({ code: 'CANCELLED' });
    controller.abort();
    await pending;
  });
});

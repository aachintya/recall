import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../server/app';
import { examples } from '../src/data/examples';

const config = { apiKey: 'never-leak-this-key', model: 'gemini-2.5-flash', timeoutMs: 1000 };
const input = { notes: 'Teach me about photosynthesis.', count: 6, difficulty: 'standard' };

describe('HTTP API', () => {
  it('exposes status without exposing credentials', async () => {
    const response = await request(createApp(config)).get('/api/health').expect(200);
    expect(response.body).toEqual({ configured: true, provider: 'Gemini', model: config.model });
    expect(response.text).not.toContain(config.apiKey);
    expect(response.headers['cache-control']).toBe('no-store');
  });
  it('returns validated structured data from a provider response', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: { parts: [{ text: JSON.stringify(examples.react) }] },
              finishReason: 'STOP',
            },
          ],
        }),
      ),
    );
    const response = await request(createApp(config, fetcher))
      .post('/api/generate')
      .send(input)
      .expect(200);
    expect(response.body.set).toEqual(examples.react);
    expect(response.text).not.toContain(config.apiKey);
  });
  it.each([
    { ...input, notes: '' },
    { ...input, count: 100 },
    { ...input, difficulty: 'unknown' },
    { ...input, notes: 'x'.repeat(12_001) },
  ])('rejects bad input before making a paid model call', async (body) => {
    const fetcher = vi.fn<typeof fetch>();
    const response = await request(createApp(config, fetcher))
      .post('/api/generate')
      .send(body)
      .expect(400);
    expect(response.body.error.code).toBe('INVALID_INPUT');
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('handles malformed request JSON and oversized bodies', async () => {
    await request(createApp(config))
      .post('/api/generate')
      .set('Content-Type', 'application/json')
      .send('{"notes":')
      .expect(400);
    const response = await request(createApp(config))
      .post('/api/generate')
      .send({ ...input, notes: 'x'.repeat(70_000) })
      .expect(413);
    expect(response.body.error.code).toBe('INPUT_TOO_LARGE');
  });
  it('does not substitute examples when a real key is missing', async () => {
    const response = await request(createApp({ ...config, apiKey: '' }))
      .post('/api/generate')
      .send(input)
      .expect(503);
    expect(response.body.error).toMatchObject({ code: 'NOT_CONFIGURED', retryable: false });
    expect(response.body.set).toBeUndefined();
  });
  it('returns a recoverable malformed-output error without raw provider text', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            { content: { parts: [{ text: 'private model gibberish' }] }, finishReason: 'STOP' },
          ],
        }),
      ),
    );
    const response = await request(createApp(config, fetcher))
      .post('/api/generate')
      .send(input)
      .expect(502);
    expect(response.body.error).toMatchObject({ code: 'MALFORMED_JSON', retryable: true });
    expect(response.text).not.toContain('private model gibberish');
  });
  it('uses JSON for unknown API endpoints', async () => {
    const response = await request(createApp(config)).get('/api/unknown').expect(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});

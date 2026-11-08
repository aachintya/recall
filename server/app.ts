import express, { type ErrorRequestHandler } from 'express';
import { generationRequestSchema } from '../shared/schema';
import { generateStudySet, type LlmConfig } from './llm';
import { AppError } from './errors';

export function createApp(config: LlmConfig, fetcher: typeof fetch = fetch) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '64kb' }));
  app.get('/api/health', (_req, res) => {
    res
      .set('Cache-Control', 'no-store')
      .json({ configured: Boolean(config.apiKey), provider: 'Gemini', model: config.model });
  });
  app.post('/api/generate', async (req, res, next) => {
    const parsed = generationRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      next(
        new AppError(
          'INVALID_INPUT',
          'Add 10–12,000 characters of notes, choose 6, 8, or 10 cards, and select a difficulty.',
          400,
          false,
        ),
      );
      return;
    }
    const controller = new AbortController();
    const cancel = () => {
      if (!res.writableEnded) controller.abort();
    };
    res.on('close', cancel);
    try {
      const set = await generateStudySet(parsed.data, config, controller.signal, fetcher);
      if (!res.destroyed) res.set('Cache-Control', 'no-store').json({ set });
    } catch (error) {
      if (!res.destroyed) next(error);
    } finally {
      res.off('close', cancel);
    }
  });
  app.use('/api', (_req, _res, next) =>
    next(new AppError('NOT_FOUND', 'This endpoint does not exist.', 404, false)),
  );
  const handleError: ErrorRequestHandler = (error, _req, res, _next) => {
    if (res.headersSent || res.destroyed) return;
    if (error instanceof AppError) {
      res
        .status(error.status)
        .json({ error: { code: error.code, message: error.message, retryable: error.retryable } });
      return;
    }
    const status =
      error?.type === 'entity.too.large' ? 413 : error instanceof SyntaxError ? 400 : 500;
    res.status(status).json({
      error: {
        code:
          status === 413 ? 'INPUT_TOO_LARGE' : status === 400 ? 'INVALID_INPUT' : 'INTERNAL_ERROR',
        message:
          status === 413
            ? 'Those notes are too long. Please keep them under 12,000 characters.'
            : status === 400
              ? 'The request could not be read. Please try again.'
              : 'Something went wrong. Please try again.',
        retryable: status === 500,
      },
    });
  };
  app.use(handleError);
  return app;
}

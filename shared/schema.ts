import { z } from 'zod';

const text = (min: number, max: number) => z.string().trim().min(min).max(max);

export const generationRequestSchema = z.object({
  notes: text(10, 12_000),
  count: z.union([z.literal(6), z.literal(8), z.literal(10)]),
  difficulty: z.enum(['gentle', 'standard', 'challenge']),
});

const cardSchema = z.object({
  question: text(8, 300),
  answer: text(2, 700),
  tag: text(2, 32),
});

const quizQuestionSchema = z.object({
  question: text(8, 400),
  options: z
    .tuple([text(1, 200), text(1, 200), text(1, 200), text(1, 200)])
    .refine(
      (options) => new Set(options.map((option) => option.toLocaleLowerCase())).size === 4,
      'Answer options must be distinct.',
    ),
  correctIndex: z.number().int().min(0).max(3),
  explanation: text(5, 700),
});

export const studySetSchema = z
  .object({
    title: text(3, 80),
    subject: text(2, 40),
    description: text(10, 240),
    cards: z.array(cardSchema).min(3).max(12),
    quiz: z.array(quizQuestionSchema).min(3).max(12),
  })
  .superRefine((set, ctx) => {
    if (set.cards.length !== set.quiz.length) {
      ctx.addIssue({ code: 'custom', path: ['quiz'], message: 'Each card needs a quiz question.' });
    }
    for (const key of ['cards', 'quiz'] as const) {
      const questions = set[key].map((item) => item.question.toLocaleLowerCase());
      if (new Set(questions).size !== questions.length) {
        ctx.addIssue({ code: 'custom', path: [key], message: 'Questions must be distinct.' });
      }
    }
  });

export type StudySet = z.infer<typeof studySetSchema>;
export type GenerationRequest = z.infer<typeof generationRequestSchema>;
export type Difficulty = GenerationRequest['difficulty'];

export const generationResponseSchema = z.object({ set: studySetSchema });
const generationErrorSchema = z.object({
  code: text(1, 64),
  message: text(1, 500),
  retryable: z.boolean(),
});
export const errorResponseSchema = z.object({ error: generationErrorSchema });
export const providerStatusSchema = z.object({ configured: z.boolean() });
export type GenerationError = z.infer<typeof generationErrorSchema>;

export const savedSessionSchema = z
  .object({
    id: z.string().min(1).max(100),
    createdAt: z.number().finite().positive(),
    source: z.enum(['ai', 'example']),
    set: studySetSchema,
    knownCards: z
      .array(z.number().int().min(0).max(11))
      .max(12)
      .transform((indices) => [...new Set(indices)]),
  })
  .superRefine((session, ctx) => {
    if (session.knownCards.some((index) => index >= session.set.cards.length)) {
      ctx.addIssue({ code: 'custom', path: ['knownCards'], message: 'Unknown card index.' });
    }
  });
export type SavedSession = z.infer<typeof savedSessionSchema>;

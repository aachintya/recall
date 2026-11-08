import { useRef, useState, type FormEvent } from 'react';
import { AlertCircle, ArrowRight, Check, LoaderCircle, Sparkles, X } from 'lucide-react';
import {
  generationRequestSchema,
  type Difficulty,
  type GenerationRequest,
} from '../../shared/schema';
import type { GenerationState } from '../hooks/useGeneration';
import { topics } from '../data/examples';

interface Props {
  notes: string;
  onNotesChange: (notes: string) => void;
  state: GenerationState;
  onGenerate: (request: GenerationRequest) => void;
  onCancel: () => void;
}

const levels: { value: Difficulty; label: string }[] = [
  { value: 'gentle', label: 'Gentle' },
  { value: 'standard', label: 'Standard' },
  { value: 'challenge', label: 'Challenge' },
];

export function GenerationForm({ notes, onNotesChange, state, onGenerate, onCancel }: Props) {
  const [count, setCount] = useState<6 | 8 | 10>(6);
  const [difficulty, setDifficulty] = useState<Difficulty>('standard');
  const [validation, setValidation] = useState('');
  const input = useRef<HTMLTextAreaElement>(null);
  const loading = state.status === 'loading' || state.status === 'slow';
  const error = state.status === 'error' ? state.error : null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;
    const parsed = generationRequestSchema.safeParse({ notes, count, difficulty });
    if (!parsed.success) {
      setValidation('Add at least 10 characters of notes or a topic to create your study set.');
      input.current?.focus();
      return;
    }
    setValidation('');
    onGenerate(parsed.data);
  };

  return (
    <section className="composer panel" aria-labelledby="composer-title">
      <div className="panel-title">
        <span className="eyebrow form-step">
          <span>1</span> ADD YOUR MATERIAL
        </span>
        <h2 id="composer-title">What are we learning?</h2>
        <p>Paste your notes or describe what you want to learn.</p>
      </div>
      <form onSubmit={submit} noValidate>
        <label className="field-label" htmlFor="notes">
          Your notes or topic
        </label>
        <div className={`field-surface textarea-wrap ${validation ? 'input-invalid' : ''}`}>
          <textarea
            ref={input}
            id="notes"
            value={notes}
            onChange={(event) => {
              onNotesChange(event.target.value);
              setValidation('');
            }}
            maxLength={12000}
            aria-invalid={Boolean(validation)}
            aria-describedby={validation ? 'notes-error' : 'notes-hint'}
            placeholder="Paste your notes, or try “Help me understand how photosynthesis works…”"
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && !loading) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <div className="textarea-footer">
            <span id="notes-hint">A topic is all it takes.</span>
            <span>{notes.length.toLocaleString()} / 12,000</span>
          </div>
        </div>
        {validation && (
          <p className="field-error" id="notes-error" role="alert">
            {validation}
          </p>
        )}
        <div className="quick-topics">
          <span>Try a topic:</span>
          {topics.map((topic) => (
            <button
              type="button"
              key={topic.id}
              onClick={() => {
                onNotesChange(topic.notes);
                setValidation('');
                input.current?.focus();
              }}
            >
              {topic.label}
            </button>
          ))}
        </div>
        <div className="settings-heading">
          <span className="eyebrow form-step">
            <span>2</span> MAKE IT YOURS
          </span>
          <span>Flashcards + a matching quiz</span>
        </div>
        <div className="composer-options">
          <fieldset>
            <legend>Number of cards</legend>
            <div className="segmented">
              {([6, 8, 10] as const).map((value) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={count === value}
                  onClick={() => setCount(value)}
                >
                  {value}
                  {count === value && <Check size={13} />}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Learning level</legend>
            <div className="segmented">
              {levels.map((level) => (
                <button
                  type="button"
                  key={level.value}
                  aria-pressed={difficulty === level.value}
                  onClick={() => setDifficulty(level.value)}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
        {error && (
          <div className="feedback-panel error-panel" role="alert">
            <AlertCircle size={20} />
            <div>
              <strong>
                {error.code === 'NOT_CONFIGURED'
                  ? 'Live AI isn’t configured'
                  : 'Couldn’t create your study set'}
              </strong>
              <p>{error.message}</p>
              {error.retryable && (
                <button type="submit" className="text-button">
                  Try again <ArrowRight size={15} />
                </button>
              )}
            </div>
          </div>
        )}
        {loading ? (
          <div className="generation-progress" role="status" aria-live="polite">
            <div className="generating-copy">
              <LoaderCircle size={19} className="spin" />
              <span>
                {state.status === 'slow'
                  ? 'Still preparing your study set…'
                  : 'Finding the important things…'}
              </span>
              <button
                className="icon-button"
                type="button"
                onClick={onCancel}
                aria-label="Cancel generation"
              >
                <X size={19} />
              </button>
            </div>
            <div className="progress-track indeterminate-track">
              <span />
            </div>
            <p>
              {state.status === 'slow'
                ? 'Your notes are still here. You can cancel and try again.'
                : 'Creating flashcards and a matching quiz.'}
            </p>
          </div>
        ) : (
          <button type="submit" className="primary-button generate-button">
            <Sparkles size={18} />
            {error?.retryable ? 'Create study set again' : 'Create study set'}
            <ArrowRight size={18} />
          </button>
        )}
        <p className="composer-footnote">Your study sets stay in this browser.</p>
      </form>
    </section>
  );
}

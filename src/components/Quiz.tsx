import { useEffect, useState } from 'react';
import { ArrowRight, Check, CircleCheck, Lightbulb, RotateCcw, Trophy, X } from 'lucide-react';
import type { StudySet } from '../../shared/schema';

type QuizPhase =
  | { status: 'choosing'; selected: number | null }
  | { status: 'checked'; selected: number }
  | { status: 'finished' };
interface QuizRound {
  indices: number[];
  answers: Record<number, number>;
  position: number;
  review: boolean;
  phase: QuizPhase;
}

export function Quiz({ set, onCards }: { set: StudySet; onCards: () => void }) {
  const [round, setRound] = useState<QuizRound>(() => ({
    indices: set.quiz.map((_, index) => index),
    answers: {},
    position: 0,
    review: false,
    phase: { status: 'choosing', selected: null },
  }));
  const { indices, answers, position, phase } = round;
  const selected = phase.status === 'finished' ? null : phase.selected;
  const checked = phase.status === 'checked';
  const finished = phase.status === 'finished';
  const isRetest = round.review;
  const index = indices[position];
  const question = set.quiz[index];
  const wrong = indices.filter((item) => answers[item] !== set.quiz[item].correctIndex);
  const correct = indices.length - wrong.length;

  const select = (selected: number) =>
    setRound((current) =>
      current.phase.status === 'choosing'
        ? { ...current, phase: { status: 'choosing', selected } }
        : current,
    );

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        event.altKey ||
        event.metaKey ||
        event.ctrlKey ||
        (event.target instanceof Element &&
          event.target.closest('input, textarea, select, [contenteditable], dialog')) ||
        checked ||
        finished
      )
        return;
      if (['1', '2', '3', '4'].includes(event.key)) {
        event.preventDefault();
        select(Number(event.key) - 1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [checked, finished]);

  const restart = (missedOnly: boolean) => {
    const next = missedOnly ? wrong : set.quiz.map((_, index) => index);
    if (!finished || next.length === 0) return;
    setRound({
      indices: next,
      answers: {},
      position: 0,
      review: missedOnly,
      phase: { status: 'choosing', selected: null },
    });
  };
  const checkAnswer = () =>
    setRound((current) => {
      if (current.phase.status !== 'choosing' || current.phase.selected === null) return current;
      const selected = current.phase.selected;
      return {
        ...current,
        answers: { ...current.answers, [current.indices[current.position]]: selected },
        phase: { status: 'checked', selected },
      };
    });
  const next = () =>
    setRound((current) => {
      if (current.phase.status !== 'checked') return current;
      return current.position === current.indices.length - 1
        ? { ...current, phase: { status: 'finished' } }
        : {
            ...current,
            position: current.position + 1,
            phase: { status: 'choosing', selected: null },
          };
    });

  if (finished)
    return (
      <section className="quiz-results panel page-enter" aria-labelledby="results-heading">
        <span className="results-icon">
          <Trophy size={25} />
        </span>
        <div className="eyebrow">
          {isRetest ? 'ANOTHER STEP FORWARD' : 'A LITTLE WISER ALREADY'}
        </div>
        <h2 id="results-heading">
          {wrong.length === 0 ? 'That knowledge is sticking.' : 'Progress, one question at a time.'}
        </h2>
        <p>
          {wrong.length === 0
            ? 'Every question answered correctly. Give yourself a little credit.'
            : 'The tricky bits are where the learning happens. Let’s revisit them.'}
        </p>
        <div
          className="score-ring"
          style={
            { '--score': `${Math.round((correct / indices.length) * 100)}%` } as React.CSSProperties
          }
        >
          <div>
            <strong>
              {Math.round((correct / indices.length) * 100)}
              <span>%</span>
            </strong>
            <small>THIS ROUND</small>
          </div>
        </div>
        <div className="score-details">
          <span>
            <CircleCheck size={16} />
            <strong>{correct}</strong> correct
          </span>
          <span>
            <RotateCcw size={16} />
            <strong>{wrong.length}</strong> to revisit
          </span>
        </div>
        <div className="results-actions">
          {wrong.length > 0 && (
            <button className="primary-button" onClick={() => restart(true)}>
              Practice {wrong.length} missed {wrong.length === 1 ? 'question' : 'questions'}
              <ArrowRight size={17} />
            </button>
          )}
          <button className="secondary-button" onClick={() => restart(false)}>
            <RotateCcw size={16} /> Retake full quiz
          </button>
          <button className="text-button" onClick={onCards}>
            Back to flashcards
          </button>
        </div>
      </section>
    );

  return (
    <section className="quiz-view panel page-enter" aria-labelledby="quiz-heading">
      <div className="quiz-topline">
        <span className="eyebrow">
          {isRetest ? 'PRACTICE THE TRICKY BITS' : 'LET’S SEE WHAT STUCK'}
        </span>
        <span>
          Question <strong>{position + 1}</strong> of {indices.length}
        </span>
      </div>
      <div
        className="progress-track quiz-progress"
        role="progressbar"
        aria-label="Quiz progress"
        aria-valuemin={0}
        aria-valuemax={indices.length}
        aria-valuenow={position + (checked ? 1 : 0)}
        aria-valuetext={`Question ${position + 1} of ${indices.length}`}
      >
        <span style={{ width: `${((position + (checked ? 1 : 0)) / indices.length) * 100}%` }} />
      </div>
      <h2 id="quiz-heading">{question.question}</h2>
      <p className="quiz-instruction">Choose the answer that feels right. No rush.</p>
      <div className="quiz-options" role="group" aria-label="Answer choices">
        {question.options.map((option, i) => {
          const correctOption = checked && i === question.correctIndex;
          const wrongOption = checked && selected === i && !correctOption;
          return (
            <button
              key={`${index}-${i}`}
              disabled={checked}
              aria-pressed={selected === i}
              className={`quiz-option ${selected === i ? 'selected' : ''} ${correctOption ? 'correct' : ''} ${wrongOption ? 'incorrect' : ''}`}
              onClick={() => select(i)}
            >
              <span className="option-letter">{String.fromCharCode(65 + i)}</span>
              <span>{option}</span>
              {correctOption ? (
                <Check size={18} />
              ) : wrongOption ? (
                <X size={18} />
              ) : (
                <span className="option-radio" />
              )}
            </button>
          );
        })}
      </div>
      {checked && (
        <div
          className={`feedback-panel answer-feedback ${selected === question.correctIndex ? 'feedback-correct' : 'feedback-incorrect'}`}
          role="status"
        >
          <Lightbulb size={20} />
          <div>
            <strong>
              {selected === question.correctIndex ? 'You’ve got it.' : 'A good one to remember.'}
            </strong>
            <p>{question.explanation}</p>
          </div>
        </div>
      )}
      <div className="quiz-bottom">
        <span className="quiz-key-hint">
          <span className="keycap">1</span> – <span className="keycap">4</span> to choose
        </span>
        {checked ? (
          <button className="primary-button" onClick={next}>
            {position === indices.length - 1 ? 'See my results' : 'Next question'}
            <ArrowRight size={17} />
          </button>
        ) : (
          <button className="primary-button" disabled={selected === null} onClick={checkAnswer}>
            Check answer
            <Check size={16} />
          </button>
        )}
      </div>
    </section>
  );
}

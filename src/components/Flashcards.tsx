import { useEffect, useId, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  RotateCcw,
  RotateCw,
  Shuffle,
} from 'lucide-react';
import type { SavedSession } from '../../shared/schema';

interface Props {
  session: SavedSession;
  onProgress: (known: number[]) => void;
  onQuiz: () => void;
}

export function Flashcards({ session, onProgress, onQuiz }: Props) {
  const cardTextId = useId();
  const { set, knownCards } = session;
  const [order, setOrder] = useState(() => set.cards.map((_, i) => i));
  const [position, setPosition] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const index = order[position];
  const card = set.cards[index];
  const known = knownCards.includes(index);

  const move = (delta: number) => {
    setPosition((current) => (current + delta + order.length) % order.length);
    setFlipped(false);
  };

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.metaKey ||
        event.ctrlKey ||
        (event.target as HTMLElement).closest(
          'input, textarea, select, [contenteditable]:not([contenteditable="false"]), dialog',
        )
      )
        return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        move(1);
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        move(-1);
      }
      if (event.code === 'Space' && !(event.target as HTMLElement).closest('button, a')) {
        event.preventDefault();
        setFlipped((value) => !value);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [order.length]);

  const grade = (remembered: boolean) => {
    onProgress(
      remembered
        ? [...new Set([...knownCards, index])]
        : knownCards.filter((item) => item !== index),
    );
    move(1);
  };

  const shuffle = () => {
    const next = [...order];
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    setOrder(next);
    setPosition(0);
    setFlipped(false);
  };

  return (
    <div className="flashcard-view page-enter">
      <div className="study-toolbar">
        <span>
          <span className="status-dot" /> Recall first. Reveal second.
        </span>
        <button className="subtle-button" onClick={shuffle}>
          <Shuffle size={14} /> Shuffle
        </button>
      </div>
      {knownCards.length === set.cards.length && (
        <div className="mastered-banner" role="status">
          <CircleCheck size={20} />
          <div>
            <strong>Look at you. Every card remembered.</strong>
            <span>Ready to put that knowledge to the test?</span>
          </div>
          <button className="text-button" onClick={onQuiz}>
            Take the quiz <ArrowRight size={15} />
          </button>
        </div>
      )}
      <div className="flashcard-stack">
        <button
          className={`panel flashcard ${flipped ? 'is-flipped' : ''}`}
          onClick={() => setFlipped((value) => !value)}
          aria-label={flipped ? 'Show question' : 'Flip card to reveal answer'}
          aria-describedby={cardTextId}
          aria-pressed={flipped}
        >
          <span className="flashcard-top">
            <span className="tag">{card.tag}</span>
            <span className="card-face-label">
              {flipped ? 'THE ANSWER' : 'THE QUESTION'} {known && <CircleCheck size={14} />}
            </span>
          </span>
          <span className="flashcard-content">
            <span className="card-overline">
              {flipped ? 'HOW CLOSE DID YOU GET?' : 'WHAT COMES TO MIND?'}
            </span>
            {flipped ? (
              <span className="card-answer" id={cardTextId}>
                {card.answer}
              </span>
            ) : (
              <span className="card-question" id={cardTextId}>
                {card.question}
              </span>
            )}
          </span>
          <span className="flip-hint">
            <RotateCw size={14} />{' '}
            {flipped ? 'Click to see the question' : 'Click anywhere to reveal'}
            <span className="keycap">space</span>
          </span>
        </button>
      </div>
      <div className="flashcard-navigation">
        <button className="nav-arrow" aria-label="Previous card" onClick={() => move(-1)}>
          <ArrowLeft size={19} />
        </button>
        <span>
          <strong>{position + 1}</strong> <span>/ {order.length}</span>
        </span>
        <button className="nav-arrow" aria-label="Next card" onClick={() => move(1)}>
          <ArrowRight size={19} />
        </button>
      </div>
      <div className="grade-area">
        {flipped ? (
          <>
            <p>How did you do?</p>
            <div className="grade-buttons">
              <button className="secondary-button" onClick={() => grade(false)}>
                <RotateCcw size={16} /> Still learning
              </button>
              <button className="primary-button" onClick={() => grade(true)}>
                <Check size={17} /> Got it
              </button>
            </div>
          </>
        ) : (
          <p className="grade-placeholder">Think of your answer, then flip the card.</p>
        )}
      </div>
      <p className="keyboard-hint">
        <span className="keycap">←</span>
        <span className="keycap">→</span> to navigate <span className="hint-divider">·</span>
        <span className="keycap">space</span> to flip
      </p>
    </div>
  );
}

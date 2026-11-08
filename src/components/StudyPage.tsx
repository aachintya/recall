import { useState } from 'react';
import { ArrowLeft, Check, Layers, Sparkles } from 'lucide-react';
import type { SavedSession } from '../../shared/schema';
import { Flashcards } from './Flashcards';
import { Quiz } from './Quiz';

interface Props {
  session: SavedSession;
  saved: boolean;
  onBack: () => void;
  onProgress: (knownCards: number[]) => void;
}

export function StudyPage({ session, saved, onBack, onProgress }: Props) {
  const [mode, setMode] = useState<'cards' | 'quiz'>('cards');
  const { set, knownCards, source } = session;
  const progress = Math.round((knownCards.length / set.cards.length) * 100);

  return (
    <div className="study-page page-enter">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={16} /> Back to workspace
      </button>
      <div className="study-heading">
        <div>
          <div className="study-heading-labels">
            <span className="eyebrow">{set.subject}</span>
            <span className="source-badge">
              {source === 'example' ? 'Example set' : 'AI study set'}
            </span>
          </div>
          <h1>{set.title}</h1>
          <p>{set.description}</p>
        </div>
        <span className="saved-indicator">
          {saved && <Check size={15} />} {saved ? 'Saved to library' : 'Available this session'}
        </span>
      </div>
      <div className="study-layout">
        <section className="study-main" aria-label="Study activities">
          <div className="mode-switch" role="group" aria-label="Study mode">
            <button aria-pressed={mode === 'cards'} onClick={() => setMode('cards')}>
              <Layers size={17} /> Flashcards<span>{set.cards.length}</span>
            </button>
            <button aria-pressed={mode === 'quiz'} onClick={() => setMode('quiz')}>
              <Sparkles size={17} /> Quiz<span>{set.quiz.length}</span>
            </button>
          </div>
          {mode === 'cards' ? (
            <Flashcards session={session} onProgress={onProgress} onQuiz={() => setMode('quiz')} />
          ) : (
            <Quiz set={set} onCards={() => setMode('cards')} />
          )}
        </section>
        <aside className="study-aside">
          <section className="momentum-card panel" aria-labelledby="momentum-title">
            <span className="eyebrow" id="momentum-title">
              YOUR MOMENTUM
            </span>
            <div className="mastery-count">
              <strong>
                {knownCards.length}
                <small> / {set.cards.length}</small>
              </strong>
              <span>cards remembered</span>
            </div>
            <div className="momentum-line">
              <span style={{ width: `${progress}%` }} />
            </div>
            <span className="momentum-caption">{progress}% of this set remembered</span>
            <p>
              {progress === 100
                ? 'All cards remembered. Try the quiz to check your understanding.'
                : 'Recall the answer first. Flip the card, then mark how you did.'}
            </p>
          </section>
          <button
            className="secondary-button study-mode-action"
            onClick={() => setMode(mode === 'cards' ? 'quiz' : 'cards')}
          >
            {mode === 'cards' ? (
              <>
                <Sparkles size={17} /> Test your knowledge
              </>
            ) : (
              <>
                <Layers size={17} /> Review flashcards
              </>
            )}
          </button>
          <div className="study-tip">
            <span className="eyebrow">A NOTE ON REMEMBERING</span>
            <h2>Give the answer a moment.</h2>
            <p>Trying to recall something before you see it helps it stay with you.</p>
          </div>
          {source === 'ai' && (
            <p className="ai-note">
              Check unfamiliar answers against your original notes. AI can make mistakes.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

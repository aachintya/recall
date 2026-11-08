import { ArrowUpRight, Sparkles } from 'lucide-react';
import type { GenerationRequest } from '../../shared/schema';
import type { GenerationState } from '../hooks/useGeneration';
import { topics } from '../data/examples';
import { GenerationForm } from './GenerationForm';

interface Props {
  notes: string;
  onNotesChange: (notes: string) => void;
  state: GenerationState;
  onGenerate: (request: GenerationRequest) => void;
  onCancel: () => void;
  onExample: (id: string) => void;
}

export function NewSet({ onExample, ...form }: Props) {
  return (
    <div className="create-page page-enter">
      <section className="hero" aria-labelledby="welcome-heading">
        <span className="eyebrow hero-label">
          <Sparkles size={14} /> YOUR NEXT “I GET IT” STARTS HERE
        </span>
        <h1 id="welcome-heading">
          Less cramming.
          <br />
          <em>More remembering.</em>
        </h1>
        <p>Turn a page of notes into flashcards, a quiz, and a little more confidence.</p>
      </section>
      <div className="workspace-grid">
        <GenerationForm {...form} />
        <aside className="examples-panel" aria-labelledby="examples-title">
          <span className="eyebrow">SKIP THE BLANK PAGE</span>
          <h2 id="examples-title">Try a little learning.</h2>
          <p>Open an example and see how it works.</p>
          <div className="example-list">
            {topics.map((topic, index) => (
              <button key={topic.id} className="example-card" onClick={() => onExample(topic.id)}>
                <span className="example-index" aria-hidden="true">
                  0{index + 1}
                </span>
                <span className="example-copy">
                  <span className="example-topline">{topic.subject} · 6 cards</span>
                  <span className="example-title">{topic.title}</span>
                  <span className="example-link">Explore example</span>
                </span>
                <ArrowUpRight size={19} />
              </button>
            ))}
          </div>
          <div className="study-routine">
            <span className="eyebrow">THE RECALL ROUTINE</span>
            <p>
              <span>01</span> Think before you flip.
            </p>
            <p>
              <span>02</span> Put it to the test.
            </p>
            <p>
              <span>03</span> Revisit the tricky bits.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

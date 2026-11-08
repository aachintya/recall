import { useEffect, useRef } from 'react';
import { ArrowRight, BookOpen, FileText, Lightbulb, X } from 'lucide-react';

export function HelpDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      className="help-dialog panel"
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            event.currentTarget.close();
        }
      }}
      aria-labelledby="help-title"
    >
      <button
        className="icon-button dialog-close"
        aria-label="Close help"
        onClick={() => ref.current?.close()}
      >
        <X size={20} />
      </button>
      <div className="eyebrow">SMALL STEPS. LASTING KNOWLEDGE.</div>
      <h2 id="help-title">Meet your new study ritual.</h2>
      <div className="help-step">
        <FileText size={21} />
        <div>
          <h3>Start with something you want to know.</h3>
          <p>
            Paste notes or type a topic. Choose your number of cards and how deep you’d like to go.
          </p>
        </div>
      </div>
      <div className="help-step">
        <BookOpen size={21} />
        <div>
          <h3>Think, flip, remember.</h3>
          <p>
            Answer in your head, flip the card, and mark how you did. Your remembered cards are
            saved on this device.
          </p>
        </div>
      </div>
      <div className="help-step">
        <Lightbulb size={21} />
        <div>
          <h3>Find the gaps. Fill them in.</h3>
          <p>
            Take the matching quiz, read the explanations, and practice only the questions you
            missed.
          </p>
        </div>
      </div>
      <button className="primary-button" onClick={() => ref.current?.close()}>
        Let’s learn something
        <ArrowRight size={17} />
      </button>
    </dialog>
  );
}

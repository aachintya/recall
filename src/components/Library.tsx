import { useState } from 'react';
import { ArrowRight, BookOpen, Plus, Search, Trash2 } from 'lucide-react';
import type { SavedSession } from '../../shared/schema';

interface Props {
  sessions: SavedSession[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

export function Library({ sessions, onOpen, onDelete, onCreate }: Props) {
  const [query, setQuery] = useState('');
  const filtered = sessions.filter((session) =>
    `${session.set.title} ${session.set.subject}`
      .toLocaleLowerCase()
      .includes(query.toLocaleLowerCase()),
  );
  return (
    <div className="library-page page-enter">
      <div className="section-heading">
        <div>
          <div className="eyebrow">YOUR GROWING COLLECTION</div>
          <h1>
            A little more <em>in the bank.</em>
          </h1>
          <p>Good ideas deserve a second visit. Pick up where you left off.</p>
        </div>
        <button className="primary-button" onClick={onCreate}>
          <Plus size={17} /> Create a set
        </button>
      </div>
      {sessions.length > 0 && (
        <label className="field-surface search-field">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a study set…"
            aria-label="Search study sets"
          />
          <span>
            {filtered.length} {filtered.length === 1 ? 'set' : 'sets'}
          </span>
        </label>
      )}
      {filtered.length > 0 ? (
        <div className="library-list">
          {filtered.map((session) => (
            <article className="library-card panel" key={session.id}>
              <div className="library-card-body">
                <div className="study-heading-labels">
                  <span className="eyebrow">{session.set.subject}</span>
                  <span className="source-badge">
                    {session.source === 'example' ? 'Example set' : 'AI study set'}
                  </span>
                </div>
                <h2>{session.set.title}</h2>
                <p>{session.set.description}</p>
                <div className="library-meta">
                  <span>
                    {session.set.cards.length} cards · {session.knownCards.length} remembered
                  </span>
                  <span>
                    {new Date(session.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="library-actions">
                  <button className="text-button" onClick={() => onOpen(session.id)}>
                    Continue learning <ArrowRight size={15} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Delete ${session.set.title}`}
                    onClick={() => onDelete(session.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state panel">
          <span className="empty-icon">
            {query ? <Search size={27} /> : <BookOpen size={29} />}
          </span>
          <h2>{query ? 'No sets by that name. Yet.' : 'Room for your next discovery.'}</h2>
          <p>
            {query
              ? 'Try another title or subject.'
              : 'Create your first study set or explore an example. It’ll be waiting here whenever you need it.'}
          </p>
          <button className="primary-button" onClick={query ? () => setQuery('') : onCreate}>
            {query ? 'Clear search' : 'Create my first set'}
            <ArrowRight size={16} />
          </button>
        </div>
      )}
      <p className="library-note">
        Saved on this browser · Up to 20 sets · Flashcard progress comes along, too.
      </p>
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { SavedSession, StudySet } from '../shared/schema';
import { AppShell } from './components/AppShell';
import { Library } from './components/Library';
import { NewSet } from './components/NewSet';
import { StudyPage } from './components/StudyPage';
import { examples } from './data/examples';
import { useGeneration } from './hooks/useGeneration';
import { useStudyLibrary } from './hooks/useStudyLibrary';

type Screen = { name: 'create' | 'library' } | { name: 'study'; sessionId: string };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'create' });
  const [notes, setNotes] = useState('');
  const [removed, setRemoved] = useState<SavedSession | null>(null);
  const library = useStudyLibrary();
  const active =
    screen.name === 'study'
      ? library.sessions.find((session) => session.id === screen.sessionId)
      : undefined;
  const openSet = (set: StudySet, source: SavedSession['source']) => {
    setScreen({ name: 'study', sessionId: library.saveSet(set, source) });
  };
  const generation = useGeneration((set) => openSet(set, 'ai'));
  const navigate = useCallback(
    (name: 'create' | 'library') => {
      generation.cancel();
      setScreen({ name });
    },
    [generation.cancel],
  );

  useEffect(() => {
    if (!removed) return;
    const timer = setTimeout(() => setRemoved(null), 10_000);
    return () => clearTimeout(timer);
  }, [removed]);

  return (
    <AppShell
      section={screen.name}
      subject={active?.set.subject}
      count={library.sessions.length}
      saved={library.saved}
      onNavigate={navigate}
    >
      {screen.name === 'create' && (
        <NewSet
          notes={notes}
          onNotesChange={setNotes}
          state={generation.state}
          onGenerate={generation.generate}
          onCancel={generation.cancel}
          onExample={(id) => {
            generation.cancel();
            openSet(examples[id], 'example');
          }}
        />
      )}
      {screen.name === 'library' && (
        <Library
          sessions={library.sessions}
          onCreate={() => navigate('create')}
          onOpen={(sessionId) => {
            generation.cancel();
            setScreen({ name: 'study', sessionId });
          }}
          onDelete={(id) => setRemoved(library.remove(id) ?? null)}
        />
      )}
      {screen.name === 'study' && active && (
        <StudyPage
          key={active.id}
          session={active}
          saved={library.saved}
          onBack={() => navigate('create')}
          onProgress={(knownCards) => library.remember(active.id, knownCards)}
        />
      )}
      {removed && (
        <div className="toast" role="status">
          <span>Study set removed.</span>
          <button
            className="text-button"
            onClick={() => {
              library.restore(removed);
              setRemoved(null);
            }}
          >
            Undo
          </button>
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setRemoved(null)}
          >
            <X size={17} />
          </button>
        </div>
      )}
    </AppShell>
  );
}

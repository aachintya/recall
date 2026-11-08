import { useEffect, useRef, useState, type ReactNode } from 'react';
import { BookOpen, CircleHelp, Moon, Plus, Sun } from 'lucide-react';
import { providerStatusSchema } from '../../shared/schema';
import { readTheme } from '../lib/storage';
import { Brand } from './Brand';
import { HelpDialog } from './HelpDialog';

interface Props {
  section: 'create' | 'library' | 'study';
  subject?: string;
  count: number;
  saved: boolean;
  onNavigate: (section: 'create' | 'library') => void;
  children: ReactNode;
}

export function AppShell({ section, subject, count, saved, onNavigate, children }: Props) {
  const [theme, setTheme] = useState(readTheme);
  const [help, setHelp] = useState(false);
  const [provider, setProvider] = useState<'checking' | 'configured' | 'examples' | 'unavailable'>(
    'checking',
  );
  const main = useRef<HTMLElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/health', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unavailable');
        const status = providerStatusSchema.parse(await response.json());
        if (!controller.signal.aborted) setProvider(status.configured ? 'configured' : 'examples');
      })
      .catch(() => {
        if (!controller.signal.aborted) setProvider('unavailable');
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('recall.theme', theme);
    } catch {
      /* Theme remains usable in memory. */
    }
  }, [theme]);
  useEffect(() => {
    main.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [section, subject]);
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (
        help ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        (event.target instanceof Element &&
          event.target.closest('input, textarea, select, [contenteditable], dialog'))
      )
        return;
      if (event.key.toLowerCase() === 'n') {
        event.preventDefault();
        onNavigate('create');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [help, onNavigate]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="app-header">
        <button
          className="brand-button"
          onClick={() => onNavigate('create')}
          aria-label="Recall home"
        >
          <Brand />
        </button>
        <nav className="workspace-nav" aria-label="Main navigation">
          <button
            aria-label="Create a set"
            aria-current={section === 'create' ? 'page' : undefined}
            onClick={() => onNavigate('create')}
          >
            <Plus size={17} />
            <span>Create a set</span>
          </button>
          <button
            aria-label="My library"
            aria-current={section === 'library' ? 'page' : undefined}
            onClick={() => onNavigate('library')}
          >
            <BookOpen size={17} />
            <span>My library</span>
            <span className="nav-count">{count}</span>
          </button>
        </nav>
        <div className="header-tools">
          <button className="icon-button" aria-label="How it works" onClick={() => setHelp(true)}>
            <CircleHelp size={19} />
          </button>
          <button
            className="icon-button"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            onClick={() => setTheme((value) => (value === 'light' ? 'dark' : 'light'))}
          >
            {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
          </button>
        </div>
      </header>
      <div className="workspace-context">
        <span>{section === 'study' ? subject : 'Your study notebook'}</span>
        <span className="connection-status">
          <span className="status-dot" />
          {
            {
              checking: 'Checking AI',
              configured: 'Live AI configured',
              examples: 'Example sets ready',
              unavailable: 'AI status unavailable',
            }[provider]
          }
        </span>
      </div>
      {!saved && (
        <p className="storage-notice" role="status">
          This browser couldn’t save your changes. Keep this page open to continue studying; this
          session will be lost when you close it.
        </p>
      )}
      <main id="main" ref={main} tabIndex={-1} className="main-content">
        {children}
      </main>
      <footer className="app-footer">
        <span>A little learning, every day.</span>
        <span>
          Saved on this device · <kbd>N</kbd> new set
        </span>
      </footer>
      {help && <HelpDialog onClose={() => setHelp(false)} />}
    </div>
  );
}

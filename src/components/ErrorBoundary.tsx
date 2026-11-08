import { Component, type ErrorInfo, type ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(_error: Error, _info: ErrorInfo) {
    /* Do not log study content. */
  }
  render() {
    if (this.state.failed)
      return (
        <main className="empty-state panel error-fallback">
          <h1>Let’s start fresh.</h1>
          <p>Something unexpected happened. Your saved study sets are still in this browser.</p>
          <button className="primary-button" onClick={() => window.location.reload()}>
            Reload Recall
          </button>
        </main>
      );
    return this.props.children;
  }
}

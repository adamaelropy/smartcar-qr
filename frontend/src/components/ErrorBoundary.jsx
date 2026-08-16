import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="page-shell">
          <section className="surface-card">
            <p className="eyebrow">Something went wrong</p>
            <h1>Unexpected error</h1>
            <p className="state-message state-message--error">
              An unexpected error occurred while loading this page. Please refresh or try again later.
            </p>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message || 'Something went wrong' };
  }

  componentDidCatch(err: Error) {
    console.error('UI error:', err);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ color: '#6b6b6b', marginBottom: 20 }}>{this.state.message}</p>
          <button type="button" className="btn btn--primary" onClick={() => window.location.assign('/')}>
            Back to home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

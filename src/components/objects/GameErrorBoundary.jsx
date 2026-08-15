import React from 'react';
import { recordGameError } from '../utils/gameDiagnostics';

export default class GameErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    recordGameError(error, { source: 'react-boundary', componentStack: info?.componentStack });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ maxWidth: 720, margin: '48px auto', padding: 24, textAlign: 'center' }}>
        <h2>The game hit an error</h2>
        <p>Your progression is stored locally. You can safely reload the game and keep playing.</p>
        <p style={{ opacity: .75 }}>{this.state.error.message}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => this.setState({ error: null })}>Try to recover</button>
          <button onClick={() => window.location.reload()}>Reload game</button>
          <button onClick={() => { window.location.href = '/play3'; }}>Back to maps</button>
        </div>
      </div>
    );
  }
}

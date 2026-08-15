import {StrictMode, Component, ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class ErrorBoundary extends Component<{children: ReactNode}, {error: Error | null}> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <div style={{padding:'2rem',fontFamily:'monospace',background:'#0f172a',color:'#f87171',minHeight:'100vh'}}>
          <h2 style={{color:'#fb923c'}}>⚠️ App Crash</h2>
          <pre style={{whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{err.message}</pre>
          <pre style={{fontSize:'0.75rem',color:'#94a3b8',marginTop:'1rem'}}>{err.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

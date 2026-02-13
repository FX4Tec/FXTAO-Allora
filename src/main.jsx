import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // Auto-recover from benign DOM cleanup errors (e.g., react-leaflet, sonner, or
    // invalid HTML nesting causing removeChild conflicts during navigation)
    if (error?.name === 'NotFoundError' || error?.message?.includes('removeChild')) {
      console.warn('Auto-recovering from benign removeChild error during navigation.');
      this.setState({ hasError: false, error: null });
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h1 style={{ color: '#e53e3e' }}>Algo deu errado.</h1>
          <pre style={{ color: '#718096', margin: '16px auto', maxWidth: '600px', whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ padding: '10px 24px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', marginTop: '16px' }}
          >
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
  // </React.StrictMode>,
)

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:beforeUpdate' }, '*');
  });
  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:afterUpdate' }, '*');
  });
}




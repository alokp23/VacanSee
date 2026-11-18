import React from 'react';

/**
 * VacanSee - Global Error Boundary
 * 
 * Catches JavaScript errors anywhere in the component tree,
 * logs the error, and displays a user-friendly Nothing OS error fallback
 * rather than an unhandled blank screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('VacanSee Component Error Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#111315] text-neutral-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="card p-8 max-w-lg bg-neutral-900/90 border border-neutral-800 rounded-2xl">
            <h1 className="text-2xl font-karla font-extrabold text-orange-500 mb-2">
              Something went wrong
            </h1>
            <p className="text-neutral-400 text-sm mb-4">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <button
              type="button"
              className="btn p cursor-pointer"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.hash = '#/home';
                window.location.reload();
              }}
            >
              Reload VacanSee
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


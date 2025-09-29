import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-[var(--body)]/70">
            {this.props.fallback || 'Something went wrong. Please try again.'}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

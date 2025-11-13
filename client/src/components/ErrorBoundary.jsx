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
    // You can log error info here if needed
    // console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Hide specific benign errors from the UI
      if (
        this.state.error?.message.includes("Failed to execute 'removeChild' on 'Node'")
      ) {
        return null;
      }

      return (
        <div style={{ padding: 40, textAlign: 'center', color: '#e53935', fontWeight: 600 }}>
          Something went wrong: {this.state.error?.message || 'Unknown error'}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

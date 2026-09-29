import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <main><h1>Something went wrong</h1><p>Refresh the page and try again.</p></main>;
    }
    return this.props.children;
  }
}

import React from 'react';
// @ts-ignore
import { IS_TESTING } from 'react-native-dotenv';
import Fallback from './Fallback';
import logger from 'logger';

class ErrorBoundary extends React.Component {
  static getDerivedStateFromError(_error: any) {
    return { hasError: true };
  }

  state = { hasError: false };

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {


    const customError = new Error('React Crash');

  }
  render() {
    if (this.state.hasError) {
      return <Fallback />;
    }

    return this.props.children;
  }
}

const NoErrorBoundary = ({ children }: { children: React.ReactChild }) =>
  children;

const DefaultBoundary = IS_TESTING ? NoErrorBoundary : ErrorBoundary;

export default DefaultBoundary;

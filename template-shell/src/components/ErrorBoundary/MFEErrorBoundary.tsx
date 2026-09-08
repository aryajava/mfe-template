import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { MFEErrorFallback } from '@template/shared';

interface Props { children: ReactNode; mfeName: string; }
interface State { hasError: boolean; error?: Error; }

export class MFEErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[MFEErrorBoundary] Error in ${this.props.mfeName}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <MFEErrorFallback
          mfeName={this.props.mfeName}
          error={this.state.error}
          resetErrorBoundary={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }

    return this.props.children;
  }
}

export default MFEErrorBoundary;

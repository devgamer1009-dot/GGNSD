/**
 * Error Boundary and Reporting Component
 * P24 - Catches React errors and displays user-friendly error screen
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Log error for debugging
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);
    
    // Send to error reporting service (if configured)
    this.reportError(error, errorInfo);
  }

  private reportError(error: Error, errorInfo: ErrorInfo): void {
    // Send to error tracking service
    // Example: Sentry, LogRocket, etc.
    // Sentry.captureException(error, { extra: errorInfo });
    
    console.log('[ErrorBoundary] Error reported to tracking service');
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleReport = (): void => {
    const { error, errorInfo } = this.state;
    
    // Create error report
    const report = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      error: {
        message: error?.message,
        stack: error?.stack
      },
      componentStack: errorInfo?.componentStack,
      version: '1.0.0' // TODO: Get from build config
    };
    
    // Copy to clipboard
    const reportText = JSON.stringify(report, null, 2);
    navigator.clipboard.writeText(reportText).then(() => {
      alert('Error report copied to clipboard. Please share this with the development team.');
    }).catch(() => {
      // Fallback: show in modal
      alert(`Error Report:\n\n${reportText}`);
    });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 99999
        }}>
          <div style={{
            maxWidth: '600px',
            background: 'rgba(0, 0, 0, 0.8)',
            border: '2px solid #c8a96e',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '64px',
              marginBottom: '20px'
            }}>
              ⚔️
            </div>
            
            <h1 style={{
              color: '#c8a96e',
              fontSize: '32px',
              marginBottom: '15px',
              fontFamily: 'Georgia, serif'
            }}>
              A Critical Error Occurred
            </h1>
            
            <p style={{
              color: '#e0d8c8',
              fontSize: '16px',
              lineHeight: '1.6',
              marginBottom: '25px'
            }}>
              The game has encountered an unexpected error. Your progress is safely saved.
              Please try reloading the game or report this issue to help us improve.
            </p>
            
            <div style={{
              background: 'rgba(200, 169, 110, 0.1)',
              border: '1px solid #c8a96e',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '25px',
              textAlign: 'left'
            }}>
              <div style={{
                color: '#c8a96e',
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}>
                Error Details:
              </div>
              <div style={{
                color: '#e0d8c8',
                fontSize: '12px',
                fontFamily: 'monospace',
                wordBreak: 'break-word'
              }}>
                {this.state.error?.message || 'Unknown error'}
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={this.handleReload}
                style={{
                  background: '#c8a96e',
                  color: '#0a0a0f',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 30px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontFamily: 'Georgia, serif',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#d4b87a';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#c8a96e';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                🔄 Reload Game
              </button>
              
              <button
                onClick={this.handleReport}
                style={{
                  background: 'transparent',
                  color: '#c8a96e',
                  border: '2px solid #c8a96e',
                  borderRadius: '8px',
                  padding: '12px 30px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontFamily: 'Georgia, serif',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(200, 169, 110, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                📋 Report Error
              </button>
            </div>
            
            <div style={{
              marginTop: '30px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(200, 169, 110, 0.3)',
              color: '#888',
              fontSize: '12px'
            }}>
              <p>Version: 1.0.0 | Build: {new Date().toISOString().split('T')[0]}</p>
              <p style={{ marginTop: '5px' }}>
                If this error persists, please contact support with the error report.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Global error handler for uncaught errors
 */
export function setupGlobalErrorHandlers(): void {
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Global] Unhandled promise rejection:', event.reason);
    
    // Optionally show error UI
    // showErrorScreen(event.reason);
  });
  
  // Catch uncaught errors
  window.addEventListener('error', (event) => {
    console.error('[Global] Uncaught error:', event.error);
    
    // Optionally show error UI
    // showErrorScreen(event.error);
  });
}

/**
 * Error reporting utility
 */
export class ErrorReporter {
  private static instance: ErrorReporter;
  private errors: Array<{
    timestamp: string;
    error: Error;
    context?: string;
  }> = [];

  private constructor() {}

  static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter();
    }
    return ErrorReporter.instance;
  }

  report(error: Error, context?: string): void {
    const errorReport = {
      timestamp: new Date().toISOString(),
      error,
      context
    };

    this.errors.push(errorReport);

    // Log to console
    console.error('[ErrorReporter]', error.message, context);

    // In production, send to error tracking service
    // Note: Environment detection would be done at build time
    this.sendToService(errorReport);
  }

  private sendToService(errorReport: any): void {
    // Implement error tracking service integration
    // Example: Sentry, LogRocket, Bugsnag, etc.
    
    // For now, just log
    console.log('[ErrorReporter] Would send to tracking service:', errorReport);
  }

  getErrors(): Array<any> {
    return [...this.errors];
  }

  clear(): void {
    this.errors = [];
  }
}

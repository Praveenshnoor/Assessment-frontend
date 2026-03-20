import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log error to console only in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Frontend Crash Caught by ErrorBoundary:', error, errorInfo);
        }
        // In production, you could send this to an error reporting service
    }

    render() {
        if (this.state.hasError) {
            // Accessible fallback UI
            return (
                <div className="min-h-screen bg-shnoor-lavender flex flex-col items-center justify-center px-4" role="alert" aria-live="assertive">
                    <div className="max-w-md w-full bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] p-8 text-center border-t-4 border-shnoor-danger">
                        <div className="w-20 h-20 mx-auto bg-shnoor-dangerLight rounded-full flex items-center justify-center mb-6" aria-hidden="true">
                            <svg className="w-10 h-10 text-shnoor-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <h1 className="text-2xl font-bold text-shnoor-navy mb-4">Oops! Something went wrong.</h1>
                        <p className="text-shnoor-indigoMedium mb-8 text-sm">
                            The application encountered an unexpected error and couldn't continue. We apologize for the inconvenience.
                        </p>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3 px-4 bg-shnoor-indigo hover:bg-shnoor-navy rounded-lg text-white font-medium transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-shnoor-indigo focus:ring-offset-2"
                            aria-label="Reload the page to try again"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
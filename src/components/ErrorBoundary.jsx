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
        // You can also log the error to an error reporting service here
        console.error('Frontend Crash Caught by ErrorBoundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="min-h-screen bg-shnoor-lavender flex flex-col items-center justify-center px-4">
                    <div className="max-w-md w-full bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] p-6 sm:p-8 text-center border-t-4 border-shnoor-danger">
                        <div className="w-20 h-20 mx-auto bg-shnoor-dangerLight rounded-full flex items-center justify-center mb-6">
                            <svg className="w-10 h-10 text-shnoor-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <h2 className="text-2xl font-bold text-shnoor-navy mb-4">Oops! Something went wrong.</h2>
                        <p className="text-shnoor-indigoMedium mb-8 text-sm">
                            The application encountered an unexpected error and couldn't continue. We apologize for the inconvenience.
                        </p>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3 px-4 bg-shnoor-indigo hover:bg-shnoor-navy rounded-lg text-white font-medium transition-colors shadow-md hover:shadow-lg"
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
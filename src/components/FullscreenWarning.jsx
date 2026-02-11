const FullscreenWarning = ({ onEnterFullscreen }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md mx-4">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Fullscreen Mode Required
                    </h3>

                    <p className="text-gray-600 mb-6">
                        This examination must be taken in fullscreen mode for security purposes. Please click the button below to enter fullscreen.
                    </p>

                    <button
                        onClick={onEnterFullscreen}
                        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
                    >
                        Enter Fullscreen Mode
                    </button>

                    <p className="text-xs text-gray-500 mt-4">
                        Press ESC to exit fullscreen will trigger a warning
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FullscreenWarning;

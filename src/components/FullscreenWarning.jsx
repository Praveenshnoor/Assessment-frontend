const FullscreenWarning = ({ onEnterFullscreen }) => {
    return (
        <div className="fixed inset-0 bg-shnoor-navy/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md mx-4 border border-shnoor-mist">
                <div className="text-center">
                    <div className="w-16 h-16 bg-shnoor-dangerLight rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-shnoor-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>

                    <h3 className="text-xl font-bold text-shnoor-navy mb-2">
                        Fullscreen Mode Required
                    </h3>

                    <p className="text-shnoor-indigoMedium mb-6 leading-relaxed">
                        This examination must be taken in fullscreen mode for security purposes. Please click the button below to enter fullscreen.
                    </p>

                    <button
                        onClick={onEnterFullscreen}
                        className="w-full px-6 py-3 bg-shnoor-indigo hover:bg-[#6b6be5] hover:shadow-[0_0_20px_rgba(107,107,229,0.4)] text-white font-bold rounded-xl transition-all shadow-sm hover:-translate-y-0.5"
                        >
                        Enter Fullscreen Mode
                    </button>

                    <p className="text-xs text-shnoor-indigoMedium mt-4 font-medium">
                        Press ESC to exit fullscreen will trigger a warning
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FullscreenWarning;

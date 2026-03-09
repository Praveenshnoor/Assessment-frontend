import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../config/api';

const ServerDown = () => {
    const navigate = useNavigate();
    // Attempt to get the last known retry timer from localStorage, default to 5 minutes
    const savedTimer = parseInt(localStorage.getItem('retry_timer_minutes') || '5', 10);
    const [timeLeft, setTimeLeft] = useState(savedTimer * 60); // in seconds
    const [isRetrying, setIsRetrying] = useState(false);

    useEffect(() => {
        // Check health immediately on mount, just in case
        checkServerHealth();

        const timerInterval = setInterval(() => {
            setTimeLeft((prevTime) => {
                if (prevTime <= 1) {
                    checkServerHealth();
                    return savedTimer * 60; // reset timer after check
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(timerInterval);
    }, [savedTimer]);

    const checkServerHealth = async () => {
        setIsRetrying(true);
        try {
            const response = await fetch(getApiUrl('/api/settings/public'));
            if (response.ok) {
                // Server is back!
                // We navigate back to home or the previous page
                const redirectUrl = sessionStorage.getItem('redirect_after_recovery') || '/';
                sessionStorage.removeItem('redirect_after_recovery');
                window.location.href = redirectUrl;
            }
        } catch (error) {
            // Still down
            console.log('Server still down, retrying later...');
        } finally {
            setIsRetrying(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="min-h-screen bg-shnoor-lavender flex flex-col items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] p-8 text-center border-t-4 border-shnoor-danger">
                <div className="w-20 h-20 mx-auto bg-shnoor-dangerLight rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-shnoor-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <h2 className="text-2xl font-bold text-shnoor-navy mb-4">Connection Lost</h2>
                <p className="text-shnoor-indigoMedium mb-8">
                    We're unable to connect to the server. This could be due to a network disruption. Don't worry, we are continuously trying to reconnect.
                </p>

                <div className="bg-shnoor-lavender/50 rounded-lg p-6 mb-6 border border-shnoor-light">
                    <p className="text-sm text-shnoor-soft mb-2 uppercase tracking-wide font-semibold">Auto-Retrying In</p>
                    <div className="text-4xl font-mono font-bold text-shnoor-indigo">
                        {formatTime(timeLeft)}
                    </div>
                </div>

                <button
                    onClick={checkServerHealth}
                    disabled={isRetrying}
                    className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors shadow-md ${isRetrying ? 'bg-shnoor-light cursor-not-allowed' : 'bg-shnoor-indigo hover:bg-shnoor-navy hover:shadow-lg'
                        }`}
                >
                    {isRetrying ? 'Checking Connection...' : 'Try Now'}
                </button>
            </div>
        </div>
    );
};

export default ServerDown;
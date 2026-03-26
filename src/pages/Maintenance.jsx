import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../config/api';

const Maintenance = () => {
    const navigate = useNavigate();
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Try to get the exact message from localStorage if it was saved during the 503 error
        const savedMessage = localStorage.getItem('maintenance_message');
        if (savedMessage) {
            setMessage(savedMessage);
        } else {
            setMessage('The system is currently undergoing scheduled maintenance. Please check back later.');
        }

        // Occasionally check if maintenance is lifted
        const interval = setInterval(async () => {
            try {
                const response = await fetch(getApiUrl('/api/settings/public'));
                if (response.ok) {
                    const data = await response.json();
                    if (data.settings && !data.settings.maintenance_mode) {
                        const redirectUrl = sessionStorage.getItem('redirect_after_recovery') || '/';
                        sessionStorage.removeItem('redirect_after_recovery');
                        navigate(redirectUrl, { replace: true });
                    }
                }
            } catch (error) {
                // Ignore, maybe server is down
            }
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-shnoor-lavender flex flex-col items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] p-6 sm:p-8 text-center border-t-4 border-shnoor-warning">
                <div className="w-20 h-20 mx-auto bg-shnoor-warningLight rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-shnoor-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>

                <h2 className="text-2xl font-bold text-shnoor-navy mb-4">Under Maintenance</h2>
                <p className="text-shnoor-indigoMedium mb-8 leading-relaxed">
                    {message}
                </p>

                <button
                    onClick={() => window.location.reload()}
                    className="w-full py-3 px-4 bg-shnoor-indigo hover:bg-shnoor-navy shadow-md hover:shadow-lg rounded-lg text-white font-medium transition-colors"
                >
                    Refresh Page
                </button>
            </div>
        </div>
    );
};

export default Maintenance;
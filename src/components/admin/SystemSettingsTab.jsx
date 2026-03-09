import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../config/api';
import { Save, AlertTriangle, Clock } from 'lucide-react';
import Card from '../Card';
import Button from '../Button';

const SystemSettingsTab = () => {
    const [settings, setSettings] = useState({
        retry_timer_minutes: 5,
        maintenance_mode: false,
        maintenance_message: 'The system is currently undergoing scheduled maintenance. Please check back later.'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await apiFetch('api/settings', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success && data.settings) {
                setSettings(data.settings);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            setMessage({ type: 'error', text: 'Failed to load system settings' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage({ type: '', text: '' });
        try {
            const token = localStorage.getItem('adminToken');
            const response = await apiFetch('api/settings', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    retry_timer_minutes: parseInt(settings.retry_timer_minutes, 10),
                    maintenance_mode: settings.maintenance_mode,
                    maintenance_message: settings.maintenance_message
                })
            });
            const data = await response.json();
            if (data.success) {
                setMessage({ type: 'success', text: 'Settings updated successfully!' });

                // Also update local storage for the frontend to pick up if it crashes
                localStorage.setItem('retry_timer_minutes', settings.retry_timer_minutes);
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to update settings' });
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: 'Error saving system settings' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-shnoor-navy">Loading settings...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-shnoor-navy">System Settings</h2>
                    <p className="text-shnoor-soft mt-1">Configure global application behaviors and maintenance modes.</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center space-x-2 bg-shnoor-indigo hover:bg-shnoor-navy text-white px-6 py-2.5 rounded-lg shadow-md transition-all"
                >
                    <Save size={18} />
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </Button>
            </div>

            {message.text && (
                <div className={`p-4 rounded-lg mb-6 ${message.type === 'error' ? 'bg-shnoor-dangerLight text-shnoor-danger border border-shnoor-dangerLight' : 'bg-shnoor-successLight text-shnoor-success border border-shnoor-successLight'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Disaster Recovery Settings */}
                <Card className="p-6 border border-shnoor-light shadow-sm">
                    <div className="flex items-center mb-4 space-x-2 text-shnoor-indigo">
                        <Clock size={24} />
                        <h3 className="text-lg font-bold">Disaster Recovery</h3>
                    </div>
                    <p className="text-sm text-shnoor-soft mb-6">
                        Configure how the frontend behaves when the backend server goes down unexpectedly.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-shnoor-navy mb-1">
                                Auto-Retry Timer (Minutes)
                            </label>
                            <input
                                type="number"
                                name="retry_timer_minutes"
                                min="1"
                                max="60"
                                value={settings.retry_timer_minutes}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-indigo focus:border-shnoor-indigo outline-none transition-all"
                            />
                            <p className="text-xs text-shnoor-navy mt-2">
                                When the server goes down, students will see a fallback screen that counts down this many minutes before automatically polling the server again.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Maintenance Mode Settings */}
                <Card className="p-6 border border-shnoor-light shadow-sm">
                    <div className="flex items-center mb-4 space-x-2 text-shnoor-warning">
                        <AlertTriangle size={24} />
                        <h3 className="text-lg font-bold">Maintenance Mode</h3>
                    </div>
                    <p className="text-sm text-shnoor-soft mb-6">
                        Manually restrict student access to the platform during scheduled updates. Admins bypass this restriction.
                    </p>

                    <div className="space-y-6">
                        <label className="flex items-center cursor-pointer">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    name="maintenance_mode"
                                    checked={settings.maintenance_mode}
                                    onChange={handleChange}
                                    className="sr-only"
                                />
                                <div className={`block w-14 h-8 rounded-full transition-colors ${settings.maintenance_mode ? 'bg-shnoor-warning' : 'bg-shnoor-lavender'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.maintenance_mode ? 'transform translate-x-6' : ''}`}></div>
                            </div>
                            <div className="ml-3 font-medium text-shnoor-navy">
                                Enable Maintenance Mode
                            </div>
                        </label>

                        {settings.maintenance_mode && (
                            <div className="animate-fadeIn">
                                <label className="block text-sm font-medium text-shnoor-navy mb-1">
                                    Maintenance Message
                                </label>
                                <textarea
                                    name="maintenance_message"
                                    value={settings.maintenance_message}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-4 py-2 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-warning focus:border-shnoor-warning outline-none transition-all resize-none"
                                    placeholder="Enter the message students will see..."
                                ></textarea>
                                <p className="text-xs text-shnoor-navy mt-2">
                                    This message is displayed prominently on the maintenance screen.
                                </p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default SystemSettingsTab;
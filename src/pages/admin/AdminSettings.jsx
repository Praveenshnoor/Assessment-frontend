import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, User } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import SystemSettingsTab from '../../components/admin/SystemSettingsTab';
import ProfileTab from '../../components/admin/ProfileTab';

const AdminSettings = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');

    const tabs = [
        {
            id: 'profile',
            label: 'Profile',
            icon: User,
            component: ProfileTab
        },
        {
            id: 'system',
            label: 'System Settings',
            icon: Settings,
            component: SystemSettingsTab
        }
    ];

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || ProfileTab;

    return (
        <AdminLayout title="Settings">
            <div className="mb-6">
                <button
                    onClick={() => navigate('/admin/dashboard')}
                    className="flex items-center gap-2 text-shnoor-indigo font-semibold hover:text-shnoor-navy transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-shnoor-light hover:shadow-md w-fit"
                >
                    <ArrowLeft size={16} />
                    Back to Dashboard
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white border border-shnoor-light shadow-[0_8px_30px_rgba(14,14,39,0.06)] rounded-xl mb-6">
                <div className="border-b border-shnoor-light">
                    <nav className="flex space-x-8 px-8 pt-6">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center space-x-2 pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-shnoor-indigo text-shnoor-indigo'
                                            : 'border-transparent text-shnoor-soft hover:text-shnoor-navy hover:border-shnoor-mist'
                                    }`}
                                >
                                    <Icon size={18} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="p-8">
                    <ActiveComponent />
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminSettings;
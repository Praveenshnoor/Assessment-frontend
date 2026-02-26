import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import SystemSettingsTab from '../../components/admin/SystemSettingsTab';

const AdminSettings = () => {
    const navigate = useNavigate();

    return (
        <AdminLayout title="System Settings">
            <div className="mb-6">
                <button
                    onClick={() => navigate('/admin/dashboard')}
                    className="flex items-center gap-2 text-shnoor-indigo font-semibold hover:text-shnoor-navy transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-shnoor-light hover:shadow-md w-fit"
                >
                    <ArrowLeft size={16} />
                    Back to Dashboard
                </button>
            </div>
            <div className="bg-white border border-shnoor-light shadow-[0_8px_30px_rgba(14,14,39,0.06)] rounded-xl p-8 mb-6">
                <SystemSettingsTab />
            </div>
        </AdminLayout>
    );
};

export default AdminSettings;
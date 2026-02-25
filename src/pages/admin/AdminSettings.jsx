import React from 'react';
import AdminLayout from '../../components/AdminLayout';
import SystemSettingsTab from '../../components/admin/SystemSettingsTab';

const AdminSettings = () => {
    return (
        <AdminLayout title="System Settings">
            <div className="bg-white border border-shnoor-light shadow-[0_8px_30px_rgba(14,14,39,0.06)] rounded-xl p-8 mb-6">
                <SystemSettingsTab />
            </div>
        </AdminLayout>
    );
};

export default AdminSettings;
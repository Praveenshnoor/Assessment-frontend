import React from 'react';
import AdminHeader from './AdminHeader';

const AdminLayout = ({ children, title = "Dashboard" }) => {
  return (
    <div className="min-h-screen bg-shnoor-lavender font-sans">
      {/* The Deep Navy Header stays locked at the top */}
      <AdminHeader title={title} />

      {/* The Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
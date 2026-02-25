import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, LogOut, Settings } from 'lucide-react';
import Button from './Button';

const AdminHeader = ({ title = "Dashboard", userName = "Admin" }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/login');
  };

  return (
    <header className="w-full bg-shnoor-navy h-[72px] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Logo icon */}
          <div className="w-12 h-12 bg-shnoor-lavender rounded-xl flex items-center justify-center font-bold text-shnoor-indigo text-xl">
            A
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Admin Dashboard</h1>
            <p className="text-shnoor-light opacity-80 text-xs">MCQ Management System</p>
          </div>
        </div>

        {/* Right Side: Proctering & Logout */}
        <div className="flex items-center gap-4">
          <Button
            variant="primary"
            className="!h-10 !px-5 text-sm bg-shnoor-indigo hover:bg-[#6b6be5] hover:shadow-[0_0_15px_rgba(107,107,229,0.4)] hover:-translate-y-0.5 transition-all border-0"
            onClick={() => navigate('/admin/live-proctoring')}
          >
            <Video size={16} className="mr-2" />
            Live Proctoring
          </Button>
          <Button
            variant="primary"
            className="!h-10 !px-5 text-sm bg-shnoor-indigo hover:bg-[#6b6be5] hover:shadow-[0_0_15px_rgba(107,107,229,0.4)] hover:-translate-y-0.5 transition-all border-0"
            onClick={() => navigate('/admin/settings')}
          >
            <Settings size={16} className="mr-2" />
            Settings
          </Button>
          <Button
            variant="secondary"
            className="!h-10 !px-5 text-sm bg-transparent hover:bg-white/10 text-white border border-white/20"
            onClick={handleLogout}
          >
            <LogOut size={16} className="mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../config/api';
import { Save, User, Lock, Eye, EyeOff } from 'lucide-react';
import Card from '../Card';
import Button from '../Button';

const ProfileTab = () => {
    const [profileData, setProfileData] = useState({
        email: '',
        full_name: '',
        phone: '',
        address: ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await apiFetch('api/admin/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success && data.admin) {
                setProfileData({
                    email: data.admin.email || '',
                    full_name: data.admin.full_name || '',
                    phone: data.admin.phone || '',
                    address: data.admin.address || ''
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            setMessage({ type: 'error', text: 'Failed to load profile data' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleUpdateProfile = async () => {
        setIsSaving(true);
        setMessage({ type: '', text: '' });
        try {
            const token = localStorage.getItem('adminToken');
            const response = await apiFetch('api/admin/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: profileData.email,
                    full_name: profileData.full_name,
                    phone: profileData.phone,
                    address: profileData.address
                })
            });
            const data = await response.json();
            if (data.success) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({ type: 'error', text: 'Error updating profile' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'New password must be at least 6 characters long' });
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
            return;
        }

        setIsSaving(true);
        setMessage({ type: '', text: '' });
        try {
            const token = localStorage.getItem('adminToken');
            const response = await apiFetch('api/admin/change-password', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });
            const data = await response.json();
            if (data.success) {
                setMessage({ type: 'success', text: 'Password changed successfully!' });
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to change password' });
            }
        } catch (error) {
            console.error('Error changing password:', error);
            setMessage({ type: 'error', text: 'Error changing password' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-shnoor-navy">Loading profile...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-shnoor-navy">Profile Settings</h2>
                <p className="text-shnoor-soft mt-1">Manage your account details and security settings.</p>
            </div>

            {message.text && (
                <div className={`p-4 rounded-lg mb-6 ${message.type === 'error' ? 'bg-shnoor-dangerLight text-shnoor-danger border border-shnoor-dangerLight' : 'bg-shnoor-successLight text-shnoor-success border border-shnoor-successLight'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                {/* Profile Information */}
                <Card className="p-6 border border-shnoor-light shadow-sm">
                    <div className="flex items-center mb-4 space-x-2 text-shnoor-indigo">
                        <User size={24} />
                        <h3 className="text-lg font-bold">Profile Information</h3>
                    </div>
                    <p className="text-sm text-shnoor-soft mb-6">
                        Update your basic account information.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-shnoor-navy mb-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                name="full_name"
                                value={profileData.full_name}
                                onChange={handleProfileChange}
                                className="w-full px-4 py-2 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-indigo focus:border-shnoor-indigo outline-none transition-all"
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-shnoor-navy mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={profileData.email}
                                onChange={handleProfileChange}
                                className="w-full px-4 py-2 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-indigo focus:border-shnoor-indigo outline-none transition-all"
                                placeholder="Enter your email address"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-shnoor-navy mb-1">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={profileData.phone}
                                onChange={handleProfileChange}
                                className="w-full px-4 py-2 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-indigo focus:border-shnoor-indigo outline-none transition-all"
                                placeholder="Enter your phone number"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-shnoor-navy mb-1">
                                Address
                            </label>
                            <input
                                type="text"
                                name="address"
                                value={profileData.address}
                                onChange={handleProfileChange}
                                className="w-full px-4 py-2 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-indigo focus:border-shnoor-indigo outline-none transition-all"
                                placeholder="Enter your address"
                            />
                        </div>
                    </div>

                    <div className="mt-6">
                        <Button
                            onClick={handleUpdateProfile}
                            disabled={isSaving}
                            className="w-full md:w-auto flex items-center justify-center space-x-2 bg-shnoor-indigo hover:bg-shnoor-navy text-white px-6 py-2.5 rounded-lg shadow-md transition-all"
                        >
                            <Save size={18} />
                            <span>{isSaving ? 'Updating...' : 'Update Profile'}</span>
                        </Button>
                    </div>
                </Card>

                {/* Change Password */}
                <Card className="p-6 border border-shnoor-light shadow-sm">
                    <div className="flex items-center mb-4 space-x-2 text-shnoor-warning">
                        <Lock size={24} />
                        <h3 className="text-lg font-bold">Change Password</h3>
                    </div>
                    <p className="text-sm text-shnoor-soft mb-6">
                        Update your password to keep your account secure.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-shnoor-navy mb-1">
                                Current Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords.current ? "text" : "password"}
                                    name="currentPassword"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordChange}
                                    className="w-full px-4 py-2 pr-12 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-warning focus:border-shnoor-warning outline-none transition-all"
                                    placeholder="Enter current password"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('current')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-shnoor-soft hover:text-shnoor-navy"
                                >
                                    {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-shnoor-navy mb-1">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords.new ? "text" : "password"}
                                    name="newPassword"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    className="w-full px-4 py-2 pr-12 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-warning focus:border-shnoor-warning outline-none transition-all"
                                    placeholder="Enter new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('new')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-shnoor-soft hover:text-shnoor-navy"
                                >
                                    {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-shnoor-navy mb-1">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPasswords.confirm ? "text" : "password"}
                                    name="confirmPassword"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    className="w-full px-4 py-2 pr-12 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-warning focus:border-shnoor-warning outline-none transition-all"
                                    placeholder="Confirm new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('confirm')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-shnoor-soft hover:text-shnoor-navy"
                                >
                                    {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <Button
                            onClick={handleChangePassword}
                            disabled={isSaving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                            className="w-full md:w-auto flex items-center justify-center space-x-2 bg-shnoor-warning hover:bg-shnoor-warningDark text-white px-6 py-2.5 rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Lock size={18} />
                            <span>{isSaving ? 'Changing...' : 'Change Password'}</span>
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ProfileTab;
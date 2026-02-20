import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { FileSpreadsheet, ArrowLeft, LogOut, CheckCircle, Download } from 'lucide-react';
import { apiFetch } from '../../config/api';

const AdminReports = () => {
    const navigate = useNavigate();
    const [institutes, setInstitutes] = useState([]);
    const [selectedInstitutes, setSelectedInstitutes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchInstitutes();
    }, []);

    const fetchInstitutes = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await apiFetch('api/export/institutes', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (data.success) {
                const options = data.institutes.map(i => ({ value: i, label: i }));
                setInstitutes(options);
            } else {
                setError('Failed to load institutes');
            }
        } catch (err) {
            console.error('Error fetching institutes:', err);
            setError('Error loading institute list');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async () => {
        setIsDownloading(true);
        setError('');
        try {
            let queryParams = '';

            if (selectedInstitutes.length > 0) {
                // Use pipe separator instead of comma to avoid conflicts with institute names containing commas
                const values = selectedInstitutes.map(i => i.value).join('|');
                queryParams = `?institutes=${encodeURIComponent(values)}`;
            } else {
                queryParams = '?institutes=ALL';
            }

            const token = localStorage.getItem('adminToken');
            const response = await apiFetch(`api/export/students${queryParams}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Export failed');
            }

            // Handle file download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Student_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (err) {
            console.error('Download error:', err);
            setError('Failed to download report. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/admin/login');
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB]">
            {/* Header */}
            <header className="bg-[#111827] text-white shadow-2xl border-b-4 border-[#3B82F6]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center space-x-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-[#3B82F6] to-blue-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                                <span className="font-bold text-2xl text-white">A</span>
                            </div>
                            <div>
                                <h1 className="font-bold text-xl text-white">Admin Dashboard</h1>
                                <p className="text-sm text-gray-300">MCQ Management System</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                <LogOut size={20} />
                                <span className="font-medium">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/admin/dashboard')}
                    className="flex items-center text-[#374151] hover:text-[#3B82F6] mb-8 transition-colors group"
                >
                    <ArrowLeft size={22} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium">Back to Dashboard</span>
                </button>

                <div className="bg-white rounded-2xl shadow-2xl border-2 border-[#E5E7EB] overflow-hidden">
                    <div className="p-8">
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                            <div>
                                <h2 className="text-3xl font-bold text-[#111827] mb-2 flex items-center">
                                    <FileSpreadsheet className="mr-3 text-[#3B82F6]" size={32} />
                                    Student Reports
                                </h2>
                                <p className="text-[#374151] ml-11">Download candidate details in Excel format</p>
                            </div>
                        </div>

                        <div className="space-y-8 max-w-3xl">
                            <div>
                                <label className="block text-sm font-bold text-[#111827] mb-3">
                                    Filter by Institute
                                    <span className="text-[#6B7280] font-normal ml-2 text-xs">(Leave empty to download all students)</span>
                                </label>
                                <Select
                                    isMulti
                                    options={institutes}
                                    value={selectedInstitutes}
                                    onChange={setSelectedInstitutes}
                                    className="basic-multi-select"
                                    classNamePrefix="select"
                                    placeholder={isLoading ? "Loading institutes..." : "Select institutes..."}
                                    isDisabled={isLoading}
                                    isSearchable={true}
                                    isClearable={true}
                                    closeMenuOnSelect={false}
                                    menuPosition="fixed"
                                    menuPlacement="auto"
                                    filterOption={(option, inputValue) => {
                                        // Case-insensitive filtering
                                        return option.label.toLowerCase().includes(inputValue.toLowerCase());
                                    }}
                                    styles={{
                                        control: (base) => ({
                                            ...base,
                                            padding: '4px',
                                            borderRadius: '0.75rem',
                                            borderColor: '#E5E7EB',
                                            boxShadow: 'none',
                                            '&:hover': {
                                                borderColor: '#3B82F6'
                                            }
                                        }),
                                        menu: (base) => ({
                                            ...base,
                                            maxHeight: '300px',
                                            zIndex: 9999,
                                        }),
                                        menuList: (base) => ({
                                            ...base,
                                            maxHeight: '300px',
                                            overflowY: 'auto',
                                            '::-webkit-scrollbar': {
                                                width: '8px',
                                            },
                                            '::-webkit-scrollbar-track': {
                                                background: '#f1f1f1',
                                                borderRadius: '10px',
                                            },
                                            '::-webkit-scrollbar-thumb': {
                                                background: '#888',
                                                borderRadius: '10px',
                                            },
                                            '::-webkit-scrollbar-thumb:hover': {
                                                background: '#555',
                                            },
                                        }),
                                        menuPortal: (base) => ({
                                            ...base,
                                            zIndex: 9999,
                                        }),
                                        option: (base, state) => ({
                                            ...base,
                                            backgroundColor: state.isSelected 
                                                ? '#3B82F6' 
                                                : state.isFocused 
                                                ? '#EFF6FF' 
                                                : 'white',
                                            color: state.isSelected ? 'white' : '#111827',
                                            cursor: 'pointer',
                                            padding: '10px 12px',
                                        }),
                                        multiValue: (base) => ({
                                            ...base,
                                            backgroundColor: '#EFF6FF',
                                            borderRadius: '0.375rem',
                                        }),
                                        multiValueLabel: (base) => ({
                                            ...base,
                                            color: '#1E40AF',
                                            fontWeight: 500,
                                        }),
                                        multiValueRemove: (base) => ({
                                            ...base,
                                            color: '#1E40AF',
                                            ':hover': {
                                                backgroundColor: '#DBEAFE',
                                                color: '#1E3A8A',
                                            },
                                        }),
                                    }}
                                    menuPortalTarget={document.body}
                                />
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center">
                                    <LogOut className="w-5 h-5 mr-2" /> {/* Reusing LogOut as error icon, ideally AlertCircle */}
                                    {error}
                                </div>
                            )}

                            <div className="pt-4">
                                <button
                                    onClick={handleDownload}
                                    disabled={isDownloading || isLoading}
                                    className={`w-full sm:w-auto min-w-[200px] flex items-center justify-center space-x-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${(isDownloading || isLoading) ? 'opacity-70 cursor-not-allowed transform-none' : ''
                                        }`}
                                >
                                    {isDownloading ? (
                                        <>
                                            <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Download size={24} className="mr-2" />
                                            Download Excel Report
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminReports;

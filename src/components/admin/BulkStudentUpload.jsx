import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function BulkStudentUpload() {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [showResults, setShowResults] = useState(false);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Validate file type
            const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
            const isValid = validTypes.includes(selectedFile.type) || 
                           selectedFile.name.endsWith('.csv') || 
                           selectedFile.name.endsWith('.xlsx');
            
            if (!isValid) {
                alert('Please select a valid CSV or Excel file');
                return;
            }
            
            setFile(selectedFile);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            alert('Please select a file first');
            return;
        }

        setUploading(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const token = localStorage.getItem('adminToken');
            
            const response = await fetch(`${API_URL}/api/upload/students`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Upload failed');
            }

            setResult(data);
            setShowResults(true);
            
            // Clear file input
            setFile(null);
            document.getElementById('fileInput').value = '';
            
        } catch (error) {
            console.error('Upload error:', error);
            alert(error.message || 'Failed to upload students. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const downloadSampleCSV = () => {
        const csvContent = `fullname,email,contact,institute
John Doe,john.doe@example.com,1234567890,MIT University
Jane Smith,jane.smith@example.com,9876543210,Stanford University
Robert Johnson,robert.johnson@example.com,5551234567,Harvard University`;
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample-students-template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Bulk Student Upload</h2>
            
            {/* Instructions */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <h3 className="font-semibold text-blue-800 mb-2">Instructions:</h3>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                    <li>Upload a CSV or Excel file with student details</li>
                    <li>Required columns: <strong>fullname, email, institute</strong></li>
                    <li>Optional column: <strong>contact</strong></li>
                    <li>Password format: <strong>firstname@2026</strong> (automatically generated)</li>
                    <li>Students will receive an email with their credentials</li>
                </ul>
            </div>

            {/* Sample CSV Download */}
            <div className="mb-6">
                <button
                    onClick={downloadSampleCSV}
                    className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                >
                    📥 Download Sample CSV Template
                </button>
            </div>

            {/* File Upload Section */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select CSV or Excel File
                </label>
                <div className="flex items-center space-x-4">
                    <input
                        id="fileInput"
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100
                            cursor-pointer"
                    />
                </div>
                {file && (
                    <p className="mt-2 text-sm text-green-600">
                        ✓ Selected: {file.name}
                    </p>
                )}
            </div>

            {/* Upload Button */}
            <div className="mb-6">
                <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className={`px-6 py-3 rounded-md font-semibold text-white transition-colors
                        ${!file || uploading 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                >
                    {uploading ? (
                        <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading...
                        </span>
                    ) : (
                        '📤 Upload Students'
                    )}
                </button>
            </div>

            {/* Results Section */}
            {result && showResults && (
                <div className="border-t pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-gray-800">Upload Results</h3>
                        <button
                            onClick={() => setShowResults(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕ Close
                        </button>
                    </div>
                    
                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                            <p className="text-3xl font-bold text-gray-700">{result.results.total}</p>
                            <p className="text-sm text-gray-600">Total Rows</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                            <p className="text-3xl font-bold text-green-600">{result.results.success.length}</p>
                            <p className="text-sm text-green-700">Success</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg text-center">
                            <p className="text-3xl font-bold text-red-600">{result.results.errors.length}</p>
                            <p className="text-sm text-red-700">Errors</p>
                        </div>
                    </div>

                    {/* Success List */}
                    {result.results.success.length > 0 && (
                        <div className="mb-6">
                            <h4 className="font-semibold text-green-700 mb-3">
                                ✓ Successfully Created ({result.results.success.length})
                            </h4>
                            <div className="bg-green-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-green-200">
                                            <th className="text-left py-2 px-2">Name</th>
                                            <th className="text-left py-2 px-2">Email</th>
                                            <th className="text-left py-2 px-2">Institute</th>
                                            <th className="text-left py-2 px-2">Password</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.results.success.map((student, idx) => (
                                            <tr key={idx} className="border-b border-green-100">
                                                <td className="py-2 px-2">{student.fullname}</td>
                                                <td className="py-2 px-2">{student.email}</td>
                                                <td className="py-2 px-2">{student.institute}</td>
                                                <td className="py-2 px-2 font-mono text-xs">{student.password}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Error List */}
                    {result.results.errors.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-red-700 mb-3">
                                ✕ Errors ({result.results.errors.length})
                            </h4>
                            <div className="bg-red-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                                <ul className="space-y-2">
                                    {result.results.errors.map((error, idx) => (
                                        <li key={idx} className="text-sm text-red-700 border-b border-red-100 pb-2">
                                            <strong>Row {error.row}:</strong> {error.email} - {error.error}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Note about emails */}
                    {result.results.success.length > 0 && (
                        <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-500 p-4">
                            <p className="text-sm text-yellow-800">
                                📧 <strong>Note:</strong> Credential emails are being sent to all successfully created students. 
                                Please check your email service configuration if students don't receive their credentials.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default BulkStudentUpload;

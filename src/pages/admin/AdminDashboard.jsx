// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, FileSpreadsheet, LogOut, Download, ArrowLeft, 
  Trash2, Eye, Users, CheckCircle, XCircle, UserCheck, ChevronDown, ChevronRight, Video, Loader2, X
} from 'lucide-react';
import CreateTestSection from '../../components/admin/CreateTestSection';
import { apiFetch } from '../../config/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('exams');
  const [showCreateTest, setShowCreateTest] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [tests, setTests] = useState([]);
  const [studentsData, setStudentsData] = useState({});
  const [loading, setLoading] = useState(false);

  // Test Assignment States
  const [institutes, setInstitutes] = useState([]);
  const [expandedInstitutes, setExpandedInstitutes] = useState({});
  const [instituteStudents, setInstituteStudents] = useState({});
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedTest, setSelectedTest] = useState('');
  const [isLoadingInstitutes, setIsLoadingInstitutes] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Job Role/Description Modal States
  const [showJobModal, setShowJobModal] = useState(false);
  const [selectedJobTest, setSelectedJobTest] = useState(null);
  const [jobRoles, setJobRoles] = useState([]);
  const [selectedJobRoleIndex, setSelectedJobRoleIndex] = useState(0);
  const [isEditingJob, setIsEditingJob] = useState(false);
  const [isSavingJob, setIsSavingJob] = useState(false);
  const [isLoadingJobRoles, setIsLoadingJobRoles] = useState(false);

  // Derived state: Get students for the selected exam
  const selectedExamStudents = selectedExamId ? (studentsData[selectedExamId] || []) : [];
  const selectedExamDetails = tests.find(t => t.id === selectedExamId);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) navigate('/admin/login');
    else {
      fetchTests();
      if (activeTab === 'assign') {
        fetchInstitutes();
      }
    }
  }, [navigate, activeTab]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch('api/tests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        // Transform tests data to match UI expectations
        const transformedTests = data.tests.map(test => ({
          id: test.id,
          name: test.title,
          questions: test.question_count,
          attempts: 0, // Will be calculated from results
          avgScore: 0, // Will be calculated from results
          status: test.status || 'draft',
          duration: test.duration || 60,
          maxAttempts: test.max_attempts || 1,
          passingPercentage: test.passing_percentage || 50,
          startDateTime: test.start_datetime,
          endDateTime: test.end_datetime,
          jobRole: test.job_role || '',
          description: test.description || '',
          date: new Date(test.created_at).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })
        }));
        setTests(transformedTests);
        
        // Fetch results for each test
        fetchAllResults(transformedTests);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllResults = async (testsList) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch('api/export/all-results', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        // Group results by test
        const groupedResults = {};
        const testStats = {};

        data.results.forEach(result => {
          // Match by test_id if available, otherwise fall back to name matching
          let matchingTest;
          if (result.test_id) {
            matchingTest = testsList.find(t => t.id === result.test_id);
          }
          
          if (!matchingTest) {
            // Fallback to name matching
            matchingTest = testsList.find(t => 
              result.exam_name.toLowerCase().includes(t.name.toLowerCase()) ||
              t.name.toLowerCase().includes(result.exam_name.toLowerCase())
            );
          }

          if (matchingTest) {
            const testId = matchingTest.id;
            
            if (!groupedResults[testId]) {
              groupedResults[testId] = [];
              testStats[testId] = { totalScore: 0, count: 0 };
            }

            groupedResults[testId].push({
              id: result.roll_number,
              name: result.student_name,
              email: result.student_email,
              score: result.marks_obtained,
              total: result.total_marks,
              passingPercentage: result.passing_percentage || 50,
              date: new Date(result.submitted_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })
            });

            testStats[testId].totalScore += result.percentage;
            testStats[testId].count += 1;
          }
        });

        setStudentsData(groupedResults);

        // Update tests with attempts and average scores
        setTests(prevTests => prevTests.map(test => ({
          ...test,
          attempts: testStats[test.id]?.count || 0,
          avgScore: testStats[test.id]?.count 
            ? Math.round(testStats[test.id].totalScore / testStats[test.id].count)
            : 0
        })));
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const handleDeleteTest = async (testId) => {
    if (!confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/tests/${testId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Test deleted successfully');
        fetchTests(); // Refresh the list
      } else {
        alert('Failed to delete test');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete test');
    }
  };

  const handleTogglePublish = async (testId, currentStatus) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    const action = newStatus === 'published' ? 'publish' : 'unpublish';

    if (!confirm(`Are you sure you want to ${action} this test?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/tests/${testId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`Test ${action}ed successfully`);
        fetchTests(); // Refresh the list
      } else {
        alert(data.message || `Failed to ${action} test`);
      }
    } catch (error) {
      console.error('Toggle publish error:', error);
      alert(`Failed to ${action} test`);
    }
  };

  const handleCreateTestComplete = () => {
    setShowCreateTest(false);
    fetchTests(); // Refresh the list
  };

  const exportToExcel = async () => {
    // Check if there are any students who took this exam
    if (selectedExamStudents.length === 0) {
      alert('No results to export. No students have taken this exam yet.');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/export/results?testId=${selectedExamId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404) {
          alert(errorData.error || 'No results found for this exam. Please ensure students have completed the exam before exporting.');
        } else {
          alert(errorData.error || 'Failed to export results. Please try again.');
        }
        return;
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `exam_${selectedExamId}_results.xlsx`;

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export results. Please try again.');
    }
  };



  // Fetch Institutes
  const fetchInstitutes = async () => {
    try {
      setIsLoadingInstitutes(true);
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch('api/tests/institutes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setInstitutes(data.institutes);
      } else {
        console.error('Failed to fetch institutes:', data.message);
      }
    } catch (error) {
      console.error('Error fetching institutes:', error);
    } finally {
      setIsLoadingInstitutes(false);
    }
  };

  // Toggle Institute Expansion
  const toggleInstitute = async (instituteName) => {
    const isExpanded = expandedInstitutes[instituteName];
    setExpandedInstitutes(prev => ({
      ...prev,
      [instituteName]: !isExpanded
    }));

    // Fetch students if not already loaded
    if (!isExpanded && !instituteStudents[instituteName]) {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await apiFetch(`api/tests/institutes/${encodeURIComponent(instituteName)}/students`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (response.ok && data.success) {
          setInstituteStudents(prev => ({
            ...prev,
            [instituteName]: data.students
          }));
        }
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    }
  };

  // Toggle All Students from an Institute
  const toggleAllStudents = (instituteName, students) => {
    const studentIds = students.map(s => s.id);
    const allSelected = studentIds.every(id => selectedStudents.includes(id));

    if (allSelected) {
      // Deselect all from this institute
      setSelectedStudents(prev => prev.filter(id => !studentIds.includes(id)));
    } else {
      // Select all from this institute
      setSelectedStudents(prev => {
        const newSelection = [...prev];
        studentIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  // Toggle Individual Student
  const toggleStudent = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  // Assign Test to Selected Students
  const handleAssignTest = async () => {
    if (!selectedTest) {
      alert('⚠️ Please select a test to assign');
      return;
    }

    if (selectedStudents.length === 0) {
      alert('⚠️ Please select at least one student');
      return;
    }

    if (!confirm(`Assign test to ${selectedStudents.length} student(s)?`)) {
      return;
    }

    try {
      setIsAssigning(true);
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch('api/tests/assign', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test_id: parseInt(selectedTest),
          student_ids: selectedStudents
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`✅ ${data.message}`);
        setSelectedStudents([]);
        setSelectedTest('');
      } else {
        alert(`❌ ${data.message || 'Failed to assign test'}`);
      }
    } catch (error) {
      console.error('Error assigning test:', error);
      alert('❌ An error occurred while assigning the test');
    } finally {
      setIsAssigning(false);
    }
  };

  // Helper function to capitalize institute name for display
  const capitalizeInstitute = (instituteName) => {
    if (!instituteName) return '';
    return instituteName.toLowerCase().split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Handle viewing job role and description
  const handleViewJob = async (test) => {
    setSelectedJobTest(test);
    setIsEditingJob(false);
    setShowJobModal(true);
    setIsLoadingJobRoles(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/tests/${test.id}/job-roles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success && data.job_roles.length > 0) {
        const roles = data.job_roles.map(r => ({
          jobRole: r.job_role,
          jobDescription: r.job_description,
          isDefault: r.is_default
        }));
        setJobRoles(roles);
        setSelectedJobRoleIndex(0);
      } else {
        // Fallback to test's default job role
        setJobRoles([{
          jobRole: test.jobRole || '',
          jobDescription: test.description || '',
          isDefault: true
        }]);
        setSelectedJobRoleIndex(0);
      }
    } catch (error) {
      console.error('Error fetching job roles:', error);
      // Fallback to test's default job role
      setJobRoles([{
        jobRole: test.jobRole || '',
        jobDescription: test.description || '',
        isDefault: true
      }]);
      setSelectedJobRoleIndex(0);
    } finally {
      setIsLoadingJobRoles(false);
    }
  };

  // Handle saving job role and description
  const handleSaveJob = async () => {
    // Validate all job roles
    for (let i = 0; i < jobRoles.length; i++) {
      if (!jobRoles[i].jobRole.trim()) {
        alert(`Job role ${i + 1} is required`);
        return;
      }
    }

    try {
      setIsSavingJob(true);
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/tests/${selectedJobTest.id}/job-roles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          job_roles: jobRoles.map(r => ({
            job_role: r.jobRole.trim(),
            job_description: r.jobDescription.trim()
          }))
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Job roles updated successfully');
        setIsEditingJob(false);
        fetchTests(); // Refresh the list
      } else {
        alert(data.message || 'Failed to update job roles');
      }
    } catch (error) {
      console.error('Error updating job roles:', error);
      alert('Failed to update job roles');
    } finally {
      setIsSavingJob(false);
    }
  };

  const handleAddJobRole = () => {
    setJobRoles([...jobRoles, { jobRole: '', jobDescription: '', isDefault: false }]);
  };

  const handleRemoveJobRole = (index) => {
    if (jobRoles.length === 1) {
      alert('At least one job role is required');
      return;
    }
    const newJobRoles = jobRoles.filter((_, i) => i !== index);
    setJobRoles(newJobRoles);
    if (selectedJobRoleIndex >= newJobRoles.length) {
      setSelectedJobRoleIndex(newJobRoles.length - 1);
    }
  };

  const handleJobRoleChange = (index, field, value) => {
    const newJobRoles = [...jobRoles];
    newJobRoles[index][field] = value;
    setJobRoles(newJobRoles);
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
                onClick={() => navigate('/admin/reports')}
                className="flex items-center space-x-2 px-5 py-2.5 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
              >
                <FileSpreadsheet size={20} />
                <span className="font-medium">Reports</span>
              </button>
              <button
                onClick={() => navigate('/admin/live-proctoring')}
                className="flex items-center space-x-2 px-5 py-2.5 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
              >
                <Video size={20} />
                <span className="font-medium">Live Proctoring</span>
              </button>
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
        {/* Tab Navigation */}
        {!showCreateTest && !selectedExamId && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-[#E5E7EB] p-2 inline-flex space-x-2">
              {[
                { id: 'exams', label: 'Manage Exams', icon: FileSpreadsheet },
                { id: 'assign', label: 'Assign Tests', icon: UserCheck },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#3B82F6] text-white shadow-lg transform scale-105'
                      : 'text-[#374151] hover:text-[#111827] hover:bg-[#F9FAFB]'
                  }`}
                >
                  <tab.icon size={20} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Create Test Modal/Section */}
        {showCreateTest ? (
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-[#E5E7EB] p-8 mb-6">
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => setShowCreateTest(false)}
                className="flex items-center text-[#374151] hover:text-[#3B82F6] transition-colors group"
              >
                <ArrowLeft size={22} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Back to Exams</span>
              </button>
            </div>
            <CreateTestSection onComplete={handleCreateTestComplete} />
          </div>
        ) : selectedExamId ? (
          /* Detail View: Student Results for a specific exam */
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-[#E5E7EB] overflow-hidden">
            <div className="p-8">
              <button
                onClick={() => setSelectedExamId(null)}
                className="flex items-center text-[#374151] hover:text-[#3B82F6] mb-8 transition-colors group"
              >
                <ArrowLeft size={22} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Back to Exams List</span>
              </button>

              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-[#111827] mb-2">{selectedExamDetails?.name}</h2>
                  <div className="flex items-center space-x-4 text-sm text-[#374151]">
                    <span className="flex items-center">
                      <FileSpreadsheet size={16} className="mr-1" />
                      {selectedExamDetails?.questions} Questions
                    </span>
                    <span>•</span>
                    <span>Created on {selectedExamDetails?.date}</span>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={exportToExcel}
                    disabled={selectedExamStudents.length === 0}
                    className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-medium transition-all shadow-lg ${
                      selectedExamStudents.length === 0
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-[#3B82F6] hover:bg-blue-600 text-white hover:shadow-xl transform hover:-translate-y-0.5'
                    }`}
                    title={selectedExamStudents.length === 0 ? 'No results to export' : 'Export to Excel'}
                  >
                    <FileSpreadsheet size={20} />
                    <span>Export to Excel</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border-2 border-[#E5E7EB] shadow-lg">
                <table className="w-full">
                  <thead className="bg-[#111827] text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Student ID</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Student Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Date Attempted</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Score</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#E5E7EB]">
                    {selectedExamStudents.length > 0 ? (
                      selectedExamStudents.map((student, idx) => {
                        const percentage = (student.score / student.total * 100);
                        const passingPercentage = student.passingPercentage || 50;
                        const isPassed = percentage >= passingPercentage;
                        return (
                          <tr key={idx} className="hover:bg-[#F9FAFB]">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#111827]">{student.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111827]">{student.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#374151]">{student.email || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#374151]">{student.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className={`font-bold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                                  {student.score}
                                </span>
                                <span className="text-[#374151] text-xs ml-1">/ {student.total}</span>
                                <span className="text-[#374151] text-xs ml-2">({percentage.toFixed(1)}%)</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                isPassed 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {isPassed ? 'Pass' : 'Fail'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-[#374151]">
                          No students have attempted this exam yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* List View: All Exams */
          <>
            {activeTab === 'exams' && (
              <div className="bg-white rounded-xl shadow-sm border-2 border-[#E5E7EB] overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-[#111827] flex items-center">
                        <FileSpreadsheet className="mr-2 text-[#3B82F6]" size={28} />
                        Exams
                      </h2>
                      <p className="text-sm text-[#374151] mt-1">Manage all your exams and view results</p>
                    </div>
                    <button
                      onClick={() => setShowCreateTest(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-lg transition-colors shadow-sm font-semibold"
                    >
                      <Plus size={20} />
                      <span>Create Test</span>
                    </button>
                  </div>

                  {loading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6]"></div>
                      <span className="ml-3 text-[#374151]">Loading exams...</span>
                    </div>
                  ) : tests.length === 0 ? (
                    <div className="text-center py-12 text-[#374151]">
                      <FileSpreadsheet className="mx-auto mb-3 text-gray-300" size={48} />
                      <p className="font-medium">No exams found</p>
                      <p className="text-sm mt-1">Click "Create Test" to add your first exam</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {tests.map((test) => (
                        <div
                          key={test.id}
                          className="bg-white border-2 border-[#E5E7EB] rounded-xl p-6 hover:shadow-lg hover:border-[#3B82F6] transition-all group relative"
                        >
                          {/* Status Badge and Job View Button */}
                          <div className="absolute top-4 right-4 flex items-center space-x-2">
                            {test.status === 'published' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle size={12} className="mr-1" />
                                Published
                              </span>
                            ) : test.status === 'archived' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <XCircle size={12} className="mr-1" />
                                Archived
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Draft
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewJob(test);
                              }}
                              className="p-1.5 bg-blue-100 hover:bg-[#3B82F6] text-[#3B82F6] hover:text-white rounded-lg transition-colors"
                              title="View/Edit Job Details"
                            >
                              <Eye size={14} />
                            </button>
                          </div>

                          {/* Header with Icon */}
                          <div className="flex justify-between items-start mb-4">
                            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center text-[#3B82F6] font-bold text-xl group-hover:bg-[#3B82F6] group-hover:text-white transition-colors">
                              {test.name.charAt(0)}
                            </div>
                          </div>

                          {/* Exam Title */}
                          <h3 className="font-bold text-[#111827] text-lg mb-2 line-clamp-2 group-hover:text-[#3B82F6] transition-colors">
                            {test.name}
                          </h3>

                          {/* Exam Details */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-sm text-[#374151]">
                              <FileSpreadsheet size={16} className="mr-2" />
                              <span>{test.questions} Questions • {test.duration} mins</span>
                            </div>
                            <div className="flex items-center text-sm text-[#374151]">
                              <span className="text-xs">Created: {test.date}</span>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center justify-center pt-4 border-t border-[#E5E7EB] mb-4">
                            <div className="text-center">
                              <div className="flex items-center justify-center mb-1">
                                <Users size={16} className="text-[#374151] mr-1" />
                                <span className="text-lg font-bold text-[#111827]">{test.attempts}</span>
                              </div>
                              <p className="text-xs text-[#374151]">Attempted</p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2 pt-4 border-t border-[#E5E7EB]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedExamId(test.id);
                              }}
                              className="flex-1 py-2 px-3 bg-blue-100 text-[#3B82F6] hover:bg-[#3B82F6] hover:text-white rounded-lg text-sm font-medium transition-colors"
                              title="View Results"
                            >
                              <Eye size={18} className="inline mr-1" />
                              View
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTest(test.id);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Test"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'assign' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-2xl border-2 border-[#E5E7EB] p-8">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-[#111827] mb-2 flex items-center">
                      <UserCheck className="mr-3 text-[#3B82F6]" size={32} />
                      Assign Tests to Students
                    </h2>
                    <p className="text-[#374151] ml-11">Select a test and choose students to assign it to</p>
                  </div>

                  {/* Test Selection */}
                  <div className="mb-8 p-6 bg-[#F9FAFB] rounded-2xl border-2 border-[#E5E7EB] shadow-lg">
                    <label className="block text-sm font-bold text-[#111827] mb-3 flex items-center">
                      <FileSpreadsheet size={18} className="mr-2 text-[#3B82F6]" />
                      Select Test to Assign
                    </label>
                    <select
                      value={selectedTest}
                      onChange={(e) => setSelectedTest(e.target.value)}
                      className="w-full px-5 py-4 border-2 border-[#E5E7EB] rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-[#3B82F6] bg-white text-[#111827] font-medium shadow-sm hover:border-[#3B82F6] transition-all cursor-pointer"
                    >
                      <option value="">-- Choose a test --</option>
                      {tests.map((test) => (
                        <option key={test.id} value={test.id}>
                          {test.name} ({test.questions} questions • {test.duration} mins)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Students Counter */}
                  {selectedStudents.length > 0 && (
                    <div className="mb-6 p-5 bg-blue-50 rounded-2xl border-2 border-blue-200 shadow-lg transform hover:scale-[1.02] transition-transform">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-[#3B82F6] rounded-xl flex items-center justify-center shadow-lg">
                            <Users size={24} className="text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#111827]">
                              {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                            </p>
                            <p className="text-xs text-[#374151]">Ready to assign test</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedStudents([])}
                          className="px-4 py-2 bg-white hover:bg-blue-100 text-[#3B82F6] rounded-lg text-sm font-medium transition-colors shadow-sm border border-[#E5E7EB]"
                        >
                          Clear Selection
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Institutes and Students */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-[#111827] flex items-center">
                        <Users size={22} className="mr-2 text-[#3B82F6]" />
                        Select Students by Institute
                      </h3>
                      {institutes.length > 0 && (
                        <span className="text-sm text-[#374151] bg-[#F9FAFB] px-3 py-1 rounded-full border border-[#E5E7EB]">
                          {institutes.length} institute{institutes.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {isLoadingInstitutes ? (
                      <div className="flex items-center justify-center py-12 bg-[#F9FAFB] rounded-2xl border-2 border-[#E5E7EB]">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-[#3B82F6]"></div>
                        <span className="ml-3 text-[#374151] font-medium">Loading institutes...</span>
                      </div>
                    ) : institutes.length === 0 ? (
                      <div className="text-center py-16 bg-[#F9FAFB] rounded-2xl border-2 border-[#E5E7EB]">
                        <Users className="mx-auto mb-4 text-gray-300" size={64} />
                        <p className="text-[#111827] font-medium text-lg">No students registered yet</p>
                        <p className="text-[#374151] text-sm mt-2">Students will appear here once they register</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {institutes.map((institute) => {
                          const isExpanded = expandedInstitutes[institute.institute];
                          const students = instituteStudents[institute.institute] || [];
                          const allSelected = students.length > 0 && students.every(s => selectedStudents.includes(s.id));
                          const someSelected = students.some(s => selectedStudents.includes(s.id));

                          return (
                            <div 
                              key={institute.institute} 
                              className="border-2 border-[#E5E7EB] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all bg-white"
                            >
                              {/* Institute Header */}
                              <div className="bg-[#F9FAFB] p-5 flex items-center justify-between border-b-2 border-[#E5E7EB]">
                                <div className="flex items-center space-x-4 flex-1">
                                  <button
                                    onClick={() => toggleInstitute(institute.institute)}
                                    className="w-10 h-10 flex items-center justify-center bg-white hover:bg-blue-50 text-[#374151] hover:text-[#3B82F6] rounded-xl transition-all shadow-sm hover:shadow-md transform hover:scale-105 border border-[#E5E7EB]"
                                  >
                                    {isExpanded ? <ChevronDown size={22} /> : <ChevronRight size={22} />}
                                  </button>
                                  <div className="flex-1">
                                    <h4 className="font-bold text-lg text-[#111827]">
                                      {capitalizeInstitute(institute.institute)}
                                    </h4>
                                    <p className="text-sm text-[#374151] flex items-center mt-1">
                                      <Users size={14} className="mr-1" />
                                      {institute.student_count} student{institute.student_count !== 1 ? 's' : ''}
                                    </p>
                                  </div>
                                  {students.length > 0 && (
                                    <label className="flex items-center space-x-3 cursor-pointer px-4 py-2 bg-white hover:bg-blue-50 rounded-xl transition-colors shadow-sm border-2 border-[#E5E7EB] hover:border-[#3B82F6]">
                                      <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={(el) => {
                                          if (el) el.indeterminate = someSelected && !allSelected;
                                        }}
                                        onChange={() => toggleAllStudents(institute.institute, students)}
                                        className="w-5 h-5 text-[#3B82F6] border-[#E5E7EB] rounded-md focus:ring-2 focus:ring-[#3B82F6]"
                                      />
                                      <span className="text-sm font-bold text-[#111827]">Select All</span>
                                    </label>
                                  )}
                                </div>
                              </div>

                              {/* Students List */}
                              {isExpanded && (
                                <div className="p-5 bg-white">
                                  {students.length === 0 ? (
                                    <div className="flex items-center justify-center py-8">
                                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#3B82F6] mr-3"></div>
                                      <p className="text-sm text-[#374151] font-medium">Loading students...</p>
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {students.map((student) => {
                                        const isSelected = selectedStudents.includes(student.id);
                                        return (
                                          <label
                                            key={student.id}
                                            className={`flex items-center space-x-3 p-4 rounded-xl cursor-pointer transition-all border-2 ${
                                              isSelected
                                                ? 'bg-blue-50 border-[#3B82F6] shadow-md'
                                                : 'bg-white hover:bg-[#F9FAFB] border-[#E5E7EB] hover:border-[#3B82F6]/50 shadow-sm hover:shadow-md'
                                            }`}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={isSelected}
                                              onChange={() => toggleStudent(student.id)}
                                              className="w-5 h-5 text-[#3B82F6] border-[#E5E7EB] rounded-md focus:ring-2 focus:ring-[#3B82F6]"
                                            />
                                            <div className="flex-1 min-w-0">
                                              <p className={`font-bold truncate ${isSelected ? 'text-[#3B82F6]' : 'text-[#111827]'}`}>
                                                {student.full_name}
                                              </p>
                                              <p className={`text-xs truncate ${isSelected ? 'text-blue-600' : 'text-[#374151]'}`}>
                                                {student.roll_number} • {student.email}
                                              </p>
                                            </div>
                                            {isSelected && (
                                              <CheckCircle size={20} className="text-[#3B82F6] flex-shrink-0" />
                                            )}
                                          </label>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Assign Button */}
                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={handleAssignTest}
                      disabled={!selectedTest || selectedStudents.length === 0 || isAssigning}
                      className={`px-8 py-4 rounded-xl font-bold transition-all flex items-center space-x-3 text-lg shadow-lg ${
                        selectedTest && selectedStudents.length > 0 && !isAssigning
                          ? 'bg-[#3B82F6] hover:bg-blue-600 text-white hover:shadow-2xl transform hover:-translate-y-1'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed border-2 border-[#E5E7EB]'
                      }`}
                    >
                      {isAssigning && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      )}
                      <UserCheck size={22} />
                      <span>
                        {isAssigning 
                          ? 'Assigning Test...' 
                          : selectedStudents.length > 0
                            ? `Assign Test to ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`
                            : 'Assign Test'
                        }
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Job Role/Description Modal */}
      {showJobModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-[#3B82F6] to-blue-600 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedJobTest?.name}</h3>
                <p className="text-blue-100 text-sm mt-1">Job Role & Description</p>
              </div>
              <button
                onClick={() => setShowJobModal(false)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">{isLoadingJobRoles ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-[#3B82F6]" size={32} />
                  <span className="ml-3 text-[#374151]">Loading job roles...</span>
                </div>
              ) : (
                <>
                  {!isEditingJob && jobRoles.length > 1 && (
                    <div>
                      <label className="block text-sm font-bold text-[#111827] mb-2">
                        Select Job Role
                      </label>
                      <select
                        value={selectedJobRoleIndex}
                        onChange={(e) => setSelectedJobRoleIndex(parseInt(e.target.value))}
                        className="w-full px-4 py-3 border-2 border-[#E5E7EB] rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-[#3B82F6] bg-white text-[#111827] font-medium"
                      >
                        {jobRoles.map((role, index) => (
                          <option key={index} value={index}>
                            {role.jobRole}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {isEditingJob ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-bold text-[#111827]">
                          Job Roles & Descriptions
                        </label>
                        <button
                          type="button"
                          onClick={handleAddJobRole}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                        >
                          <Plus size={16} />
                          <span>Add Role</span>
                        </button>
                      </div>

                      {jobRoles.map((role, index) => (
                        <div key={index} className="p-4 border-2 border-gray-200 rounded-lg space-y-3 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-700">
                              Role {index + 1} {index === 0 && <span className="text-blue-600">(Default)</span>}
                            </span>
                            {jobRoles.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveJobRole(index)}
                                className="text-red-600 hover:text-red-700 p-1"
                                title="Remove this role"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>

                          <div>
                            <input
                              type="text"
                              value={role.jobRole}
                              onChange={(e) => handleJobRoleChange(index, 'jobRole', e.target.value)}
                              className="w-full px-4 py-3 border-2 border-[#E5E7EB] rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-[#3B82F6] bg-white text-[#111827] font-medium"
                              placeholder="e.g., Senior Software Engineer"
                            />
                          </div>

                          <div>
                            <textarea
                              value={role.jobDescription}
                              onChange={(e) => handleJobRoleChange(index, 'jobDescription', e.target.value)}
                              rows={4}
                              className="w-full px-4 py-3 border-2 border-[#E5E7EB] rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-[#3B82F6] bg-white text-[#111827] resize-none"
                              placeholder="Enter job description, requirements, responsibilities..."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-[#111827] mb-2">
                          Job Role
                        </label>
                        <div className="px-4 py-3 bg-[#F9FAFB] rounded-xl border-2 border-[#E5E7EB]">
                          <p className="text-[#111827] font-semibold">
                            {jobRoles[selectedJobRoleIndex]?.jobRole || 'Not specified'}
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#111827] mb-2">
                          Job Description
                        </label>
                        <div className="px-4 py-3 bg-[#F9FAFB] rounded-xl border-2 border-[#E5E7EB] max-h-96 overflow-y-auto">
                          <p className="text-[#374151] whitespace-pre-wrap">
                            {jobRoles[selectedJobRoleIndex]?.jobDescription || 'No description provided'}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#E5E7EB] flex justify-end space-x-3">
              {isEditingJob ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditingJob(false);
                      handleViewJob(selectedJobTest); // Reload original data
                    }}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-[#111827] rounded-xl font-medium transition-colors"
                    disabled={isSavingJob}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveJob}
                    disabled={isSavingJob}
                    className="px-6 py-3 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isSavingJob && (
                      <Loader2 className="animate-spin" size={16} />
                    )}
                    <span>{isSavingJob ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowJobModal(false)}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-[#111827] rounded-xl font-medium transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => setIsEditingJob(true)}
                    className="px-6 py-3 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
                  >
                    Edit Roles
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

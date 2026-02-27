// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, FileSpreadsheet, LogOut, Download, ArrowLeft,
  Trash2, Eye, Users, CheckCircle, XCircle, UserCheck, ChevronDown, ChevronRight, Video, Loader2, X, Building2, MoreVertical, Copy, AlertCircle, Pencil, MessageSquare, Star, TrendingUp, BarChart3, Calendar
} from 'lucide-react';
import CreateTestSection from '../../components/admin/CreateTestSection';
import ExamSearchFilter from '../../components/ExamSearchFilter';
import ViewTestDetailsModal from '../../components/admin/ViewTestDetailsModal';
import EditTestDetailsModal from '../../components/admin/EditTestDetailsModal';
import BulkStudentUpload from '../../components/admin/BulkStudentUpload';
import InstituteRegistrationControl from '../../components/admin/InstituteRegistrationControl';
import AdminReports from './AdminReports';
import { apiFetch } from '../../config/api';
import AdminHeader from '../../components/AdminHeader';
import AdminLayout from '../../components/AdminLayout';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import InputField from '../../components/InputField';
import Button from '../../components/Button';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('exams');
  const [showCreateTest, setShowCreateTest] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [tests, setTests] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [selectedStudentsForDelete, setSelectedStudentsForDelete] = useState([]);
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

  // Institute Management States
  const [allInstitutes, setAllInstitutes] = useState([]);
  const [isLoadingAllInstitutes, setIsLoadingAllInstitutes] = useState(false);
  const [newInstituteName, setNewInstituteName] = useState('');
  const [isAddingInstitute, setIsAddingInstitute] = useState(false);
  const [showRegistrationControlModal, setShowRegistrationControlModal] = useState(false);
  const [selectedInstituteForRegistration, setSelectedInstituteForRegistration] = useState(null);

  // Multi-Institute Selection States (for bulk test assignment)
  const [selectedInstitutes, setSelectedInstitutes] = useState([]);
  const [selectedTestForMultipleInstitutes, setSelectedTestForMultipleInstitutes] = useState('');
  const [isAssigningTestToMultipleInstitutes, setIsAssigningTestToMultipleInstitutes] = useState(false);

  // Assigned Tests Modal States
  const [showAssignedTestsModal, setShowAssignedTestsModal] = useState(false);
  const [selectedInstituteForTests, setSelectedInstituteForTests] = useState(null);
  const [assignedTests, setAssignedTests] = useState([]);
  const [isLoadingAssignedTests, setIsLoadingAssignedTests] = useState(false);
  const [selectedTestForInstitute, setSelectedTestForInstitute] = useState('');
  const [isAssigningTestToInstitute, setIsAssigningTestToInstitute] = useState(false);

  // Student Management States
  const [showStudentManagementModal, setShowStudentManagementModal] = useState(false);
  const [selectedInstituteForStudents, setSelectedInstituteForStudents] = useState(null);
  const [instituteStudentsForManagement, setInstituteStudentsForManagement] = useState([]);
  const [isLoadingStudentsForManagement, setIsLoadingStudentsForManagement] = useState(false);
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [selectedTestForStudentModal, setSelectedTestForStudentModal] = useState('');
  const [isAssigningTestInModal, setIsAssigningTestInModal] = useState(false);
  const [newStudentData, setNewStudentData] = useState({
    full_name: '',
    email: '',
    roll_number: '',
    institute: ''
  });
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  // Search, Filter, Sort States
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    published: 'all',
    attempted: 'all',
    dateRange: 'all'
  });
  const [sortBy, setSortBy] = useState('latest');

  // 3-Dot Menu States
  const [openMenuId, setOpenMenuId] = useState(null);

  // Clone Test Modal States
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [testToClone, setTestToClone] = useState(null);
  const [cloneTestName, setCloneTestName] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [cloneError, setCloneError] = useState('');

  // View/Edit Test Details Modal States
  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);
  const [selectedTestForDetails, setSelectedTestForDetails] = useState(null);
  const [detailViewTab, setDetailViewTab] = useState('results'); // 'results' or 'feedback'
  const [feedbackData, setFeedbackData] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // Violations Tab States
  const [violations, setViolations] = useState([]);
  const [flaggedStudents, setFlaggedStudents] = useState([]);
  const [violationSummary, setViolationSummary] = useState([]);
  const [violationsByStudent, setViolationsByStudent] = useState([]);
  const [selectedTestForViolations, setSelectedTestForViolations] = useState('');
  const [isLoadingViolations, setIsLoadingViolations] = useState(false);
  const [violationFilter, setViolationFilter] = useState('all'); // all, high, medium, low

  // Preview Questions Modal States
  const [showPreviewQuestionsModal, setShowPreviewQuestionsModal] = useState(false);
  const [previewTest, setPreviewTest] = useState(null);
  const [previewQuestions, setPreviewQuestions] = useState([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Test History Modal States
  const [showTestHistoryModal, setShowTestHistoryModal] = useState(false);
  const [testHistory, setTestHistory] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Derived state: Get students for the selected exam
  const selectedExamStudents = selectedExamId ? (studentsData[selectedExamId] || []) : [];
  const selectedExamDetails = tests.find(t => t.id === selectedExamId);

  // Fetch feedback when feedback tab is selected
  useEffect(() => {
    if (selectedExamId && detailViewTab === 'feedback') {
      fetchFeedback();
    }
  }, [selectedExamId, detailViewTab]);

  const fetchFeedback = async () => {
    setLoadingFeedback(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/feedback/test/${selectedExamId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setFeedbackData(data.feedbacks || []);
        setFeedbackStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoadingFeedback(false);
    }
  };

  // Filter and Sort Tests
  const getFilteredAndSortedTests = () => {
    let filtered = [...tests];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(test =>
        test.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Published/Draft filter
    if (filters.published !== 'all') {
      filtered = filtered.filter(test =>
        test.status === filters.published
      );
    }

    // Attempted filter (based on attempts count)
    if (filters.attempted === 'attempted') {
      filtered = filtered.filter(test => test.attempts > 0);
    } else if (filters.attempted === 'not-attempted') {
      filtered = filtered.filter(test => test.attempts === 0);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter(test => {
        const testDate = new Date(test.date);
        switch (filters.dateRange) {
          case 'today':
            return testDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return testDate >= weekAgo;
          case 'month':
            return testDate.getMonth() === now.getMonth() && testDate.getFullYear() === now.getFullYear();
          case 'year':
            return testDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    // Sort
    switch (sortBy) {
      case 'most-attempted':
        filtered.sort((a, b) => b.attempts - a.attempts);
        break;
      case 'latest':
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'duration-asc':
        filtered.sort((a, b) => a.duration - b.duration);
        break;
      case 'duration-desc':
        filtered.sort((a, b) => b.duration - a.duration);
        break;
      default:
        break;
    }

    return filtered;
  };

  const filteredTests = getFilteredAndSortedTests();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) navigate('/admin/login');
    else {
      fetchTests();
      if (activeTab === 'institutes') {
        fetchAllInstitutes();
      }
      if (activeTab === 'violations' && selectedTestForViolations) {
        fetchViolations();
      }
    }
  }, [navigate, activeTab, selectedTestForViolations]);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && !event.target.closest('.relative')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

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
              testStats[testId] = { totalScore: 0, count: 0, passed: 0 };
            }

            const isPassed = result.percentage >= (result.passing_percentage || 50);

            groupedResults[testId].push({
              id: result.roll_number,
              name: result.student_name,
              email: result.student_email,
              score: result.marks_obtained,
              total: result.total_marks,
              passingPercentage: result.passing_percentage || 50,
              date: new Date(result.submitted_at).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }),
              noFace: result.no_face_count || 0,
              multipleFaces: result.multiple_faces_count || 0,
              phoneDetected: result.phone_detected_count || 0,
              loudNoise: result.loud_noise_count || 0,
              voiceDetected: result.voice_detected_count || 0,
              totalViolations: result.total_violations || 0,
              highSeverityCount: result.high_severity_count || 0,
              flagged: (result.high_severity_count || 0) >= 3
            });

            testStats[testId].totalScore += result.percentage;
            testStats[testId].count += 1;
            if (isPassed) {
              testStats[testId].passed += 1;
            }
          }
        });

        setStudentsData(groupedResults);

        // Update tests with attempts, average scores, and pass rate
        setTests(prevTests => prevTests.map(test => ({
          ...test,
          attempts: testStats[test.id]?.count || 0,
          avgScore: testStats[test.id]?.count
            ? Math.round(testStats[test.id].totalScore / testStats[test.id].count)
            : 0,
          passedCount: testStats[test.id]?.passed || 0,
          passRate: testStats[test.id]?.count
            ? Math.round((testStats[test.id].passed / testStats[test.id].count) * 100)
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
        fetchTests(); // Refresh the test list
        // Refresh institute list if we're on the institutes tab to update test counts
        if (activeTab === 'institutes') {
          fetchAllInstitutes();
        }
      } else {
        alert('Failed to delete test');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete test');
    }
  };

  const handleBulkDeleteTests = async () => {
    if (selectedTests.length === 0) {
      alert('Please select tests to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedTests.length} test(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch('api/tests/bulk', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test_ids: selectedTests })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`Successfully deleted ${data.deleted_count} test(s)`);
        setSelectedTests([]);
        fetchTests();
        if (activeTab === 'institutes') {
          fetchAllInstitutes();
        }
      } else {
        alert(data.message || 'Failed to delete tests');
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('Failed to delete tests');
    }
  };

  const toggleTestSelection = (testId) => {
    setSelectedTests(prev =>
      prev.includes(testId)
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const toggleAllTests = () => {
    if (selectedTests.length === filteredTests.length) {
      setSelectedTests([]);
    } else {
      setSelectedTests(filteredTests.map(t => t.id));
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
    setEditingTest(null);
    fetchTests(); // Refresh the list
  };

  const handleEditTest = (test) => {
    setEditingTest(test);
    setShowCreateTest(true);
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
        // Show message about assignments
        alert(`✅ ${data.message}`);
        setSelectedStudents([]);
        setSelectedTest('');
      } else {
        // Handle case where all students already have the test
        if (data.already_assigned > 0 && data.newly_assigned === 0) {
          alert(`⚠️ ${data.message}`);
        } else {
          alert(`❌ ${data.message || 'Failed to assign test'}`);
        }
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

  // View/Edit Test Details Functions
  const handleViewTestDetails = (test) => {
    setSelectedTestForDetails(test);
    setShowViewDetailsModal(true);
    setOpenMenuId(null);
  };

  const handleEditTestDetails = (test) => {
    setSelectedTestForDetails(test);
    setShowEditDetailsModal(true);
    setOpenMenuId(null);
  };

  const handleSaveTestDetails = () => {
    setShowEditDetailsModal(false);
    setSelectedTestForDetails(null);
    fetchTests(); // Refresh the test list
    alert('Test details updated successfully!');
  };

  // Clone Test Functions
  const handleOpenCloneModal = (test) => {
    setTestToClone(test);
    setCloneTestName(`${test.name} (Copy)`);
    setCloneError('');
    setShowCloneModal(true);
    setOpenMenuId(null);
  };

  // Preview Questions Functions
  const handlePreviewQuestions = async (test) => {
    setPreviewTest(test);
    setShowPreviewQuestionsModal(true);
    setIsLoadingPreview(true);
    setOpenMenuId(null);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/tests/${test.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setPreviewQuestions(data.test.questions || []);
      } else {
        alert('Failed to load questions');
        setShowPreviewQuestionsModal(false);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      alert('Failed to load questions');
      setShowPreviewQuestionsModal(false);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Test History Functions
  const handleViewTestHistory = async (test) => {
    setShowTestHistoryModal(true);
    setIsLoadingHistory(true);
    setOpenMenuId(null);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/tests/${test.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setTestHistory({
          testName: test.name,
          createdBy: data.test.created_by || 'Admin',
          createdAt: data.test.created_at,
          updatedBy: data.test.updated_by || 'N/A',
          updatedAt: data.test.updated_at || data.test.created_at
        });
      } else {
        setTestHistory({
          testName: test.name,
          createdBy: 'Admin',
          createdAt: test.date,
          updatedBy: 'N/A',
          updatedAt: test.date
        });
      }
    } catch (error) {
      console.error('Error loading test history:', error);
      setTestHistory({
        testName: test.name,
        createdBy: 'Admin',
        createdAt: test.date,
        updatedBy: 'N/A',
        updatedAt: test.date
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleCloneTest = async () => {
    if (!cloneTestName.trim()) {
      setCloneError('Test name is required');
      return;
    }

    if (cloneTestName.trim().length < 3) {
      setCloneError('Test name must be at least 3 characters');
      return;
    }

    // Check if test name already exists
    const nameExists = tests.some(t => t.name.toLowerCase() === cloneTestName.trim().toLowerCase());
    if (nameExists) {
      setCloneError('A test with this name already exists. Please choose a different name.');
      return;
    }

    try {
      setIsCloning(true);
      setCloneError('');
      const token = localStorage.getItem('adminToken');

      const response = await apiFetch(`api/tests/${testToClone.id}/clone`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          new_title: cloneTestName.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`Test cloned successfully! New test: "${data.test.title}"`);
        setShowCloneModal(false);
        setTestToClone(null);
        setCloneTestName('');
        fetchTests(); // Refresh the test list
      } else {
        setCloneError(data.message || 'Failed to clone test');
      }
    } catch (error) {
      console.error('Error cloning test:', error);
      setCloneError(error.message || 'Failed to clone test');
    } finally {
      setIsCloning(false);
    }
  };

  // Institute Management Functions
  const fetchAllInstitutes = async () => {
    try {
      setIsLoadingAllInstitutes(true);
      const token = localStorage.getItem('adminToken');
      console.log('=== FETCHING ALL INSTITUTES ===');
      console.log('Token:', token ? 'Present' : 'Missing');

      const response = await apiFetch('api/institutes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok && data.success) {
        console.log('Institutes received:', data.institutes.length);
        console.log('Institutes data:', data.institutes);
        setAllInstitutes(data.institutes);
      } else {
        console.error('Failed to fetch institutes:', data.message);
        alert(`Failed to fetch institutes: ${data.message}`);
      }
    } catch (error) {
      console.error('Error fetching institutes:', error);
      alert(`Error fetching institutes: ${error.message}`);
    } finally {
      setIsLoadingAllInstitutes(false);
    }
  };

  const handleAddInstitute = async () => {
    if (!newInstituteName.trim()) {
      alert('Please enter an institute name');
      return;
    }

    try {
      setIsAddingInstitute(true);
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch('api/institutes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instituteName: newInstituteName.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(data.message || 'Institute added successfully');
        setNewInstituteName('');
        fetchAllInstitutes();
      } else {
        alert(data.message || 'Failed to add institute');
      }
    } catch (error) {
      console.error('Error adding institute:', error);
      alert('Failed to add institute');
    } finally {
      setIsAddingInstitute(false);
    }
  };

  const handleDeleteInstitute = async (instituteId, instituteName) => {
    if (!confirm(`Are you sure you want to delete "${instituteName}"? This will not delete students, but will deactivate the institute.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/institutes/${instituteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Institute deleted successfully');
        fetchAllInstitutes();
      } else {
        alert(data.message || 'Failed to delete institute');
      }
    } catch (error) {
      console.error('Error deleting institute:', error);
      alert('Failed to delete institute');
    }
  };

  // Multi-Institute Selection Handlers
  const toggleInstituteSelection = (instituteId) => {
    setSelectedInstitutes(prev => {
      if (prev.includes(instituteId)) {
        return prev.filter(id => id !== instituteId);
      } else {
        return [...prev, instituteId];
      }
    });
  };

  const toggleAllInstitutes = () => {
    if (selectedInstitutes.length === allInstitutes.length) {
      // Deselect all
      setSelectedInstitutes([]);
    } else {
      // Select all
      setSelectedInstitutes(allInstitutes.map(inst => inst.id));
    }
  };

  const handleAssignTestToMultipleInstitutes = async () => {
    if (selectedInstitutes.length === 0) {
      alert('Please select at least one institute');
      return;
    }

    if (!selectedTestForMultipleInstitutes) {
      alert('Please select a test to assign');
      return;
    }

    const selectedTest = tests.find(t => t.id === parseInt(selectedTestForMultipleInstitutes));
    if (!selectedTest) {
      alert('Invalid test selected');
      return;
    }

    const confirmMessage = `Assign "${selectedTest.name}" to ${selectedInstitutes.length} institute(s)?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setIsAssigningTestToMultipleInstitutes(true);
      const token = localStorage.getItem('adminToken');
     
      let successCount = 0;
      let failCount = 0;
      let alreadyAssignedCount = 0;
      const errors = [];

      for (const instituteId of selectedInstitutes) {
        try {
          const response = await apiFetch(`api/institutes/${instituteId}/assign-test`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              test_id: selectedTestForMultipleInstitutes
            })
          });

          const data = await response.json();

          if (response.ok && data.success) {
            successCount++;
          } else if (data.message && data.message.includes('already assigned')) {
            alreadyAssignedCount++;
          } else {
            failCount++;
            const institute = allInstitutes.find(i => i.id === instituteId);
            errors.push(`${institute?.display_name || `Institute ${instituteId}`}: ${data.message}`);
          }
        } catch (error) {
          failCount++;
          const institute = allInstitutes.find(i => i.id === instituteId);
          errors.push(`${institute?.display_name || `Institute ${instituteId}`}: ${error.message}`);
        }

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Show summary
      let summaryMessage = '';
      if (successCount > 0) {
        summaryMessage += `✓ Successfully assigned to ${successCount} institute(s)\n`;
      }
      if (alreadyAssignedCount > 0) {
        summaryMessage += `ℹ Already assigned to ${alreadyAssignedCount} institute(s)\n`;
      }
      if (failCount > 0) {
        summaryMessage += `✗ Failed for ${failCount} institute(s)\n`;
        if (errors.length > 0) {
          summaryMessage += `\nErrors:\n${errors.slice(0, 3).join('\n')}`;
          if (errors.length > 3) {
            summaryMessage += `\n... and ${errors.length - 3} more`;
          }
        }
      }

      alert(summaryMessage || 'Test assignment completed');

      // Clear selections and refresh
      setSelectedInstitutes([]);
      setSelectedTestForMultipleInstitutes('');
      fetchAllInstitutes();
     
    } catch (error) {
      console.error('Error assigning test to institutes:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsAssigningTestToMultipleInstitutes(false);
    }
  };

  const handleViewAssignedTests = async (institute) => {
    setSelectedInstituteForTests(institute);
    setShowAssignedTestsModal(true);
    setIsLoadingAssignedTests(true);
    setSelectedTestForInstitute('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/institutes/${institute.id}/assigned-tests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAssignedTests(data.tests);
      } else {
        console.error('Failed to fetch assigned tests:', data.message);
        setAssignedTests([]);
      }
    } catch (error) {
      console.error('Error fetching assigned tests:', error);
      setAssignedTests([]);
    } finally {
      setIsLoadingAssignedTests(false);
    }
  };

  const handleAssignTestToInstitute = async () => {
    if (!selectedTestForInstitute) {
      alert('Please select a test to assign');
      return;
    }

    try {
      setIsAssigningTestToInstitute(true);
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/institutes/${selectedInstituteForTests.id}/assign-test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test_id: parseInt(selectedTestForInstitute)
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(data.message || 'Test assigned successfully');
        setSelectedTestForInstitute('');
        handleViewAssignedTests(selectedInstituteForTests);
        fetchAllInstitutes(); // Refresh institute list to update test counts
      } else if (response.status === 409 && data.already_assigned) {
        // Handle duplicate assignment
        alert(data.message || 'This test is already assigned to this institute');
      } else {
        alert(data.message || 'Failed to assign test');
      }
    } catch (error) {
      console.error('Error assigning test:', error);
      alert('Failed to assign test');
    } finally {
      setIsAssigningTestToInstitute(false);
    }
  };

  const handleUnassignTestFromInstitute = async (testId, testTitle) => {
    if (!confirm(`Are you sure you want to unassign "${testTitle}" from this institute?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/institutes/${selectedInstituteForTests.id}/unassign-test/${testId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(data.message || 'Test unassigned successfully');
        handleViewAssignedTests(selectedInstituteForTests);
        fetchAllInstitutes(); // Refresh institute list to update test counts
      } else {
        alert(data.message || 'Failed to unassign test');
      }
    } catch (error) {
      console.error('Error unassigning test:', error);
      alert('Failed to unassign test');
    }
  };

  // Student Management Functions
  const handleManageStudents = async (institute) => {
    setSelectedInstituteForStudents(institute);
    setShowStudentManagementModal(true);
    setIsLoadingStudentsForManagement(true);
    setShowAddStudentForm(false);
    setNewStudentData({
      full_name: '',
      email: '',
      roll_number: '',
      institute: institute.display_name
    });

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/institutes/${encodeURIComponent(institute.name)}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setInstituteStudentsForManagement(data.students);
      } else {
        console.error('Failed to fetch students:', data.message);
        setInstituteStudentsForManagement([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setInstituteStudentsForManagement([]);
    } finally {
      setIsLoadingStudentsForManagement(false);
    }
  };

  const handleAddStudent = async () => {
    if (!newStudentData.full_name.trim() || !newStudentData.email.trim()) {
      alert('Full name and email are required');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newStudentData.email.trim())) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      setIsAddingStudent(true);
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch('api/student/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: newStudentData.full_name.trim(),
          email: newStudentData.email.trim(),
          roll_number: newStudentData.roll_number.trim() || null,
          institute: selectedInstituteForStudents.name
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Show success message with test assignment info
        alert(data.message || 'Student added successfully');
        setShowAddStudentForm(false);
        setNewStudentData({
          full_name: '',
          email: '',
          roll_number: '',
          institute: selectedInstituteForStudents.display_name
        });
        handleManageStudents(selectedInstituteForStudents);
        fetchAllInstitutes(); // Refresh to update student counts
      } else {
        alert(data.message || 'Failed to add student');
      }
    } catch (error) {
      console.error('Error adding student:', error);
      alert('Failed to add student');
    } finally {
      setIsAddingStudent(false);
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (!confirm(`Are you sure you want to delete "${studentName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/student/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Student deleted successfully');
        handleManageStudents(selectedInstituteForStudents);
        fetchAllInstitutes();
      } else {
        alert(data.message || 'Failed to delete student');
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Failed to delete student');
    }
  };

  const handleDeleteAllStudents = async () => {
    if (!confirm(`Are you sure you want to delete ALL students from "${selectedInstituteForStudents.display_name}"? This action cannot be undone.`)) {
      return;
    }

    if (!confirm('This will permanently delete all students and their data. Are you absolutely sure?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/student/institute/${encodeURIComponent(selectedInstituteForStudents.name)}/all`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(data.message || 'All students deleted successfully');
        handleManageStudents(selectedInstituteForStudents);
        fetchAllInstitutes();
      } else {
        alert(data.message || 'Failed to delete students');
      }
    } catch (error) {
      console.error('Error deleting students:', error);
      alert('Failed to delete students');
    }
  };

  const handleBulkDeleteStudents = async () => {
    if (selectedStudentsForDelete.length === 0) {
      alert('Please select students to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedStudentsForDelete.length} student(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch('api/student/bulk', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ student_ids: selectedStudentsForDelete })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`Successfully deleted ${data.deleted_count} student(s)`);
        setSelectedStudentsForDelete([]);
        handleManageStudents(selectedInstituteForStudents);
        fetchAllInstitutes();
      } else {
        alert(data.message || 'Failed to delete students');
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('Failed to delete students');
    }
  };

  const toggleStudentForDelete = (studentId) => {
    setSelectedStudentsForDelete(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleAllStudentsForDelete = (students) => {
    const studentIds = students.map(s => s.id);
    if (selectedStudentsForDelete.length === studentIds.length &&
      studentIds.every(id => selectedStudentsForDelete.includes(id))) {
      setSelectedStudentsForDelete([]);
    } else {
      setSelectedStudentsForDelete(studentIds);
    }
  };

  const handleAssignTestInModal = async () => {
    if (!selectedTestForStudentModal) {
      alert('⚠️ Please select a test to assign');
      return;
    }

    if (selectedStudentsForDelete.length === 0) {
      alert('⚠️ Please select at least one student');
      return;
    }

    if (!confirm(`Assign test to ${selectedStudentsForDelete.length} student(s)?`)) {
      return;
    }

    try {
      setIsAssigningTestInModal(true);
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch('api/tests/assign', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test_id: parseInt(selectedTestForStudentModal),
          student_ids: selectedStudentsForDelete
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Show message about assignments
        alert(`✅ ${data.message}`);
        setSelectedStudentsForDelete([]);
        setSelectedTestForStudentModal('');
        // Refresh the student list to update assigned test counts
        handleManageStudents(selectedInstituteForStudents);
      } else {
        // Handle case where all students already have the test
        if (data.already_assigned > 0 && data.newly_assigned === 0) {
          alert(`⚠️ ${data.message}`);
        } else {
          alert(`❌ ${data.message || 'Failed to assign test'}`);
        }
      }
    } catch (error) {
      console.error('Error assigning test:', error);
      alert('❌ An error occurred while assigning the test');
    } finally {
      setIsAssigningTestInModal(false);
    }
  };

  // Fetch AI Violations
  const fetchViolations = async () => {
    if (!selectedTestForViolations) return;

    try {
      setIsLoadingViolations(true);
      const token = localStorage.getItem('adminToken');

      // Fetch violations, flagged students, summary, and by-student data in parallel
      const [violationsRes, flaggedRes, summaryRes, byStudentRes] = await Promise.all([
        apiFetch(`api/proctoring/violations/test/${selectedTestForViolations}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        apiFetch(`api/proctoring/violations/flagged/${selectedTestForViolations}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        apiFetch(`api/proctoring/violations/summary/${selectedTestForViolations}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        apiFetch(`api/proctoring/violations/by-student/${selectedTestForViolations}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const violationsData = await violationsRes.json();
      const flaggedData = await flaggedRes.json();
      const summaryData = await summaryRes.json();
      const byStudentData = await byStudentRes.json();

      if (violationsData.success) {
        setViolations(violationsData.violations);
      }
      if (flaggedData.success) {
        setFlaggedStudents(flaggedData.flaggedStudents);
      }
      if (summaryData.success) {
        setViolationSummary(summaryData.summary);
      }
      if (byStudentData.success) {
        setViolationsByStudent(byStudentData.students);
      }
    } catch (error) {
      console.error('Error fetching violations:', error);
    } finally {
      setIsLoadingViolations(false);
    }
  };

  // Export violations to Excel
  const exportViolationsToExcel = async () => {
    if (!selectedTestForViolations) {
      alert('Please select a test first');
      return;
    }

    if (violationsByStudent.length === 0) {
      alert('No violations to export for this test');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/proctoring/violations/export/${selectedTestForViolations}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404) {
          alert(errorData.message || 'No violations found for this test');
        } else {
          alert(errorData.message || 'Failed to export violations report');
        }
        return;
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `violations_report_${selectedTestForViolations}.xlsx`;

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
      console.error('Export violations error:', error);
      alert('Failed to export violations report. Please try again.');
    }
  };

  // Get filtered violations
  const getFilteredViolations = () => {
    if (violationFilter === 'all') return violations;
    return violations.filter(v => v.severity === violationFilter);
  };

  const filteredViolations = getFilteredViolations();

  return (
    <div className="min-h-screen bg-shnoor-lavender">
      {/* Header */}
      <AdminHeader />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Tab Navigation */}
        {!showCreateTest && !selectedExamId && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-mist p-2 inline-flex space-x-2">
              {[
                { id: 'exams', label: 'Manage Exams', icon: FileSpreadsheet },
                { id: 'institutes', label: 'Manage Institutes', icon: Building2 },
                { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
                { id: 'bulk-upload', label: 'Bulk Upload', icon: Users },
                { id: 'violations', label: 'Violations', icon: AlertCircle },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === tab.id
                    ? 'bg-shnoor-indigo text-white'
                    : 'bg-white text-shnoor-indigoMedium hover:text-shnoor-navy hover:bg-shnoor-lavender'
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
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-light p-8 mb-6">
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => {
                  setShowCreateTest(false);
                  setEditingTest(null);
                }}
                className="flex items-center text-shnoor-indigoMedium hover:text-shnoor-indigo transition-colors group"
                title={editingTest ? 'Cancel Editing' : 'Back to Exams'}
              >
                <ArrowLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
              </button>
            </div>
            <CreateTestSection onComplete={handleCreateTestComplete} editingTest={editingTest} />
          </div>
        ) : selectedExamId ? (
          /* Detail View: Student Results for a specific exam */
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-light overflow-hidden">
            <div className="p-8">
              <button
                onClick={() => {
                  setSelectedExamId(null);
                  setDetailViewTab('results');
                }}
                className="flex items-center text-shnoor-indigoMedium hover:text-shnoor-indigo mb-8 transition-colors group"
              >
                <ArrowLeft size={22} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Back to Exams List</span>
              </button>

              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-shnoor-navy mb-2">{selectedExamDetails?.name}</h2>
                  <div className="flex items-center space-x-4 text-sm text-shnoor-indigoMedium">
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
                    className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-medium transition-all shadow-[0_8px_30px_rgba(14,14,39,0.06)] ${selectedExamStudents.length === 0
                      ? 'bg-shnoor-light text-shnoor-soft cursor-not-allowed'
                      : 'bg-shnoor-indigo hover:bg-shnoor-navy text-white hover:shadow-[0_8px_30px_rgba(14,14,39,0.06)] transform hover:-translate-y-0.5'
                      }`}
                    title={selectedExamStudents.length === 0 ? 'No results to export' : 'Export to Excel'}
                  >
                    <FileSpreadsheet size={20} />
                    <span>Export to Excel</span>
                  </button>
                </div>
              </div>

              {/* Results / Feedback Tabs */}
              <div className="flex space-x-2 mb-6">
                <button
                  onClick={() => setDetailViewTab('results')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${detailViewTab === 'results'
                    ? 'bg-shnoor-indigo text-white shadow-[0_8px_30px_rgba(14,14,39,0.06)]'
                    : 'bg-shnoor-lavender opacity-80 text-shnoor-indigo hover:bg-shnoor-light'
                    }`}
                >
                  <Users size={18} className="inline mr-2" />
                  Results
                </button>
                <button
                  onClick={() => setDetailViewTab('feedback')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${detailViewTab === 'feedback'
                    ? 'bg-shnoor-indigo text-white shadow-[0_8px_30px_rgba(14,14,39,0.06)]'
                    : 'bg-shnoor-lavender opacity-80 text-shnoor-indigo hover:bg-shnoor-light'
                    }`}
                >
                  <MessageSquare size={18} className="inline mr-2" />
                  Feedback
                </button>
              </div>

              {/* Compact Statistics Bar */}
              {selectedExamStudents.length > 0 && (() => {
                const scores = selectedExamStudents.map(s => Number(s.score) || 0);
                const totals = selectedExamStudents.map(s => Number(s.total) || 0);
                const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
                const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
                const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
                const maxTotal = totals.length > 0 ? Math.max(...totals) : 0;
                const passedCount = selectedExamStudents.filter(s =>
                  (Number(s.score) / Number(s.total) * 100) >= (s.passingPercentage || 50)
                ).length;
                const passRate = selectedExamStudents.length > 0 ? (passedCount / selectedExamStudents.length) * 100 : 0;
                const flaggedCount = selectedExamStudents.filter(s => s.flagged === true).length;

                return (
                  <div className="bg-white border border-shnoor-light rounded-lg p-4 mb-6 shadow-[0_8px_30px_rgba(14,14,39,0.06)]">
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      {/* Total Attempts */}
                      <div className="text-center">
                        <p className="text-xs text-shnoor-indigoMedium font-medium mb-1">Total Attempts</p>
                        <p className="text-2xl font-bold text-shnoor-navy">{selectedExamStudents.length}</p>
                      </div>

                      {/* Average Score */}
                      <div className="text-center border-l border-shnoor-light">
                        <p className="text-xs text-shnoor-indigoMedium font-medium mb-1">Average Score</p>
                        <p className="text-2xl font-bold text-shnoor-indigo">{avgScore.toFixed(1)}/{maxTotal}</p>
                      </div>

                      {/* Highest Score */}
                      <div className="text-center border-l border-shnoor-light">
                        <p className="text-xs text-shnoor-indigoMedium font-medium mb-1">Highest Score</p>
                        <p className="text-2xl font-bold text-shnoor-success">{highestScore}/{maxTotal}</p>
                      </div>

                      {/* Lowest Score */}
                      <div className="text-center border-l border-shnoor-light">
                        <p className="text-xs text-shnoor-indigoMedium font-medium mb-1">Lowest Score</p>
                        <p className="text-2xl font-bold text-shnoor-warning">{lowestScore}/{maxTotal}</p>
                      </div>

                      {/* Pass Rate */}
                      <div className="text-center border-l border-shnoor-light">
                        <p className="text-xs text-shnoor-indigoMedium font-medium mb-1">Pass Rate</p>
                        <p className="text-2xl font-bold text-shnoor-success">{passRate.toFixed(0)}%</p>
                        <p className="text-xs text-shnoor-soft mt-0.5">({passedCount}/{selectedExamStudents.length})</p>
                      </div>

                      {/* Flagged Students */}
                      <div className="text-center border-l border-shnoor-light">
                        <p className="text-xs text-shnoor-indigoMedium font-medium mb-1">Flagged</p>
                        <p className="text-2xl font-bold text-shnoor-danger">{flaggedCount}</p>
                        <p className="text-xs text-shnoor-soft mt-0.5">(3+ high violations)</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Results Tab Content */}
              {detailViewTab === 'results' && (
                <div className="overflow-x-auto rounded-xl border border-shnoor-light shadow-[0_8px_30px_rgba(14,14,39,0.06)]">
                  <table className="w-full">
                    <thead className="bg-shnoor-indigo text-white">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Student ID</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Student Name</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Date Attempted</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Score</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">No Face</th>
                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">Multi Faces</th>
                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">Phone</th>
                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">Noise</th>
                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">Voice</th>
                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">Total</th>
                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider">Flagged</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[#E5E7EB]">
                      {selectedExamStudents.length > 0 ? (
                        selectedExamStudents.map((student, idx) => {
                          const percentage = (student.score / student.total * 100);
                          const passingPercentage = student.passingPercentage || 50;
                          const isPassed = percentage >= passingPercentage;
                          return (
                            <tr key={idx} className="hover:bg-shnoor-lavender">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-shnoor-navy">{student.id}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-shnoor-navy">{student.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-shnoor-indigoMedium">{student.email || 'N/A'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-shnoor-indigoMedium">{student.date}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className={`font-bold ${isPassed ? 'text-shnoor-success' : 'text-shnoor-danger'}`}>
                                    {student.score}
                                  </span>
                                  <span className="text-shnoor-indigoMedium text-xs ml-1">/ {student.total}</span>
                                  <span className="text-shnoor-indigoMedium text-xs ml-2">({percentage.toFixed(1)}%)</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isPassed
                                  ? 'bg-shnoor-successLight text-shnoor-success'
                                  : 'bg-shnoor-dangerLight text-shnoor-danger'
                                  }`}>
                                  {isPassed ? 'Pass' : 'Fail'}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-center text-sm text-shnoor-indigo">{student.noFace || 0}</td>
                              <td className="px-4 py-4 text-center text-sm text-shnoor-indigo">{student.multipleFaces || 0}</td>
                              <td className="px-4 py-4 text-center text-sm text-shnoor-indigo">{student.phoneDetected || 0}</td>
                              <td className="px-4 py-4 text-center text-sm text-shnoor-indigo">{student.loudNoise || 0}</td>
                              <td className="px-4 py-4 text-center text-sm text-shnoor-indigo">{student.voiceDetected || 0}</td>
                              <td className="px-4 py-4 text-center text-sm font-semibold text-shnoor-navy">{student.totalViolations || 0}</td>
                              <td className="px-4 py-4 text-center">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${student.flagged
                                  ? 'bg-shnoor-dangerLight text-shnoor-danger'
                                  : 'bg-shnoor-lavender opacity-80 text-shnoor-indigoMedium'
                                  }`}>
                                  {student.flagged ? 'Yes' : 'No'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="13" className="px-6 py-12 text-center text-shnoor-indigoMedium">
                            No students have attempted this exam yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Feedback Tab Content */}
              {detailViewTab === 'feedback' && (
                <div>
                  {loadingFeedback ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="animate-spin text-shnoor-indigo" size={48} />
                    </div>
                  ) : feedbackData.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-shnoor-light">
                      <MessageSquare size={48} className="mx-auto text-shnoor-mist mb-3" />
                      <p className="text-shnoor-indigoMedium text-lg">No feedback submitted yet</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Feedback Statistics */}
                      {feedbackStats && (
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div className="bg-gradient-to-br from-shnoor-mist to-shnoor-mist border border-shnoor-light rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <TrendingUp size={20} className="text-shnoor-indigo" />
                              <span className="text-2xl font-bold text-shnoor-indigo">
                                {feedbackStats.averageRating}
                              </span>
                            </div>
                            <p className="text-sm text-shnoor-indigo font-medium">Average Rating</p>
                            <p className="text-xs text-shnoor-indigoMedium">{feedbackStats.totalFeedbacks} responses</p>
                          </div>

                          <div className="bg-gradient-to-br from-shnoor-successLight to-shnoor-successLight border border-shnoor-successLight rounded-lg p-4">
                            <BarChart3 size={20} className="text-shnoor-success mb-2" />
                            <p className="text-sm text-shnoor-indigo font-medium mb-2">Difficulty</p>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-shnoor-indigoMedium">Easy:</span>
                                <span className="font-medium text-shnoor-success">{feedbackStats.difficultyBreakdown.Easy}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-shnoor-indigoMedium">Medium:</span>
                                <span className="font-medium text-shnoor-warning">{feedbackStats.difficultyBreakdown.Medium}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-shnoor-indigoMedium">Hard:</span>
                                <span className="font-medium text-shnoor-danger">{feedbackStats.difficultyBreakdown.Hard}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-shnoor-warningLight to-shnoor-warningLight border border-shnoor-warningLight rounded-lg p-4">
                            <Star size={20} className="text-shnoor-warning mb-2" />
                            <p className="text-sm text-shnoor-indigo font-medium mb-2">Rating Distribution</p>
                            <div className="space-y-1">
                              {[5, 4, 3, 2, 1].map(rating => (
                                <div key={rating} className="flex items-center text-xs">
                                  <span className="text-shnoor-indigoMedium w-8">{rating}★</span>
                                  <div className="flex-1 bg-shnoor-light rounded-full h-2 mx-2">
                                    <div
                                      className="bg-shnoor-warning h-2 rounded-full"
                                      style={{
                                        width: `${feedbackStats.totalFeedbacks > 0
                                          ? (feedbackStats.ratingBreakdown[rating] / feedbackStats.totalFeedbacks) * 100
                                          : 0}%`
                                      }}
                                    ></div>
                                  </div>
                                  <span className="font-medium text-shnoor-indigo w-6">{feedbackStats.ratingBreakdown[rating]}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Individual Feedback Cards */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-shnoor-navy mb-4">Student Feedback</h3>
                        {feedbackData.map((feedback, idx) => (
                          <div key={idx} className="border border-shnoor-light rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-semibold text-shnoor-navy">{feedback.student_name || 'Anonymous'}</p>
                                <p className="text-sm text-shnoor-indigoMedium">{feedback.student_email}</p>
                              </div>
                              <div className="text-right">
                                {feedback.rating && (
                                  <div className="flex space-x-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        size={16}
                                        className={star <= feedback.rating ? 'fill-shnoor-warning text-shnoor-warning' : 'text-shnoor-mist'}
                                      />
                                    ))}
                                  </div>
                                )}
                                <p className="text-xs text-shnoor-indigoMedium mt-1">
                                  {new Date(feedback.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            {feedback.difficulty && (
                              <div className="mb-3">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${feedback.difficulty === 'Easy' ? 'bg-shnoor-successLight text-shnoor-success' :
                                  feedback.difficulty === 'Medium' ? 'bg-shnoor-warningLight text-shnoor-warning' :
                                    'bg-shnoor-dangerLight text-shnoor-danger'
                                  }`}>
                                  Difficulty: {feedback.difficulty}
                                </span>
                              </div>
                            )}

                            {feedback.feedback_text && (
                              <div className="bg-white rounded-lg p-3">
                                <p className="text-sm text-shnoor-indigo whitespace-pre-wrap">{feedback.feedback_text}</p>
                              </div>
                            )}

                            {!feedback.rating && !feedback.difficulty && !feedback.feedback_text && (
                              <p className="text-sm text-shnoor-soft italic">No detailed feedback provided</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* List View: All Exams */
          <>
            {activeTab === 'exams' && (
              <div className="bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-light overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-shnoor-navy flex items-center">
                        <FileSpreadsheet className="mr-2 text-shnoor-indigo" size={28} />
                        Exams
                      </h2>
                      <p className="text-sm text-shnoor-indigoMedium mt-1">Manage all your exams and view results</p>
                    </div>
                    <button
                      onClick={() => setShowCreateTest(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-shnoor-indigo hover:bg-shnoor-navy text-white rounded-lg transition-colors shadow-[0_8px_30px_rgba(14,14,39,0.06)] font-semibold"
                    >
                      <Plus size={20} />
                      <span>Create Test</span>
                    </button>
                  </div>

                  {loading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shnoor-indigo"></div>
                      <span className="ml-3 text-shnoor-indigoMedium">Loading...</span>
                    </div>
                  ) : tests.length === 0 ? (
                    <div className="text-center py-12 text-shnoor-indigoMedium">
                      <FileSpreadsheet className="mx-auto mb-3 text-shnoor-mist" size={48} />
                      <p className="font-medium">No exams found</p>
                      <p className="text-sm mt-1">Click "Create Test" to add your first exam</p>
                    </div>
                  ) : (
                    <>
                      <ExamSearchFilter
                        onSearchChange={setSearchTerm}
                        onFilterChange={setFilters}
                        onSortChange={setSortBy}
                        showPublishedFilter={true}
                        showAttemptedFilter={true}
                        resultCount={filteredTests.length}
                        sortOptions={[
                          { value: 'latest', label: 'Latest Created' },
                          { value: 'oldest', label: 'Oldest Created' },
                          { value: 'most-attempted', label: 'Most Attempted' },
                          { value: 'duration-asc', label: 'Shortest Duration' },
                          { value: 'duration-desc', label: 'Longest Duration' }
                        ]}
                      />

                      {filteredTests.length === 0 ? (
                        <div className="text-center py-12 text-shnoor-indigoMedium">
                          <FileSpreadsheet className="mx-auto mb-3 text-shnoor-mist" size={48} />
                          <p className="font-medium">No exams match your filters</p>
                          <p className="text-sm mt-1">Try adjusting your search or filters</p>
                        </div>
                      ) : (
                        <>
                          {/* Bulk Actions Bar */}
                          <div className="flex items-center justify-between mb-4 p-4 bg-white rounded-xl border border-shnoor-light">
                            <label className="flex items-center space-x-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedTests.length === filteredTests.length && filteredTests.length > 0}
                                onChange={toggleAllTests}
                                className="w-5 h-5 text-shnoor-indigo border-shnoor-mist rounded focus:ring-2 focus:ring-shnoor-indigo"
                              />
                              <span className="text-sm font-bold text-shnoor-indigo">
                                {selectedTests.length > 0 ? `${selectedTests.length} selected` : 'Select All'}
                              </span>
                            </label>
                            {selectedTests.length > 0 && (
                              <button
                                onClick={handleBulkDeleteTests}
                                className="px-4 py-2 bg-shnoor-danger hover:bg-shnoor-danger text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                              >
                                <Trash2 size={16} />
                                <span>Delete {selectedTests.length} Test{selectedTests.length !== 1 ? 's' : ''}</span>
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredTests.map((test) => (
                              <div
                                key={test.id}
                                className="bg-white border border-shnoor-light rounded-xl p-6 hover:shadow-[0_8px_30px_rgba(14,14,39,0.06)] hover:border-shnoor-indigo transition-all group relative"
                              >
                                {/* Checkbox for selection */}
                                <div className="absolute top-4 left-4 z-10">
                                  <input
                                    type="checkbox"
                                    checked={selectedTests.includes(test.id)}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      toggleTestSelection(test.id);
                                    }}
                                    className="w-5 h-5 text-shnoor-indigo border-shnoor-mist rounded focus:ring-2 focus:ring-shnoor-indigo"
                                  />
                                </div>

                                {/* Status Badge and 3-Dot Menu */}
                                <div className="absolute top-4 right-4 flex items-center space-x-2">
                                  {test.status === 'published' ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-shnoor-successLight text-shnoor-success">
                                      <CheckCircle size={12} className="mr-1" />
                                      Published
                                    </span>
                                  ) : test.status === 'archived' ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-shnoor-dangerLight text-shnoor-danger">
                                      <XCircle size={12} className="mr-1" />
                                      Archived
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-shnoor-lavender opacity-80 text-shnoor-navy">
                                      Draft
                                    </span>
                                  )}

                                  {/* 3-Dot Menu */}
                                  <div className="relative">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuId(openMenuId === test.id ? null : test.id);
                                      }}
                                      className="p-1.5 bg-shnoor-lavender opacity-80 hover:bg-shnoor-light text-shnoor-indigoMedium hover:text-shnoor-navy rounded-lg transition-colors"
                                      title="More options"
                                    >
                                      <MoreVertical size={14} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {openMenuId === test.id && (
                                      <div className="absolute right-0 mt-2 w-48 bg-white border border-shnoor-light rounded-lg shadow-[0_8px_30px_rgba(14,14,39,0.06)] z-50">
                                        {/* For draft tests, only show Clone option */}
                                        {test.status === 'draft' ? (
                                          <>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handlePreviewQuestions(test);
                                              }}
                                              className="w-full px-4 py-2.5 text-left text-sm text-shnoor-indigo hover:bg-shnoor-lavender flex items-center space-x-2 transition-colors"
                                            >
                                              <Eye size={14} />
                                              <span>Preview Questions</span>
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewTestHistory(test);
                                              }}
                                              className="w-full px-4 py-2.5 text-left text-sm text-shnoor-indigo hover:bg-shnoor-lavender flex items-center space-x-2 transition-colors border-t border-shnoor-light"
                                            >
                                              <AlertCircle size={14} />
                                              <span>Test History</span>
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenCloneModal(test);
                                              }}
                                              className="w-full px-4 py-2.5 text-left text-sm text-shnoor-indigo hover:bg-shnoor-lavender flex items-center space-x-2 transition-colors border-t border-shnoor-light"
                                            >
                                              <Copy size={14} />
                                              <span>Clone Test</span>
                                            </button>
                                          </>
                                        ) : (
                                          <>
                                            {/* View Details - Available for published tests */}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewTestDetails(test);
                                              }}
                                              className="w-full px-4 py-2.5 text-left text-sm text-shnoor-indigo hover:bg-shnoor-lavender flex items-center space-x-2 transition-colors"
                                            >
                                              <Eye size={14} />
                                              <span>View Details</span>
                                            </button>

                                            {/* Preview Questions */}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handlePreviewQuestions(test);
                                              }}
                                              className="w-full px-4 py-2.5 text-left text-sm text-shnoor-indigo hover:bg-shnoor-lavender flex items-center space-x-2 transition-colors border-t border-shnoor-light"
                                            >
                                              <FileSpreadsheet size={14} />
                                              <span>Preview Questions</span>
                                            </button>

                                            {/* Test History */}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewTestHistory(test);
                                              }}
                                              className="w-full px-4 py-2.5 text-left text-sm text-shnoor-indigo hover:bg-shnoor-lavender flex items-center space-x-2 transition-colors border-t border-shnoor-light"
                                            >
                                              <AlertCircle size={14} />
                                              <span>Test History</span>
                                            </button>

                                            {/* Clone Test */}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenCloneModal(test);
                                              }}
                                              className="w-full px-4 py-2.5 text-left text-sm text-shnoor-indigo hover:bg-shnoor-lavender flex items-center space-x-2 transition-colors border-t border-shnoor-light"
                                            >
                                              <Copy size={14} />
                                              <span>Clone Test</span>
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Header with Icon */}
                                <div className="flex justify-between items-start mb-4">
                                  <div className="h-12 w-12 bg-shnoor-lavender rounded-lg flex items-center justify-center text-shnoor-indigo font-bold text-xl group-hover:bg-shnoor-indigo group-hover:text-white transition-colors">
                                    {test.name.charAt(0)}
                                  </div>
                                </div>

                                {/* Exam Title */}
                                <h3 className="font-bold text-shnoor-navy text-lg mb-2 line-clamp-2 group-hover:text-shnoor-indigo transition-colors">
                                  {test.name}
                                </h3>

                                {/* Exam Details */}
                                <div className="space-y-2 mb-4">
                                  <div className="flex items-center text-sm text-shnoor-indigoMedium">
                                    <FileSpreadsheet size={16} className="mr-2" />
                                    <span>{test.questions} Questions • {test.duration} mins</span>
                                  </div>
                                  <div className="flex items-center text-sm text-shnoor-indigoMedium">
                                    <span className="text-xs">Created: {test.date}</span>
                                  </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-shnoor-light mb-4">
                                  <div className="text-center">
                                    <div className="flex items-center justify-center mb-1">
                                      <Users size={16} className="text-shnoor-indigoMedium mr-1" />
                                      <span className="text-lg font-bold text-shnoor-navy">{test.attempts}</span>
                                    </div>
                                    <p className="text-xs text-shnoor-indigoMedium">Attempted</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="flex items-center justify-center mb-1">
                                      <CheckCircle size={16} className="text-shnoor-success mr-1" />
                                      <span className="text-lg font-bold text-shnoor-success">{test.passedCount || 0}</span>
                                    </div>
                                    <p className="text-xs text-shnoor-indigoMedium">Passed ({test.passRate || 0}%)</p>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center space-x-2 pt-4 border-t border-shnoor-light">
                                  {test.status === 'draft' ? (
                                    <>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingTest(test);
                                          setShowCreateTest(true);
                                        }}
                                        className="flex-1 py-2 px-3 bg-shnoor-lavender text-shnoor-indigo hover:bg-shnoor-navy hover:text-white rounded-lg text-sm font-medium transition-colors"
                                        title="View Test"
                                      >
                                        <Eye size={18} className="inline mr-1" />
                                        View
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleTogglePublish(test.id, test.status);
                                        }}
                                        className="flex-1 py-2 px-3 bg-shnoor-successLight text-shnoor-success hover:bg-shnoor-success hover:text-white rounded-lg text-sm font-medium transition-colors"
                                        title="Publish Test"
                                      >
                                        <CheckCircle size={18} className="inline mr-1" />
                                        Publish
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteTest(test.id);
                                        }}
                                        className="p-2 text-shnoor-danger hover:bg-shnoor-dangerLight rounded-lg transition-colors"
                                        title="Delete Test"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedExamId(test.id);
                                        }}
                                        className="flex-1 py-2 px-3 bg-shnoor-lavender text-shnoor-indigo hover:bg-shnoor-indigo hover:text-white rounded-lg text-sm font-medium transition-colors"
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
                                        className="p-2 text-shnoor-danger hover:bg-shnoor-dangerLight rounded-lg transition-colors"
                                        title="Delete Test"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'institutes' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-light p-8">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-shnoor-navy mb-2 flex items-center">
                      <Building2 className="mr-3 text-shnoor-indigo" size={32} />
                      Manage Institutes
                    </h2>
                    <p className="text-shnoor-indigoMedium ml-11">Add, view, and manage institutes and their students</p>
                  </div>

                  {/* Add Institute Form */}
                  <div className="mb-8 p-6 bg-white rounded-2xl border border-shnoor-light shadow-[0_8px_30px_rgba(14,14,39,0.06)]">
                    <label className="block text-sm font-bold text-shnoor-navy mb-3 flex items-center">
                      <Plus size={18} className="mr-2 text-shnoor-indigo" />
                      Add New Institute
                    </label>
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={newInstituteName}
                        onChange={(e) => setNewInstituteName(e.target.value)}
                        placeholder="Enter institute name"
                        className="flex-1 px-5 py-4 border border-shnoor-light rounded-xl focus:ring-4 focus:ring-shnoor-mist focus:border-shnoor-indigo bg-white text-shnoor-navy font-medium shadow-[0_8px_30px_rgba(14,14,39,0.06)]"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddInstitute();
                          }
                        }}
                      />
                      <button
                        onClick={handleAddInstitute}
                        disabled={isAddingInstitute || !newInstituteName.trim()}
                        className={`px-6 py-4 rounded-xl font-bold transition-all flex items-center space-x-2 shadow-[0_8px_30px_rgba(14,14,39,0.06)] ${!isAddingInstitute && newInstituteName.trim()
                          ? 'bg-shnoor-indigo hover:bg-shnoor-navy text-white hover:shadow-[0_8px_30px_rgba(14,14,39,0.06)] transform hover:-translate-y-0.5'
                          : 'bg-shnoor-light text-shnoor-soft cursor-not-allowed'
                          }`}
                      >
                        {isAddingInstitute && (
                          <Loader2 className="animate-spin" size={20} />
                        )}
                        <Plus size={20} />
                        <span>{isAddingInstitute ? 'Adding...' : 'Add'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Institutes List */}
                  <div className="space-y-4">
                    {/* Bulk Test Assignment Section - shown when institutes are selected */}
                    {selectedInstitutes.length > 0 && (
                      <div className="mb-6 p-6 bg-shnoor-lavender rounded-2xl border-2 border-shnoor-indigo">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-shnoor-navy flex items-center">
                            <FileSpreadsheet className="mr-2 text-shnoor-indigo" size={22} />
                            Assign Test to Selected Institutes
                          </h3>
                          <button
                            onClick={() => setSelectedInstitutes([])}
                            className="text-sm text-shnoor-indigoMedium hover:text-shnoor-navy font-medium"
                          >
                            Clear Selection
                          </button>
                        </div>
                       
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-shnoor-navy mb-2">
                              <span className="font-bold">{selectedInstitutes.length}</span> institute{selectedInstitutes.length !== 1 ? 's' : ''} selected
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {selectedInstitutes.map(instId => {
                                const inst = allInstitutes.find(i => i.id === instId);
                                return inst ? (
                                  <span key={instId} className="px-3 py-1 bg-white rounded-lg text-xs font-medium text-shnoor-navy border border-shnoor-light">
                                    {inst.display_name}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-shnoor-navy mb-2">
                              Select Test to Assign
                            </label>
                            <select
                              value={selectedTestForMultipleInstitutes}
                              onChange={(e) => setSelectedTestForMultipleInstitutes(e.target.value)}
                              className="w-full px-4 py-3 border border-shnoor-light rounded-xl focus:ring-4 focus:ring-shnoor-mist focus:border-shnoor-indigo bg-white text-shnoor-navy font-medium"
                            >
                              <option value="">-- Select a test --</option>
                              {tests.map((test) => (
                                <option key={test.id} value={test.id}>
                                  {test.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            onClick={handleAssignTestToMultipleInstitutes}
                            disabled={!selectedTestForMultipleInstitutes || isAssigningTestToMultipleInstitutes}
                            className={`w-full px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 ${
                              selectedTestForMultipleInstitutes && !isAssigningTestToMultipleInstitutes
                                ? 'bg-shnoor-indigo hover:bg-shnoor-navy text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                                : 'bg-shnoor-light text-shnoor-soft cursor-not-allowed'
                            }`}
                          >
                            {isAssigningTestToMultipleInstitutes && (
                              <Loader2 className="animate-spin mr-2" size={20} />
                            )}
                            <UserCheck size={22} />
                            <span>
                              {isAssigningTestToMultipleInstitutes
                                ? 'Assigning...'
                                : `Assign to ${selectedInstitutes.length} Institute${selectedInstitutes.length !== 1 ? 's' : ''}`
                              }
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <h3 className="text-xl font-bold text-shnoor-navy flex items-center">
                          <Building2 size={22} className="mr-2 text-shnoor-indigo" />
                          All Institutes
                        </h3>
                        {allInstitutes.length > 0 && (
                          <label className="flex items-center space-x-2 cursor-pointer px-3 py-1.5 bg-shnoor-lavender hover:bg-shnoor-light rounded-lg transition-colors border border-shnoor-light">
                            <input
                              type="checkbox"
                              checked={selectedInstitutes.length === allInstitutes.length && allInstitutes.length > 0}
                              ref={(el) => { if (el) el.indeterminate = selectedInstitutes.length > 0 && selectedInstitutes.length < allInstitutes.length; }}
                              onChange={toggleAllInstitutes}
                              className="w-4 h-4 text-shnoor-indigo border-shnoor-mist rounded focus:ring-2 focus:ring-shnoor-indigo"
                            />
                            <span className="text-sm font-bold text-shnoor-navy whitespace-nowrap">Select All</span>
                          </label>
                        )}
                      </div>
                      {allInstitutes.length > 0 && (
                        <span className="text-sm text-shnoor-indigoMedium bg-shnoor-lavender px-3 py-1 rounded-full border border-shnoor-light">
                          {allInstitutes.length} institute{allInstitutes.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {isLoadingAllInstitutes ? (
                      <div className="flex items-center justify-center py-12 bg-white rounded-2xl border border-shnoor-light">
                        <Loader2 className="animate-spin text-shnoor-indigo" size={32} />
                        <span className="ml-3 text-shnoor-indigoMedium font-medium">Loading institutes...</span>
                      </div>
                    ) : allInstitutes.length === 0 ? (
                      <div className="text-center py-16 bg-white rounded-2xl border border-shnoor-light">
                        <Building2 className="mx-auto mb-4 text-shnoor-mist" size={64} />
                        <p className="text-shnoor-navy font-medium text-lg">No institutes found</p>
                        <p className="text-shnoor-indigoMedium text-sm mt-2">Add your first institute using the form above</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {allInstitutes.map((institute) => {
                          // Calculate effective status based on start time and deadline
                          const now = new Date();
                          const startTime = institute.registration_start_time ? new Date(institute.registration_start_time) : null;
                          const deadline = institute.registration_deadline ? new Date(institute.registration_deadline) : null;
                          const notYetOpen = startTime && now < startTime;
                          const deadlinePassed = deadline && now > deadline;

                          let effectiveStatus = institute.registration_status || 'open';
                          let statusBadgeText = effectiveStatus;
                          let statusBadgeColor = effectiveStatus === 'open'
                            ? 'bg-shnoor-successLight text-shnoor-success'
                            : effectiveStatus === 'paused'
                              ? 'bg-shnoor-warningLight text-shnoor-warning'
                              : 'bg-shnoor-dangerLight text-shnoor-danger';

                          // Override if not yet open
                          if (notYetOpen) {
                            statusBadgeText = 'not yet open';
                            statusBadgeColor = 'bg-shnoor-lavender opacity-80 text-shnoor-indigo';
                          }
                          // Override if deadline passed
                          else if (deadlinePassed && effectiveStatus === 'open') {
                            statusBadgeText = 'closed';
                            statusBadgeColor = 'bg-shnoor-dangerLight text-shnoor-danger';
                          }

                          const isInstituteSelected = selectedInstitutes.includes(institute.id);

                          return (
                            <div
                              key={institute.id}
                              className={`border rounded-2xl p-6 bg-white hover:shadow-[0_8px_30px_rgba(14,14,39,0.06)] transition-all ${
                                isInstituteSelected ? 'border-shnoor-indigo border-2 bg-shnoor-indigo/5' : 'border-shnoor-light'
                              }`}
                            >
                              <div className="flex items-start space-x-3 mb-4">
                                {/* Checkbox for multi-select */}
                                <label className="flex items-center cursor-pointer mt-1">
                                  <input
                                    type="checkbox"
                                    checked={isInstituteSelected}
                                    onChange={() => toggleInstituteSelection(institute.id)}
                                    className="w-5 h-5 text-shnoor-indigo border-shnoor-mist rounded focus:ring-2 focus:ring-shnoor-indigo"
                                  />
                                </label>

                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-bold text-lg text-shnoor-navy">
                                      {institute.display_name}
                                    </h4>
                                    {/* Registration Status Badge */}
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusBadgeColor}`}>
                                      {statusBadgeText}
                                    </span>
                                  </div>
                                  <div className="space-y-1 text-sm text-shnoor-indigoMedium">
                                    <p className="flex items-center">
                                      <Users size={14} className="mr-2" />
                                      {institute.student_count} student{institute.student_count !== 1 ? 's' : ''}
                                    </p>
                                    <p className="flex items-center">
                                      <FileSpreadsheet size={14} className="mr-2" />
                                      {institute.assigned_tests_count} test{institute.assigned_tests_count !== 1 ? 's' : ''} assigned
                                    </p>
                                    {institute.registration_start_time && (
                                      <p className="flex items-center text-xs text-shnoor-indigoMedium">
                                        <Calendar size={12} className="mr-2" />
                                        Start: {new Date(institute.registration_start_time).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                      </p>
                                    )}
                                    {institute.registration_deadline && (
                                      <p className="flex items-center text-xs text-shnoor-indigoMedium">
                                        <Calendar size={12} className="mr-2" />
                                        Deadline: {new Date(institute.registration_deadline).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                      </p>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 mt-4">
                                    <button
                                      onClick={() => handleViewAssignedTests(institute)}
                                      className="py-2 px-3 bg-shnoor-lavender text-shnoor-indigo hover:bg-shnoor-indigo hover:text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                      <FileSpreadsheet size={16} className="inline mr-1" />
                                      Tests
                                    </button>
                                    <button
                                      onClick={() => handleManageStudents(institute)}
                                      className="py-2 px-3 bg-shnoor-successLight text-shnoor-success hover:bg-shnoor-success hover:text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                      <Users size={16} className="inline mr-1" />
                                      Students
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedInstituteForRegistration(institute);
                                        setShowRegistrationControlModal(true);
                                      }}
                                      className="py-2 px-3 bg-shnoor-lavender text-shnoor-indigo hover:bg-shnoor-indigo hover:text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                      <Calendar size={16} className="inline mr-1" />
                                      Registration
                                    </button>
                                    <button
                                      onClick={() => handleDeleteInstitute(institute.id, institute.display_name)}
                                      className="py-2 px-3 text-shnoor-danger hover:bg-shnoor-dangerLight rounded-lg transition-colors text-sm font-medium"
                                      title="Delete Institute"
                                    >
                                      <Trash2 size={16} className="inline mr-1" />
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <AdminReports />
              </div>
            )}

            {/* Bulk Upload Students Tab */}
            {activeTab === 'bulk-upload' && (
              <div className="space-y-6">
                <BulkStudentUpload />
              </div>
            )}

            {/* Violations Tab */}
            {activeTab === 'violations' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-light p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-shnoor-navy flex items-center">
                        <AlertCircle className="mr-2 text-shnoor-indigo" size={28} />
                        Violations
                      </h2>
                      <p className="text-sm text-shnoor-indigoMedium mt-1">Monitor detected suspicious activities during exams</p>
                    </div>
                    {selectedTestForViolations && violationsByStudent.length > 0 && (
                      <button
                        onClick={exportViolationsToExcel}
                        className="flex items-center space-x-2 px-5 py-3 bg-shnoor-indigo hover:bg-shnoor-navy text-white rounded-xl transition-all shadow-[0_8px_30px_rgba(14,14,39,0.06)] hover:shadow-[0_8px_30px_rgba(14,14,39,0.12)] transform hover:-translate-y-0.5 font-semibold"
                        title="Export Violations Report"
                      >
                        <Download size={20} />
                        <span>Export Report</span>
                      </button>
                    )}
                  </div>

                  {/* Test Selector */}
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-shnoor-navy mb-2">
                      Select Test to View Violations
                    </label>
                    <select
                      value={selectedTestForViolations}
                      onChange={(e) => setSelectedTestForViolations(e.target.value)}
                      className="w-full px-4 py-3 border border-shnoor-light rounded-xl focus:ring-4 focus:ring-shnoor-lavender focus:border-shnoor-indigo bg-white text-shnoor-navy font-medium transition-all"
                    >
                      <option value="">-- Select a test --</option>
                      {tests.map((test) => (
                        <option key={test.id} value={test.id}>
                          {test.name} ({test.attempts} attempts)
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedTestForViolations && (
                    <>
                      {/* Flagged Students */}
                      {flaggedStudents.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-lg font-bold text-shnoor-navy mb-4 flex items-center">
                            <AlertCircle className="mr-2 text-shnoor-indigo" size={20} />
                            Flagged Students (3+ High Severity Violations)
                          </h3>
                          <div className="space-y-3">
                            {flaggedStudents.map((student) => (
                              <div
                                key={student.student_id}
                                className="p-4 bg-shnoor-lavender border border-shnoor-light rounded-xl"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-bold text-shnoor-navy">{student.student_name}</h4>
                                    <p className="text-sm text-shnoor-indigoMedium">{student.student_email}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-2xl font-bold text-shnoor-indigo">{student.total_violations}</p>
                                    <p className="text-xs text-shnoor-indigoMedium">Total Violations</p>
                                  </div>
                                </div>
                                <div className="mt-3 flex space-x-4 text-sm">
                                  <span className="px-3 py-1 bg-shnoor-indigo text-white rounded-full font-medium">
                                    High: {student.high_severity_count}
                                  </span>
                                  <span className="px-3 py-1 bg-shnoor-indigoMedium text-white rounded-full font-medium">
                                    Medium: {student.medium_severity_count}
                                  </span>
                                  <span className="text-shnoor-indigoMedium">
                                    Last: {new Date(student.last_violation).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Student Violations Table */}
                      {isLoadingViolations ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="animate-spin text-shnoor-indigo" size={32} />
                          <span className="ml-3 text-shnoor-indigoMedium">Loading violations...</span>
                        </div>
                      ) : violationsByStudent.length === 0 ? (
                        <div className="text-center py-12 bg-shnoor-lavender rounded-xl border border-shnoor-light">
                          <CheckCircle className="mx-auto mb-2 text-shnoor-indigo" size={48} />
                          <p className="text-shnoor-navy font-medium">No violations detected</p>
                          <p className="text-sm text-shnoor-indigoMedium mt-1">All students followed exam guidelines</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <h3 className="text-lg font-bold text-shnoor-navy mb-4">
                            Student Violations Summary
                          </h3>
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-shnoor-lavender border-b-2 border-shnoor-light">
                                <th className="px-4 py-3 text-left text-sm font-bold text-shnoor-navy">Student ID</th>
                                <th className="px-4 py-3 text-left text-sm font-bold text-shnoor-navy">Name</th>
                                <th className="px-4 py-3 text-left text-sm font-bold text-shnoor-navy">Email</th>
                                <th className="px-4 py-3 text-left text-sm font-bold text-shnoor-navy">Phone</th>
                                <th className="px-4 py-3 text-center text-sm font-bold text-shnoor-navy">No Face</th>
                                <th className="px-4 py-3 text-center text-sm font-bold text-shnoor-navy">Multiple Faces</th>
                                <th className="px-4 py-3 text-center text-sm font-bold text-shnoor-navy">Phone Detected</th>
                                <th className="px-4 py-3 text-center text-sm font-bold text-shnoor-navy">Loud Noise</th>
                                <th className="px-4 py-3 text-center text-sm font-bold text-shnoor-navy">Voice Detected</th>
                                <th className="px-4 py-3 text-center text-sm font-bold text-shnoor-navy">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {violationsByStudent.map((student, idx) => (
                                <tr
                                  key={student.student_id}
                                  className={`border-b border-shnoor-light hover:bg-shnoor-lavender transition-colors ${student.total_violations >= 5 ? 'bg-shnoor-lavender/50' : ''
                                    }`}
                                >
                                  <td className="px-4 py-3 text-sm text-shnoor-indigoMedium">{student.student_id}</td>
                                  <td className="px-4 py-3 text-sm font-medium text-shnoor-navy">{student.student_name}</td>
                                  <td className="px-4 py-3 text-sm text-shnoor-indigoMedium">{student.student_email}</td>
                                  <td className="px-4 py-3 text-sm text-shnoor-indigoMedium">{student.student_phone || 'N/A'}</td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${student.no_face_count > 0 ? 'bg-shnoor-indigo/10 text-shnoor-indigo' : 'bg-shnoor-lavender text-shnoor-soft'
                                      }`}>
                                      {student.no_face_count}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${student.multiple_faces_count > 0 ? 'bg-shnoor-indigo/10 text-shnoor-indigo' : 'bg-shnoor-lavender text-shnoor-soft'
                                      }`}>
                                      {student.multiple_faces_count}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${student.phone_detected_count > 0 ? 'bg-shnoor-indigoMedium/10 text-shnoor-indigoMedium' : 'bg-shnoor-lavender text-shnoor-soft'
                                      }`}>
                                      {student.phone_detected_count}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${student.loud_noise_count > 0 ? 'bg-shnoor-indigoMedium/10 text-shnoor-indigoMedium' : 'bg-shnoor-lavender text-shnoor-soft'
                                      }`}>
                                      {student.loud_noise_count || 0}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${student.voice_detected_count > 0 ? 'bg-shnoor-indigoMedium/10 text-shnoor-indigoMedium' : 'bg-shnoor-lavender text-shnoor-soft'
                                      }`}>
                                      {student.voice_detected_count || 0}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${student.total_violations >= 5
                                      ? 'bg-shnoor-indigo text-white'
                                      : student.total_violations >= 3
                                        ? 'bg-shnoor-indigoMedium text-white'
                                        : 'bg-shnoor-lavender text-shnoor-indigo'
                                      }`}>
                                      {student.total_violations}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}


        {/* Clone Test Modal */}
        {showCloneModal && testToClone && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] max-w-md w-full">
              <div className="bg-gradient-to-r from-shnoor-indigo to-shnoor-navy px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">Clone Test</h3>
                  <p className="text-shnoor-lavender text-sm mt-1">Create a copy of "{testToClone.name}"</p>
                </div>
                <button
                  onClick={() => {
                    setShowCloneModal(false);
                    setTestToClone(null);
                    setCloneTestName('');
                    setCloneError('');
                  }}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                  disabled={isCloning}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-shnoor-indigo mb-2">
                    New Test Name <span className="text-shnoor-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={cloneTestName}
                    onChange={(e) => {
                      setCloneTestName(e.target.value);
                      setCloneError('');
                    }}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-shnoor-indigo ${cloneError ? 'border-shnoor-danger' : 'border-shnoor-mist'
                      }`}
                    placeholder="Enter new test name"
                    disabled={isCloning}
                    autoFocus
                  />
                  {cloneError && (
                    <p className="mt-2 text-sm text-shnoor-danger flex items-center">
                      <XCircle size={14} className="mr-1" />
                      {cloneError}
                    </p>
                  )}
                </div>

                <div className="bg-shnoor-lavender border border-shnoor-light rounded-lg p-4">
                  <p className="text-sm text-shnoor-navy">
                    <strong>Note:</strong> This will create a new test with:
                  </p>
                  <ul className="mt-2 text-sm text-shnoor-indigo space-y-1 ml-4 list-disc">
                    <li>All questions from the original test</li>
                    <li>Same duration and settings</li>
                    <li>Draft status (not published)</li>
                    <li>No results or student assignments</li>
                  </ul>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowCloneModal(false);
                      setTestToClone(null);
                      setCloneTestName('');
                      setCloneError('');
                    }}
                    className="flex-1 px-6 py-3 bg-shnoor-light hover:bg-shnoor-lavender text-shnoor-navy rounded-xl font-medium transition-colors"
                    disabled={isCloning}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCloneTest}
                    className="flex-1 px-6 py-3 bg-shnoor-indigo hover:bg-shnoor-navy text-white rounded-xl font-medium transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isCloning}
                  >
                    {isCloning ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        <span>Cloning...</span>
                      </>
                    ) : (
                      <>
                        <Copy size={18} />
                        <span>Clone Test</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Test Details Modal */}
        {showViewDetailsModal && selectedTestForDetails && (
          <ViewTestDetailsModal
            test={selectedTestForDetails}
            onClose={() => {
              setShowViewDetailsModal(false);
              setSelectedTestForDetails(null);
            }}
            onEdit={handleEditTestDetails}
          />
        )}

        {/* Edit Test Details Modal */}
        {showEditDetailsModal && selectedTestForDetails && (
          <EditTestDetailsModal
            test={selectedTestForDetails}
            onClose={() => {
              setShowEditDetailsModal(false);
              setSelectedTestForDetails(null);
            }}
            onSave={handleSaveTestDetails}
          />
        )}

        {/* Job Role/Description Modal */}
        {showJobModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] max-w-3xl w-full max-h-[90vh] overflow-hidden">
              <div className="bg-gradient-to-r from-shnoor-indigo to-shnoor-navy px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedJobTest?.name}</h3>
                  <p className="text-shnoor-lavender text-sm mt-1">Job Role & Description</p>
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
                  <Loader2 className="animate-spin text-shnoor-indigo" size={32} />
                  <span className="ml-3 text-shnoor-indigoMedium">Loading job roles...</span>
                </div>
              ) : (
                <>
                  {!isEditingJob && jobRoles.length > 1 && (
                    <div>
                      <label className="block text-sm font-bold text-shnoor-navy mb-2">
                        Select Job Role
                      </label>
                      <select
                        value={selectedJobRoleIndex}
                        onChange={(e) => setSelectedJobRoleIndex(parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-shnoor-light rounded-xl focus:ring-4 focus:ring-shnoor-mist focus:border-shnoor-indigo bg-white text-shnoor-navy font-medium"
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
                        <label className="block text-sm font-bold text-shnoor-navy">
                          Job Roles & Descriptions
                        </label>
                        <button
                          type="button"
                          onClick={handleAddJobRole}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-shnoor-lavender text-shnoor-indigo rounded-lg hover:bg-shnoor-lavender transition-colors text-sm font-medium"
                        >
                          <Plus size={16} />
                          <span>Add Role</span>
                        </button>
                      </div>

                      {jobRoles.map((role, index) => (
                        <div key={index} className="p-4 border border-shnoor-light rounded-lg space-y-3 bg-white">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-shnoor-indigo">
                              Role {index + 1} {index === 0 && <span className="text-shnoor-indigo">(Default)</span>}
                            </span>
                            {jobRoles.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveJobRole(index)}
                                className="text-shnoor-danger hover:text-shnoor-danger p-1"
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
                              className="w-full px-4 py-3 border border-shnoor-light rounded-xl focus:ring-4 focus:ring-shnoor-mist focus:border-shnoor-indigo bg-white text-shnoor-navy font-medium"
                              placeholder="e.g., Senior Software Engineer"
                            />
                          </div>

                          <div>
                            <textarea
                              value={role.jobDescription}
                              onChange={(e) => handleJobRoleChange(index, 'jobDescription', e.target.value)}
                              rows={4}
                              className="w-full px-4 py-3 border border-shnoor-light rounded-xl focus:ring-4 focus:ring-shnoor-mist focus:border-shnoor-indigo bg-white text-shnoor-navy resize-none"
                              placeholder="Enter job description, requirements, responsibilities..."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-shnoor-navy mb-2">
                          Job Role
                        </label>
                        <div className="px-4 py-3 bg-shnoor-lavender rounded-xl border border-shnoor-light">
                          <p className="text-shnoor-navy font-semibold">
                            {jobRoles[selectedJobRoleIndex]?.jobRole || 'Not specified'}
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-shnoor-navy mb-2">
                          Job Description
                        </label>
                        <div className="px-4 py-3 bg-shnoor-lavender rounded-xl border border-shnoor-light max-h-96 overflow-y-auto">
                          <p className="text-shnoor-indigoMedium whitespace-pre-wrap">
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
              <div className="p-6 border-t border-shnoor-light flex justify-end space-x-3">
                {isEditingJob ? (
                  <>
                    <button
                      onClick={() => {
                        setIsEditingJob(false);
                        handleViewJob(selectedJobTest); // Reload original data
                      }}
                      className="px-6 py-3 bg-shnoor-light hover:bg-shnoor-lavender text-shnoor-navy rounded-xl font-medium transition-colors"
                      disabled={isSavingJob}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveJob}
                      disabled={isSavingJob}
                      className="px-6 py-3 bg-shnoor-indigo hover:bg-shnoor-navy text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
                      className="px-6 py-3 bg-shnoor-light hover:bg-shnoor-lavender text-shnoor-navy rounded-xl font-medium transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => setIsEditingJob(true)}
                      className="px-6 py-3 bg-shnoor-indigo hover:bg-shnoor-navy text-white rounded-xl font-medium transition-colors flex items-center space-x-2"
                      title="Edit Roles"
                    >
                      <Pencil size={18} />
                      <span>Edit</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Assigned Tests Modal */}
        {showAssignedTestsModal && selectedInstituteForTests && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="bg-gradient-to-r from-shnoor-indigo to-shnoor-navy px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedInstituteForTests.display_name}</h3>
                  <p className="text-shnoor-lavender text-sm mt-1">Assigned Tests</p>
                </div>
                <button
                  onClick={() => setShowAssignedTestsModal(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Assign New Test */}
                <div className="p-4 bg-shnoor-lavender rounded-xl border border-shnoor-light">
                  <label className="block text-sm font-bold text-shnoor-navy mb-3">
                    Assign New Test to Institute
                  </label>
                  <div className="flex space-x-3">
                    <select
                      value={selectedTestForInstitute}
                      onChange={(e) => setSelectedTestForInstitute(e.target.value)}
                      className="flex-1 px-4 py-3 border border-shnoor-light rounded-xl focus:ring-4 focus:ring-shnoor-lavender focus:border-shnoor-indigo bg-white text-shnoor-navy font-medium transition-all"
                    >
                      <option value="">-- Select a test --</option>
                      {tests.filter(test => test.status === 'published').map((test) => (
                        <option key={test.id} value={test.id}>
                          {test.name} ({test.questions} questions)
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssignTestToInstitute}
                      disabled={!selectedTestForInstitute || isAssigningTestToInstitute}
                      className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center space-x-2 ${selectedTestForInstitute && !isAssigningTestToInstitute
                        ? 'bg-shnoor-indigo hover:bg-shnoor-navy text-white shadow-lg hover:-translate-y-0.5'
                        : 'bg-shnoor-light text-shnoor-soft cursor-not-allowed'
                        }`}
                    >
                      {isAssigningTestToInstitute && (
                        <Loader2 className="animate-spin" size={16} />
                      )}
                      <span>{isAssigningTestToInstitute ? 'Assigning...' : 'Assign Test'}</span>
                    </button>
                  </div>
                  {tests.filter(test => test.status === 'published').length === 0 && (
                    <p className="mt-2 text-sm text-shnoor-indigoMedium flex items-center">
                      <AlertCircle size={16} className="mr-1" />
                      No published tests available. Please publish a test first.
                    </p>
                  )}
                </div>

                {/* Assigned Tests List */}
                <div>
                  <h4 className="text-sm font-bold text-shnoor-navy mb-3">Currently Assigned Tests</h4>
                  {isLoadingAssignedTests ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="animate-spin text-shnoor-indigo" size={32} />
                      <span className="ml-3 text-shnoor-indigoMedium">Loading...</span>
                    </div>
                  ) : assignedTests.length === 0 ? (
                    <div className="text-center py-8 bg-shnoor-lavender rounded-xl border border-shnoor-light">
                      <FileSpreadsheet className="mx-auto mb-2 text-shnoor-mist" size={48} />
                      <p className="text-shnoor-indigoMedium">No tests assigned yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {assignedTests.map((test) => (
                        <div
                          key={test.id}
                          className="flex items-center justify-between p-4 bg-white border border-shnoor-light rounded-xl hover:shadow-md transition-all"
                        >
                          <div className="flex-1">
                            <h5 className="font-bold text-shnoor-navy">{test.title}</h5>
                            <p className="text-sm text-shnoor-indigoMedium">
                              {test.question_count} questions • {test.duration_minutes} mins
                              {test.is_institute_level && (
                                <span className="ml-2 px-2 py-0.5 bg-shnoor-lavender text-shnoor-indigo rounded text-xs font-medium">
                                  Institute Level
                                </span>
                              )}
                            </p>
                          </div>
                          <button
                            onClick={() => handleUnassignTestFromInstitute(test.id, test.title)}
                            className="p-2 text-shnoor-indigo hover:bg-shnoor-lavender rounded-lg transition-colors"
                            title="Unassign Test"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-shnoor-light flex justify-end">
                <button
                  onClick={() => setShowAssignedTestsModal(false)}
                  className="px-6 py-3 bg-shnoor-light hover:bg-shnoor-mist text-shnoor-navy rounded-xl font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Student Management Modal */}
        {showStudentManagementModal && selectedInstituteForStudents && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] max-w-5xl w-full max-h-[90vh] overflow-hidden">
              <div className="bg-gradient-to-r from-shnoor-indigo to-shnoor-navy px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedInstituteForStudents.display_name}</h3>
                  <p className="text-shnoor-lavender text-sm mt-1">Manage Students</p>
                </div>
                <button
                  onClick={() => {
                    setShowStudentManagementModal(false);
                    setSelectedStudentsForDelete([]);
                    setSelectedTestForStudentModal('');
                  }}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Add Student Form */}
                {showAddStudentForm ? (
                  <div className="p-4 bg-shnoor-lavender rounded-xl border border-shnoor-light">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-shnoor-navy">Add New Student</h4>
                      <button
                        onClick={() => setShowAddStudentForm(false)}
                        className="text-shnoor-indigoMedium hover:text-shnoor-indigo transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="Full Name *"
                        value={newStudentData.full_name}
                        onChange={(e) => setNewStudentData({ ...newStudentData, full_name: e.target.value })}
                        className="px-4 py-3 border border-shnoor-light rounded-xl focus:ring-4 focus:ring-shnoor-lavender focus:border-shnoor-indigo bg-white text-shnoor-navy transition-all"
                      />
                      <input
                        type="email"
                        placeholder="Email *"
                        value={newStudentData.email}
                        onChange={(e) => setNewStudentData({ ...newStudentData, email: e.target.value })}
                        className="px-4 py-3 border border-shnoor-light rounded-xl focus:ring-4 focus:ring-shnoor-lavender focus:border-shnoor-indigo bg-white text-shnoor-navy transition-all"
                      />
                      <input
                        type="text"
                        placeholder="Roll Number (Optional)"
                        value={newStudentData.roll_number}
                        onChange={(e) => setNewStudentData({ ...newStudentData, roll_number: e.target.value })}
                        className="px-4 py-3 border border-shnoor-light rounded-xl focus:ring-4 focus:ring-shnoor-lavender focus:border-shnoor-indigo bg-white text-shnoor-navy transition-all"
                      />
                      <input
                        type="text"
                        value={newStudentData.institute}
                        disabled
                        className="px-4 py-3 border border-shnoor-light rounded-xl bg-shnoor-lavender text-shnoor-indigoMedium"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setShowAddStudentForm(false)}
                        className="px-4 py-2 bg-shnoor-light hover:bg-shnoor-mist text-shnoor-navy rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddStudent}
                        disabled={isAddingStudent}
                        className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${!isAddingStudent
                          ? 'bg-shnoor-indigo hover:bg-shnoor-navy text-white shadow-lg hover:-translate-y-0.5'
                          : 'bg-shnoor-light text-shnoor-soft cursor-not-allowed'
                          }`}
                      >
                        {isAddingStudent && (
                          <Loader2 className="animate-spin" size={16} />
                        )}
                        <span>{isAddingStudent ? 'Adding...' : 'Add Student'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-shnoor-navy">Students List</h4>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setShowAddStudentForm(true)}
                          className="px-4 py-2 bg-shnoor-indigo hover:bg-shnoor-navy text-white rounded-lg font-medium transition-all shadow-lg hover:-translate-y-0.5 flex items-center space-x-2"
                        >
                          <Plus size={16} />
                          <span>Add Student</span>
                        </button>
                        {selectedStudentsForDelete.length > 0 && (
                          <button
                            onClick={handleBulkDeleteStudents}
                            className="px-4 py-2 bg-shnoor-indigo hover:bg-shnoor-navy text-white rounded-lg font-medium transition-all shadow-lg hover:-translate-y-0.5 flex items-center space-x-2"
                          >
                            <Trash2 size={16} />
                            <span>Delete {selectedStudentsForDelete.length} Selected</span>
                          </button>
                        )}
                        {instituteStudentsForManagement.length > 0 && (
                          <button
                            onClick={handleDeleteAllStudents}
                            className="px-4 py-2 bg-shnoor-indigo hover:bg-shnoor-navy text-white rounded-lg font-medium transition-all shadow-lg hover:-translate-y-0.5 flex items-center space-x-2"
                          >
                            <Trash2 size={16} />
                            <span>Delete All</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Test Assignment Section */}
                    {selectedStudentsForDelete.length > 0 && (
                      <div className="p-4 bg-shnoor-lavender rounded-xl border border-shnoor-light">
                        <h5 className="text-sm font-bold text-shnoor-navy mb-3">
                          Assign Test to {selectedStudentsForDelete.length} Selected Student{selectedStudentsForDelete.length !== 1 ? 's' : ''}
                        </h5>
                        <div className="flex space-x-3">
                          <select
                            value={selectedTestForStudentModal}
                            onChange={(e) => setSelectedTestForStudentModal(e.target.value)}
                            className="flex-1 px-4 py-3 border border-shnoor-light rounded-xl focus:ring-4 focus:ring-shnoor-lavender focus:border-shnoor-indigo bg-white text-shnoor-navy font-medium transition-all"
                          >
                            <option value="">-- Select a test --</option>
                            {tests.filter(test => test.status === 'published').map((test) => (
                              <option key={test.id} value={test.id}>
                                {test.name} ({test.questions} questions • {test.duration} mins)
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={handleAssignTestInModal}
                            disabled={!selectedTestForStudentModal || isAssigningTestInModal}
                            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center space-x-2 ${selectedTestForStudentModal && !isAssigningTestInModal
                              ? 'bg-shnoor-indigo hover:bg-shnoor-navy text-white shadow-lg hover:-translate-y-0.5'
                              : 'bg-shnoor-light text-shnoor-soft cursor-not-allowed'
                              }`}
                          >
                            {isAssigningTestInModal && (
                              <Loader2 className="animate-spin" size={16} />
                            )}
                            <UserCheck size={18} />
                            <span>{isAssigningTestInModal ? 'Assigning...' : 'Assign'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Students List */}
                <div>
                  {isLoadingStudentsForManagement ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="animate-spin text-shnoor-indigo" size={32} />
                      <span className="ml-3 text-shnoor-indigoMedium">Loading students...</span>
                    </div>
                  ) : instituteStudentsForManagement.length === 0 ? (
                    <div className="text-center py-8 bg-shnoor-lavender rounded-xl border border-shnoor-light">
                      <Users className="mx-auto mb-2 text-shnoor-mist" size={48} />
                      <p className="text-shnoor-indigoMedium">No students found</p>
                    </div>
                  ) : (
                    <>
                      {/* Select All Checkbox */}
                      <div className="flex items-center space-x-3 mb-3 p-3 bg-white rounded-lg">
                        <input
                          type="checkbox"
                          checked={selectedStudentsForDelete.length === instituteStudentsForManagement.length && instituteStudentsForManagement.length > 0}
                          onChange={() => toggleAllStudentsForDelete(instituteStudentsForManagement)}
                          className="w-5 h-5 text-shnoor-indigo border-shnoor-mist rounded focus:ring-2 focus:ring-shnoor-lavender"
                        />
                        <span className="text-sm font-bold text-shnoor-indigo">
                          {selectedStudentsForDelete.length > 0 ? `${selectedStudentsForDelete.length} selected` : 'Select All'}
                        </span>
                      </div>

                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {instituteStudentsForManagement.map((student) => (
                          <div
                            key={student.id}
                            className={`flex items-center justify-between p-4 border rounded-xl hover:shadow-md transition-all ${selectedStudentsForDelete.includes(student.id)
                              ? 'bg-shnoor-lavender border-shnoor-indigo'
                              : 'bg-white border-shnoor-light'
                              }`}
                          >
                            <div className="flex items-center space-x-3 flex-1">
                              <input
                                type="checkbox"
                                checked={selectedStudentsForDelete.includes(student.id)}
                                onChange={() => toggleStudentForDelete(student.id)}
                                className="w-5 h-5 text-shnoor-indigo border-shnoor-mist rounded focus:ring-2 focus:ring-shnoor-lavender"
                              />
                              <div className="flex-1">
                                <h5 className="font-bold text-shnoor-navy">{student.full_name}</h5>
                                <p className="text-sm text-shnoor-indigoMedium">
                                  {student.email} • {student.roll_number || 'No roll number'}
                                  <span className="ml-2 text-xs">
                                    ({student.assigned_tests_count} test{student.assigned_tests_count !== 1 ? 's' : ''} assigned)
                                  </span>
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteStudent(student.id, student.full_name)}
                              className="p-2 text-shnoor-indigo hover:bg-shnoor-lavender rounded-lg transition-colors"
                              title="Delete Student"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-shnoor-light flex justify-end">
                <button
                  onClick={() => {
                    setShowStudentManagementModal(false);
                    setSelectedStudentsForDelete([]);
                    setSelectedTestForStudentModal('');
                  }}
                  className="px-6 py-3 bg-shnoor-light hover:bg-shnoor-mist text-shnoor-navy rounded-xl font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Registration Control Modal */}
        {showRegistrationControlModal && selectedInstituteForRegistration && (
          <InstituteRegistrationControl
            institute={selectedInstituteForRegistration}
            onClose={() => {
              setShowRegistrationControlModal(false);
              setSelectedInstituteForRegistration(null);
            }}
            onUpdate={() => {
              fetchAllInstitutes();
            }}
          />
        )}

        {/* Preview Questions Modal */}
        {showPreviewQuestionsModal && previewTest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="bg-gradient-to-r from-shnoor-indigo to-shnoor-navy px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">{previewTest.name}</h3>
                  <p className="text-shnoor-lavender text-sm mt-1">Preview Questions</p>
                </div>
                <button
                  onClick={() => setShowPreviewQuestionsModal(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {isLoadingPreview ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-shnoor-indigo" size={32} />
                    <span className="ml-3 text-shnoor-indigoMedium">Loading questions...</span>
                  </div>
                ) : previewQuestions.length === 0 ? (
                  <div className="text-center py-12">
                    <FileSpreadsheet className="mx-auto mb-3 text-shnoor-mist" size={48} />
                    <p className="text-shnoor-indigoMedium">No questions found</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {previewQuestions.map((question, index) => (
                      <div key={question.id} className="p-4 bg-white rounded-xl border border-shnoor-light">
                        <div className="flex items-start space-x-3 mb-3">
                          <span className="flex-shrink-0 w-8 h-8 bg-shnoor-lavender text-shnoor-indigo rounded-full flex items-center justify-center font-bold text-sm">
                            {index + 1}
                          </span>
                          <p className="flex-1 text-shnoor-navy font-medium">{question.question_text}</p>
                        </div>
                        <div className="ml-11 space-y-2">
                          {[
                            { label: 'A', value: question.option_a },
                            { label: 'B', value: question.option_b },
                            { label: 'C', value: question.option_c },
                            { label: 'D', value: question.option_d }
                          ].filter(opt => opt.value).map((option) => (
                            <div
                              key={option.label}
                              className={`p-3 rounded-lg border ${question.correct_option === option.label
                                ? 'bg-shnoor-successLight border-shnoor-success text-shnoor-success'
                                : 'bg-white border-shnoor-light text-shnoor-indigoMedium'
                                }`}
                            >
                              <span className="font-bold mr-2">{option.label}.</span>
                              {option.value}
                              {question.correct_option === option.label && (
                                <span className="ml-2 text-xs font-bold text-shnoor-success">(Correct Answer)</span>
                              )}
                            </div>
                          ))}
                          <div className="text-sm text-shnoor-indigoMedium mt-2">
                            <span className="font-bold">Marks:</span> {question.marks || 1}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-shnoor-light flex justify-end">
                <button
                  onClick={() => setShowPreviewQuestionsModal(false)}
                  className="px-6 py-3 bg-shnoor-light hover:bg-shnoor-lavender text-shnoor-navy rounded-xl font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Test History Modal */}
        {showTestHistoryModal && testHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] max-w-2xl w-full">
              <div className="bg-gradient-to-r from-shnoor-indigo to-shnoor-navy px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">Test History</h3>
                  <p className="text-shnoor-lavender text-sm mt-1">{testHistory.testName}</p>
                </div>
                <button
                  onClick={() => setShowTestHistoryModal(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6">
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-shnoor-indigo" size={32} />
                    <span className="ml-3 text-shnoor-indigoMedium">Loading history...</span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Created Info */}
                    <div className="p-4 bg-shnoor-successLight rounded-xl border border-shnoor-successLight">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-shnoor-successLight rounded-full flex items-center justify-center">
                          <Plus className="text-shnoor-success" size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-shnoor-navy">Created</h4>
                          <p className="text-sm text-shnoor-indigoMedium">Test was created</p>
                        </div>
                      </div>
                      <div className="ml-13 space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <Users size={16} className="text-shnoor-indigoMedium" />
                          <span className="text-shnoor-indigoMedium">By:</span>
                          <span className="font-bold text-shnoor-navy">{testHistory.createdBy}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar size={16} className="text-shnoor-indigoMedium" />
                          <span className="text-shnoor-indigoMedium">On:</span>
                          <span className="font-bold text-shnoor-navy">
                            {new Date(testHistory.createdAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Updated Info */}
                    <div className="p-4 bg-shnoor-lavender rounded-xl border border-shnoor-light">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-shnoor-lavender rounded-full flex items-center justify-center">
                          <Pencil className="text-shnoor-indigo" size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-shnoor-navy">Last Updated</h4>
                          <p className="text-sm text-shnoor-indigoMedium">Most recent modification</p>
                        </div>
                      </div>
                      <div className="ml-13 space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <Users size={16} className="text-shnoor-indigoMedium" />
                          <span className="text-shnoor-indigoMedium">By:</span>
                          <span className="font-bold text-shnoor-navy">{testHistory.updatedBy}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar size={16} className="text-shnoor-indigoMedium" />
                          <span className="text-shnoor-indigoMedium">On:</span>
                          <span className="font-bold text-shnoor-navy">
                            {new Date(testHistory.updatedAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-shnoor-light flex justify-end">
                <button
                  onClick={() => setShowTestHistoryModal(false)}
                  className="px-6 py-3 bg-shnoor-light hover:bg-shnoor-lavender text-shnoor-navy rounded-xl font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
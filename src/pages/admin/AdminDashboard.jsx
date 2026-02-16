// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, FileSpreadsheet, LogOut, Download, ArrowLeft, 
  Trash2, Eye, Users, CheckCircle, XCircle, UserCheck, ChevronDown, ChevronRight, Video, Loader2, X, Building2, MoreVertical, Copy, AlertCircle
} from 'lucide-react';
import CreateTestSection from '../../components/admin/CreateTestSection';
import ExamSearchFilter from '../../components/ExamSearchFilter';
import { apiFetch } from '../../config/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('exams');
  const [showCreateTest, setShowCreateTest] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
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

  // Institute Management States
  const [allInstitutes, setAllInstitutes] = useState([]);
  const [isLoadingAllInstitutes, setIsLoadingAllInstitutes] = useState(false);
  const [newInstituteName, setNewInstituteName] = useState('');
  const [isAddingInstitute, setIsAddingInstitute] = useState(false);

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

  // Derived state: Get students for the selected exam
  const selectedExamStudents = selectedExamId ? (studentsData[selectedExamId] || []) : [];
  const selectedExamDetails = tests.find(t => t.id === selectedExamId);

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
      if (activeTab === 'assign') {
        fetchInstitutes();
      }
      if (activeTab === 'institutes') {
        fetchAllInstitutes();
      }
    }
  }, [navigate, activeTab]);

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
              })
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

  // Clone Test Functions
  const handleOpenCloneModal = (test) => {
    setTestToClone(test);
    setCloneTestName(`${test.name} (Copy)`);
    setCloneError('');
    setShowCloneModal(true);
    setOpenMenuId(null);
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
                { id: 'institutes', label: 'Manage Institutes', icon: Building2 },
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
                onClick={() => {
                  setShowCreateTest(false);
                  setEditingTest(null);
                }}
                className="flex items-center text-[#374151] hover:text-[#3B82F6] transition-colors group"
              >
                <ArrowLeft size={22} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">{editingTest ? 'Cancel Editing' : 'Back to Exams'}</span>
              </button>
            </div>
            <CreateTestSection onComplete={handleCreateTestComplete} editingTest={editingTest} />
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

                return (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {/* Total Attempts */}
                      <div className="text-center">
                        <p className="text-xs text-gray-500 font-medium mb-1">Total Attempts</p>
                        <p className="text-2xl font-bold text-gray-900">{selectedExamStudents.length}</p>
                      </div>

                      {/* Average Score */}
                      <div className="text-center border-l border-gray-200">
                        <p className="text-xs text-gray-500 font-medium mb-1">Average Score</p>
                        <p className="text-2xl font-bold text-blue-600">{avgScore.toFixed(1)}/{maxTotal}</p>
                      </div>

                      {/* Highest Score */}
                      <div className="text-center border-l border-gray-200">
                        <p className="text-xs text-gray-500 font-medium mb-1">Highest Score</p>
                        <p className="text-2xl font-bold text-green-600">{highestScore}/{maxTotal}</p>
                      </div>

                      {/* Lowest Score */}
                      <div className="text-center border-l border-gray-200">
                        <p className="text-xs text-gray-500 font-medium mb-1">Lowest Score</p>
                        <p className="text-2xl font-bold text-orange-600">{lowestScore}/{maxTotal}</p>
                      </div>

                      {/* Pass Rate */}
                      <div className="text-center border-l border-gray-200">
                        <p className="text-xs text-gray-500 font-medium mb-1">Pass Rate</p>
                        <p className="text-2xl font-bold text-emerald-600">{passRate.toFixed(0)}%</p>
                        <p className="text-xs text-gray-400 mt-0.5">({passedCount}/{selectedExamStudents.length})</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

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
                        <div className="text-center py-12 text-[#374151]">
                          <FileSpreadsheet className="mx-auto mb-3 text-gray-300" size={48} />
                          <p className="font-medium">No exams match your filters</p>
                          <p className="text-sm mt-1">Try adjusting your search or filters</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredTests.map((test) => (
                        <div
                          key={test.id}
                          className="bg-white border-2 border-[#E5E7EB] rounded-xl p-6 hover:shadow-lg hover:border-[#3B82F6] transition-all group relative"
                        >
                          {/* Status Badge and 3-Dot Menu */}
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
                            
                            {/* 3-Dot Menu */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(openMenuId === test.id ? null : test.id);
                                }}
                                className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded-lg transition-colors"
                                title="More options"
                              >
                                <MoreVertical size={14} />
                              </button>
                              
                              {/* Dropdown Menu */}
                              {openMenuId === test.id && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewJob(test);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50 flex items-center space-x-2 transition-colors"
                                  >
                                    <Eye size={14} />
                                    <span>Test Details</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenCloneModal(test);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50 flex items-center space-x-2 transition-colors border-t border-gray-100"
                                  >
                                    <Copy size={14} />
                                    <span>Clone Test</span>
                                  </button>
                                </div>
                              )}
                            </div>
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
                          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#E5E7EB] mb-4">
                            <div className="text-center">
                              <div className="flex items-center justify-center mb-1">
                                <Users size={16} className="text-[#374151] mr-1" />
                                <span className="text-lg font-bold text-[#111827]">{test.attempts}</span>
                              </div>
                              <p className="text-xs text-[#374151]">Attempted</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center mb-1">
                                <CheckCircle size={16} className="text-green-600 mr-1" />
                                <span className="text-lg font-bold text-green-600">{test.passedCount || 0}</span>
                              </div>
                              <p className="text-xs text-[#374151]">Passed ({test.passRate || 0}%)</p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2 pt-4 border-t border-[#E5E7EB]">
                            {test.status === 'draft' ? (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditTest(test);
                                  }}
                                  className="flex-1 py-2 px-3 bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg text-sm font-medium transition-colors"
                                  title="Edit Test"
                                >
                                  <Eye size={18} className="inline mr-1" />
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTogglePublish(test.id, test.status);
                                  }}
                                  className="flex-1 py-2 px-3 bg-green-100 text-green-700 hover:bg-green-600 hover:text-white rounded-lg text-sm font-medium transition-colors"
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
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                      )}
                    </>
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
                      {tests.filter(test => test.status === 'published').map((test) => (
                        <option key={test.id} value={test.id}>
                          {test.name} ({test.questions} questions • {test.duration} mins)
                        </option>
                      ))}
                    </select>
                    {tests.filter(test => test.status === 'published').length === 0 && (
                      <p className="mt-2 text-sm text-orange-600 flex items-center">
                        <AlertCircle size={16} className="mr-1" />
                        No published tests available. Please publish a test first.
                      </p>
                    )}
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

            {activeTab === 'institutes' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-2xl border-2 border-[#E5E7EB] p-8">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-[#111827] mb-2 flex items-center">
                      <Building2 className="mr-3 text-[#3B82F6]" size={32} />
                      Manage Institutes
                    </h2>
                    <p className="text-[#374151] ml-11">Add, view, and manage institutes and their students</p>
                  </div>

                  {/* Add Institute Form */}
                  <div className="mb-8 p-6 bg-[#F9FAFB] rounded-2xl border-2 border-[#E5E7EB] shadow-lg">
                    <label className="block text-sm font-bold text-[#111827] mb-3 flex items-center">
                      <Plus size={18} className="mr-2 text-[#3B82F6]" />
                      Add New Institute
                    </label>
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={newInstituteName}
                        onChange={(e) => setNewInstituteName(e.target.value)}
                        placeholder="Enter institute name"
                        className="flex-1 px-5 py-4 border-2 border-[#E5E7EB] rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-[#3B82F6] bg-white text-[#111827] font-medium shadow-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddInstitute();
                          }
                        }}
                      />
                      <button
                        onClick={handleAddInstitute}
                        disabled={isAddingInstitute || !newInstituteName.trim()}
                        className={`px-6 py-4 rounded-xl font-bold transition-all flex items-center space-x-2 shadow-lg ${
                          !isAddingInstitute && newInstituteName.trim()
                            ? 'bg-[#3B82F6] hover:bg-blue-600 text-white hover:shadow-xl transform hover:-translate-y-0.5'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-[#111827] flex items-center">
                        <Building2 size={22} className="mr-2 text-[#3B82F6]" />
                        All Institutes
                      </h3>
                      {allInstitutes.length > 0 && (
                        <span className="text-sm text-[#374151] bg-[#F9FAFB] px-3 py-1 rounded-full border border-[#E5E7EB]">
                          {allInstitutes.length} institute{allInstitutes.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {isLoadingAllInstitutes ? (
                      <div className="flex items-center justify-center py-12 bg-[#F9FAFB] rounded-2xl border-2 border-[#E5E7EB]">
                        <Loader2 className="animate-spin text-[#3B82F6]" size={32} />
                        <span className="ml-3 text-[#374151] font-medium">Loading institutes...</span>
                      </div>
                    ) : allInstitutes.length === 0 ? (
                      <div className="text-center py-16 bg-[#F9FAFB] rounded-2xl border-2 border-[#E5E7EB]">
                        <Building2 className="mx-auto mb-4 text-gray-300" size={64} />
                        <p className="text-[#111827] font-medium text-lg">No institutes found</p>
                        <p className="text-[#374151] text-sm mt-2">Add your first institute using the form above</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {allInstitutes.map((institute) => (
                          <div
                            key={institute.id}
                            className="border-2 border-[#E5E7EB] rounded-2xl p-6 bg-white hover:shadow-lg transition-all"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h4 className="font-bold text-lg text-[#111827] mb-2">
                                  {institute.display_name}
                                </h4>
                                <div className="space-y-1 text-sm text-[#374151]">
                                  <p className="flex items-center">
                                    <Users size={14} className="mr-2" />
                                    {institute.student_count} student{institute.student_count !== 1 ? 's' : ''}
                                  </p>
                                  <p className="flex items-center">
                                    <FileSpreadsheet size={14} className="mr-2" />
                                    {institute.assigned_tests_count} test{institute.assigned_tests_count !== 1 ? 's' : ''} assigned
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleViewAssignedTests(institute)}
                                className="flex-1 py-2 px-3 bg-blue-100 text-[#3B82F6] hover:bg-[#3B82F6] hover:text-white rounded-lg text-sm font-medium transition-colors"
                              >
                                <FileSpreadsheet size={16} className="inline mr-1" />
                                Tests
                              </button>
                              <button
                                onClick={() => handleManageStudents(institute)}
                                className="flex-1 py-2 px-3 bg-green-100 text-green-600 hover:bg-green-600 hover:text-white rounded-lg text-sm font-medium transition-colors"
                              >
                                <Users size={16} className="inline mr-1" />
                                Students
                              </button>
                              <button
                                onClick={() => handleDeleteInstitute(institute.id, institute.display_name)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Institute"
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
              </div>
            )}
          </>
        )}
      </main>

      {/* Clone Test Modal */}
      {showCloneModal && testToClone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-[#3B82F6] to-blue-600 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">Clone Test</h3>
                <p className="text-blue-100 text-sm mt-1">Create a copy of "{testToClone.name}"</p>
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Test Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={cloneTestName}
                  onChange={(e) => {
                    setCloneTestName(e.target.value);
                    setCloneError('');
                  }}
                  className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    cloneError ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter new test name"
                  disabled={isCloning}
                  autoFocus
                />
                {cloneError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <XCircle size={14} className="mr-1" />
                    {cloneError}
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This will create a new test with:
                </p>
                <ul className="mt-2 text-sm text-blue-700 space-y-1 ml-4 list-disc">
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
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-colors"
                  disabled={isCloning}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloneTest}
                  className="flex-1 px-6 py-3 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Assigned Tests Modal */}
      {showAssignedTestsModal && selectedInstituteForTests && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-[#3B82F6] to-blue-600 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedInstituteForTests.display_name}</h3>
                <p className="text-blue-100 text-sm mt-1">Assigned Tests</p>
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
              <div className="p-4 bg-[#F9FAFB] rounded-xl border-2 border-[#E5E7EB]">
                <label className="block text-sm font-bold text-[#111827] mb-3">
                  Assign New Test to Institute
                </label>
                <div className="flex space-x-3">
                  <select
                    value={selectedTestForInstitute}
                    onChange={(e) => setSelectedTestForInstitute(e.target.value)}
                    className="flex-1 px-4 py-3 border-2 border-[#E5E7EB] rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-[#3B82F6] bg-white text-[#111827] font-medium"
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
                    className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center space-x-2 ${
                      selectedTestForInstitute && !isAssigningTestToInstitute
                        ? 'bg-[#3B82F6] hover:bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isAssigningTestToInstitute && (
                      <Loader2 className="animate-spin" size={16} />
                    )}
                    <span>{isAssigningTestToInstitute ? 'Assigning...' : 'Assign Test'}</span>
                  </button>
                </div>
                {tests.filter(test => test.status === 'published').length === 0 && (
                  <p className="mt-2 text-sm text-orange-600 flex items-center">
                    <AlertCircle size={16} className="mr-1" />
                    No published tests available. Please publish a test first.
                  </p>
                )}
              </div>

              {/* Assigned Tests List */}
              <div>
                <h4 className="text-sm font-bold text-[#111827] mb-3">Currently Assigned Tests</h4>
                {isLoadingAssignedTests ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-[#3B82F6]" size={32} />
                    <span className="ml-3 text-[#374151]">Loading tests...</span>
                  </div>
                ) : assignedTests.length === 0 ? (
                  <div className="text-center py-8 bg-[#F9FAFB] rounded-xl border-2 border-[#E5E7EB]">
                    <FileSpreadsheet className="mx-auto mb-2 text-gray-300" size={48} />
                    <p className="text-[#374151]">No tests assigned yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {assignedTests.map((test) => (
                      <div
                        key={test.id}
                        className="flex items-center justify-between p-4 bg-white border-2 border-[#E5E7EB] rounded-xl hover:shadow-md transition-all"
                      >
                        <div className="flex-1">
                          <h5 className="font-bold text-[#111827]">{test.title}</h5>
                          <p className="text-sm text-[#374151]">
                            {test.question_count} questions • {test.duration_minutes} mins
                            {test.is_institute_level && (
                              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-xs font-medium">
                                Institute Level
                              </span>
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => handleUnassignTestFromInstitute(test.id, test.title)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

            <div className="p-6 border-t border-[#E5E7EB] flex justify-end">
              <button
                onClick={() => setShowAssignedTestsModal(false)}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-[#111827] rounded-xl font-medium transition-colors"
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
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-[#3B82F6] to-blue-600 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedInstituteForStudents.display_name}</h3>
                <p className="text-blue-100 text-sm mt-1">Manage Students</p>
              </div>
              <button
                onClick={() => setShowStudentManagementModal(false)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Add Student Form */}
              {showAddStudentForm ? (
                <div className="p-4 bg-[#F9FAFB] rounded-xl border-2 border-[#E5E7EB]">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-[#111827]">Add New Student</h4>
                    <button
                      onClick={() => setShowAddStudentForm(false)}
                      className="text-[#374151] hover:text-red-600 transition-colors"
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
                      className="px-4 py-3 border-2 border-[#E5E7EB] rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-[#3B82F6] bg-white text-[#111827]"
                    />
                    <input
                      type="email"
                      placeholder="Email *"
                      value={newStudentData.email}
                      onChange={(e) => setNewStudentData({ ...newStudentData, email: e.target.value })}
                      className="px-4 py-3 border-2 border-[#E5E7EB] rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-[#3B82F6] bg-white text-[#111827]"
                    />
                    <input
                      type="text"
                      placeholder="Roll Number (Optional)"
                      value={newStudentData.roll_number}
                      onChange={(e) => setNewStudentData({ ...newStudentData, roll_number: e.target.value })}
                      className="px-4 py-3 border-2 border-[#E5E7EB] rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-[#3B82F6] bg-white text-[#111827]"
                    />
                    <input
                      type="text"
                      value={newStudentData.institute}
                      disabled
                      className="px-4 py-3 border-2 border-[#E5E7EB] rounded-xl bg-gray-100 text-[#374151]"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowAddStudentForm(false)}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-[#111827] rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddStudent}
                      disabled={isAddingStudent}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                        !isAddingStudent
                          ? 'bg-[#3B82F6] hover:bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-[#111827]">Students List</h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowAddStudentForm(true)}
                      className="px-4 py-2 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                      <Plus size={16} />
                      <span>Add Student</span>
                    </button>
                    {instituteStudentsForManagement.length > 0 && (
                      <button
                        onClick={handleDeleteAllStudents}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                      >
                        <Trash2 size={16} />
                        <span>Delete All</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Students List */}
              <div>
                {isLoadingStudentsForManagement ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-[#3B82F6]" size={32} />
                    <span className="ml-3 text-[#374151]">Loading students...</span>
                  </div>
                ) : instituteStudentsForManagement.length === 0 ? (
                  <div className="text-center py-8 bg-[#F9FAFB] rounded-xl border-2 border-[#E5E7EB]">
                    <Users className="mx-auto mb-2 text-gray-300" size={48} />
                    <p className="text-[#374151]">No students found</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {instituteStudentsForManagement.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-4 bg-white border-2 border-[#E5E7EB] rounded-xl hover:shadow-md transition-all"
                      >
                        <div className="flex-1">
                          <h5 className="font-bold text-[#111827]">{student.full_name}</h5>
                          <p className="text-sm text-[#374151]">
                            {student.email} • {student.roll_number || 'No roll number'}
                            <span className="ml-2 text-xs">
                              ({student.assigned_tests_count} test{student.assigned_tests_count !== 1 ? 's' : ''} assigned)
                            </span>
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteStudent(student.id, student.full_name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Student"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-[#E5E7EB] flex justify-end">
              <button
                onClick={() => setShowStudentManagementModal(false)}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-[#111827] rounded-xl font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

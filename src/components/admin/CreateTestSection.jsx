import { useState, useEffect } from 'react';
import { Upload, FileText, Plus, Save, Trash2, ArrowLeft, CheckCircle, AlertCircle, Loader2, Pencil, Code, X, Eye } from 'lucide-react';
import { apiFetch } from '../../config/api';

// Feature flag for code execution - set to false to disable
const ENABLE_CODE_EXECUTION = false;

const CreateTestSection = ({ onComplete, editingTest }) => {
    const [step, setStep] = useState('init'); // init, manual, bulk, success, coding
    const [testTitle, setTestTitle] = useState('');
    const [jobRoles, setJobRoles] = useState([{ job_role: '', job_description: '' }]);
    const [duration, setDuration] = useState(60);
    const [maxAttempts, setMaxAttempts] = useState(1);
    const [passingPercentage, setPassingPercentage] = useState(50);
    const [startDateTime, setStartDateTime] = useState('');
    const [endDateTime, setEndDateTime] = useState('');
    const [questions, setQuestions] = useState([]);
    const [codingQuestions, setCodingQuestions] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedTestId, setUploadedTestId] = useState(null);
    const [uploadedTestName, setUploadedTestName] = useState('');
    const [isPublishing, setIsPublishing] = useState(false);
    const [isLoadingTest, setIsLoadingTest] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [viewMode, setViewMode] = useState(false); // New state for view mode
    
    // Name availability checker state
    const [nameAvailability, setNameAvailability] = useState({
        checking: false,
        available: null,
        message: ''
    });

    // Manual Question Logic
    const [currentQuestion, setCurrentQuestion] = useState({
        text: '',
        options: ['', '', '', ''],
        correctOption: null // 0, 1, 2, 3
    });

    // Coding Question Logic
    const [showCodingModal, setShowCodingModal] = useState(false);
    const [showCodingViewModal, setShowCodingViewModal] = useState(false);
    const [viewingCodingQuestion, setViewingCodingQuestion] = useState(null);
    const [editingCodingQuestionId, setEditingCodingQuestionId] = useState(null);
    const [currentCodingQuestion, setCurrentCodingQuestion] = useState({
        title: '',
        description: '',
        publicTestCases: [{ input: '', output: '', explanation: '' }],
        hiddenTestCases: [{ input: '', output: '' }],
        timeLimit: 2,
        memoryLimit: 256,
        marks: 10
    });

    // Load test data when editing
    useEffect(() => {
        const loadTestData = async () => {
            if (!editingTest) {
                setIsEditMode(false);
                setViewMode(false);
                return;
            }

            setIsEditMode(true);
            setViewMode(true); // Start in view mode when editing
            setIsLoadingTest(true);

            try {
                const token = localStorage.getItem('adminToken');
                const response = await apiFetch(`api/tests/${editingTest.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    const test = data.test;
                    setTestTitle(test.title);
                    setDuration(test.duration || 60);
                    setMaxAttempts(test.max_attempts || 1);
                    setPassingPercentage(test.passing_percentage || 50);
                    
                    // Format datetime for input (convert to Asia/Kolkata timezone)
                    if (test.start_datetime) {
                        const date = new Date(test.start_datetime);
                        // Convert to Asia/Kolkata timezone
                        const istDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
                        const year = istDate.getFullYear();
                        const month = String(istDate.getMonth() + 1).padStart(2, '0');
                        const day = String(istDate.getDate()).padStart(2, '0');
                        const hours = String(istDate.getHours()).padStart(2, '0');
                        const minutes = String(istDate.getMinutes()).padStart(2, '0');
                        setStartDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
                    } else {
                        setStartDateTime('');
                    }
                    
                    if (test.end_datetime) {
                        const date = new Date(test.end_datetime);
                        // Convert to Asia/Kolkata timezone
                        const istDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
                        const year = istDate.getFullYear();
                        const month = String(istDate.getMonth() + 1).padStart(2, '0');
                        const day = String(istDate.getDate()).padStart(2, '0');
                        const hours = String(istDate.getHours()).padStart(2, '0');
                        const minutes = String(istDate.getMinutes()).padStart(2, '0');
                        setEndDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
                    } else {
                        setEndDateTime('');
                    }
                    
                    // Load job roles
                    if (test.jobRoles && test.jobRoles.length > 0) {
                        setJobRoles(test.jobRoles.map(r => ({
                            job_role: r.job_role,
                            job_description: r.job_description
                        })));
                    } else if (test.job_role) {
                        setJobRoles([{
                            job_role: test.job_role,
                            job_description: test.description || ''
                        }]);
                    }

                    // Load questions
                    if (test.questions && test.questions.length > 0) {
                        const loadedQuestions = test.questions.map((q, idx) => ({
                            id: q.id || Date.now() + idx,
                            text: q.question_text,
                            options: [q.option_a, q.option_b, q.option_c || '', q.option_d || ''],
                            correctOption: q.correct_option.charCodeAt(0) - 65 // Convert 'A', 'B', 'C', 'D' to 0, 1, 2, 3
                        }));
                        setQuestions(loadedQuestions);
                    }

                    // Load coding questions
                    if (test.codingQuestions && test.codingQuestions.length > 0) {
                        const loadedCodingQuestions = test.codingQuestions.map((q, idx) => ({
                            id: q.id || Date.now() + idx,
                            title: q.title,
                            description: q.description,
                            timeLimit: q.timeLimit || 2,
                            memoryLimit: q.memoryLimit || 256,
                            marks: q.marks || 10,
                            publicTestCases: q.publicTestCases || [{ input: '', output: '', explanation: '' }],
                            hiddenTestCases: q.hiddenTestCases || [{ input: '', output: '' }]
                        }));
                        setCodingQuestions(loadedCodingQuestions);
                    }

                    setUploadedTestId(test.id);
                    setNameAvailability({ checking: false, available: true, message: 'Current test name' });
                    
                    // Stay on init step to allow editing test details first
                    setStep('init');
                } else {
                    alert(data.message || 'Failed to load test data');
                    if (onComplete) onComplete();
                }
            } catch (error) {
                console.error('Error loading test:', error);
                alert('Failed to load test data');
                if (onComplete) onComplete();
            } finally {
                setIsLoadingTest(false);
            }
        };

        loadTestData();
    }, [editingTest]);

    // Check name availability when title changes (skip if editing and name hasn't changed)
    useEffect(() => {
        const checkNameAvailability = async () => {
            if (!testTitle.trim()) {
                setNameAvailability({ checking: false, available: null, message: '' });
                return;
            }

            // Skip check if editing and name hasn't changed
            if (isEditMode && editingTest && testTitle === editingTest.name) {
                setNameAvailability({ checking: false, available: true, message: 'Current test name' });
                return;
            }

            setNameAvailability({ checking: true, available: null, message: '' });

            try {
                const token = localStorage.getItem('adminToken');
                const response = await apiFetch(`api/tests/check-name/${encodeURIComponent(testTitle)}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    setNameAvailability({
                        checking: false,
                        available: data.available,
                        message: data.message
                    });
                }
            } catch (error) {
                console.error('Error checking name availability:', error);
                setNameAvailability({ checking: false, available: null, message: '' });
            }
        };

        // Debounce the API call
        const timeoutId = setTimeout(checkNameAvailability, 500);
        return () => clearTimeout(timeoutId);
    }, [testTitle, isEditMode, editingTest]);

    const handleStart = (mode) => {
        if (!testTitle.trim()) {
            alert('Please enter a test title first');
            return;
        }
        if (jobRoles.length === 0 || !jobRoles[0].job_role.trim()) {
            alert('Please enter at least one job role');
            return;
        }
        if (!jobRoles[0].job_description.trim()) {
            alert('Please enter a job description for the first role');
            return;
        }
        if (nameAvailability.available === false) {
            alert('This test name is already taken. Please choose a different name.');
            return;
        }
        setStep(mode);
    };

    const handleAddJobRole = () => {
        setJobRoles([...jobRoles, { job_role: '', job_description: '' }]);
    };

    const handleRemoveJobRole = (index) => {
        if (jobRoles.length === 1) {
            alert('At least one job role is required');
            return;
        }
        const newJobRoles = jobRoles.filter((_, i) => i !== index);
        setJobRoles(newJobRoles);
    };

    const handleJobRoleChange = (index, field, value) => {
        const newJobRoles = [...jobRoles];
        newJobRoles[index][field] = value;
        setJobRoles(newJobRoles);
    };

    const handleAddQuestion = () => {
        if (!currentQuestion.text || currentQuestion.options.some(opt => !opt) || currentQuestion.correctOption === null) {
            alert('Please fill in all fields and select a correct answer');
            return;
        }
        setQuestions([...questions, { ...currentQuestion, id: Date.now() }]);
        setCurrentQuestion({
            text: '',
            options: ['', '', '', ''],
            correctOption: null
        });
    };

    const handleRemoveQuestion = (id) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    // Coding Question Handlers
    const handleAddPublicTestCase = () => {
        setCurrentCodingQuestion({
            ...currentCodingQuestion,
            publicTestCases: [...currentCodingQuestion.publicTestCases, { input: '', output: '', explanation: '' }]
        });
    };

    const handleRemovePublicTestCase = (index) => {
        const newTestCases = currentCodingQuestion.publicTestCases.filter((_, i) => i !== index);
        setCurrentCodingQuestion({
            ...currentCodingQuestion,
            publicTestCases: newTestCases.length > 0 ? newTestCases : [{ input: '', output: '', explanation: '' }]
        });
    };

    const handleAddHiddenTestCase = () => {
        setCurrentCodingQuestion({
            ...currentCodingQuestion,
            hiddenTestCases: [...currentCodingQuestion.hiddenTestCases, { input: '', output: '' }]
        });
    };

    const handleRemoveHiddenTestCase = (index) => {
        const newTestCases = currentCodingQuestion.hiddenTestCases.filter((_, i) => i !== index);
        setCurrentCodingQuestion({
            ...currentCodingQuestion,
            hiddenTestCases: newTestCases.length > 0 ? newTestCases : [{ input: '', output: '' }]
        });
    };

    const handleSaveCodingQuestion = () => {
        if (!currentCodingQuestion.title || !currentCodingQuestion.description) {
            alert('Please fill in title and description');
            return;
        }
        if (currentCodingQuestion.publicTestCases.some(tc => !tc.input || !tc.output)) {
            alert('Please fill in all public test cases');
            return;
        }
        if (currentCodingQuestion.hiddenTestCases.some(tc => !tc.input || !tc.output)) {
            alert('Please fill in all hidden test cases');
            return;
        }

        if (editingCodingQuestionId) {
            // Update existing question
            setCodingQuestions(codingQuestions.map(q => 
                q.id === editingCodingQuestionId ? { ...currentCodingQuestion, id: editingCodingQuestionId } : q
            ));
            setEditingCodingQuestionId(null);
        } else {
            // Add new question
            setCodingQuestions([...codingQuestions, { ...currentCodingQuestion, id: Date.now() }]);
        }
        
        setCurrentCodingQuestion({
            title: '',
            description: '',
            publicTestCases: [{ input: '', output: '', explanation: '' }],
            hiddenTestCases: [{ input: '', output: '' }],
            timeLimit: 2,
            memoryLimit: 256
        });
        setShowCodingModal(false);
    };

    const handleRemoveCodingQuestion = (id) => {
        setCodingQuestions(codingQuestions.filter(q => q.id !== id));
    };

    const handleViewCodingQuestion = (question) => {
        setViewingCodingQuestion(question);
        setShowCodingViewModal(true);
    };

    const handleEditCodingQuestion = (question) => {
        setCurrentCodingQuestion({
            title: question.title,
            description: question.description,
            publicTestCases: [...question.publicTestCases],
            hiddenTestCases: [...question.hiddenTestCases],
            timeLimit: question.timeLimit,
            memoryLimit: question.memoryLimit
        });
        setEditingCodingQuestionId(question.id);
        setShowCodingModal(true);
    };

    const convertISTToUTC = (dateTimeString) => {
        if (!dateTimeString) return null;
        // Parse the datetime-local value as IST and convert to UTC
        const [datePart, timePart] = dateTimeString.split('T');
        const [year, month, day] = datePart.split('-');
        const [hours, minutes] = timePart.split(':');
        
        // Create date string in IST format
        const istDateString = `${year}-${month}-${day}T${hours}:${minutes}:00+05:30`;
        const date = new Date(istDateString);
        
        return date.toISOString();
    };

    const handleManualSubmit = async () => {
        if (questions.length === 0 && codingQuestions.length === 0) {
            alert('Please add at least one question (MCQ or Coding)');
            return;
        }

        setIsUploading(true);
        
        try {
            const token = localStorage.getItem('adminToken');
            
            // Prepare question data
            const questionData = questions.map(q => ({
                question_text: q.text,
                options: q.options,
                correctOption: q.correctOption,
                question: q.text,
                optiona: q.options[0],
                optionb: q.options[1],
                optionc: q.options[2],
                optiond: q.options[3],
                correct_option: String.fromCharCode(65 + q.correctOption),
                correctoption: String.fromCharCode(65 + q.correctOption),
                marks: 1
            }));

            let response, data;

            if (isEditMode && uploadedTestId) {
                // Update existing test
                response = await apiFetch(`api/tests/${uploadedTestId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        testName: testTitle,
                        jobRoles: jobRoles,
                        duration: duration,
                        maxAttempts: maxAttempts,
                        passingPercentage: passingPercentage,
                        startDateTime: convertISTToUTC(startDateTime),
                        endDateTime: convertISTToUTC(endDateTime),
                        questions: questionData
                    })
                });

                data = await response.json();

                if (response.ok && data.success) {
                    // CODE EXECUTION FEATURE - TEMPORARILY DISABLED
                    if (ENABLE_CODE_EXECUTION) {
                        // ALWAYS save coding questions (even if empty, to clear old ones)
                        console.log('[UPDATE TEST] Saving coding questions:', codingQuestions.length);
                        console.log('[UPDATE TEST] Coding questions data:', JSON.stringify(codingQuestions, null, 2));
                        
                        const codingResponse = await apiFetch(`api/coding-questions/test/${uploadedTestId}`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                codingQuestions: codingQuestions
                            })
                        });

                        const codingData = await codingResponse.json();
                        if (!codingResponse.ok || !codingData.success) {
                            console.error('[UPDATE TEST] Failed to save coding questions:', codingData);
                            alert('Test updated but failed to save coding questions: ' + codingData.message);
                            setIsUploading(false);
                            return;
                        }
                        console.log('[UPDATE TEST] Coding questions saved successfully');
                    }

                    alert('Test updated successfully!');
                    // Go back to view mode instead of dashboard
                    setViewMode(true);
                    setStep('init');
                } else {
                    alert(data.message || 'Failed to update test');
                }
            } else {
                // Create new test
                response = await apiFetch('api/upload/manual', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        testName: testTitle,
                        jobRoles: jobRoles,
                        duration: duration,
                        maxAttempts: maxAttempts,
                        passingPercentage: passingPercentage,
                        startDateTime: convertISTToUTC(startDateTime),
                        endDateTime: convertISTToUTC(endDateTime),
                        status: 'draft', // Save as draft initially
                        questions: questionData
                    })
                });

                data = await response.json();

                if (response.ok && data.success) {
                    const testId = data.testId;
                    
                    // CODE EXECUTION FEATURE - TEMPORARILY DISABLED
                    if (ENABLE_CODE_EXECUTION) {
                        // ALWAYS save coding questions (even if empty, to ensure consistency)
                        console.log('[CREATE TEST] Saving coding questions for new test:', codingQuestions.length);
                        console.log('[CREATE TEST] Coding questions data:', JSON.stringify(codingQuestions, null, 2));
                        
                        const codingResponse = await apiFetch(`api/coding-questions/test/${testId}`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                codingQuestions: codingQuestions
                            })
                        });

                        const codingData = await codingResponse.json();
                        if (!codingResponse.ok || !codingData.success) {
                            console.error('[CREATE TEST] Failed to save coding questions:', codingData);
                            alert('Test created but failed to save coding questions: ' + codingData.message);
                            setIsUploading(false);
                            return;
                        }
                        console.log('[CREATE TEST] Coding questions saved successfully');
                    }

                    setUploadedTestId(testId);
                    setUploadedTestName(testTitle);
                    setStep('success');
                } else {
                    alert(data.message || 'Failed to create test');
                }
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('Failed to save test. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleBulkUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Confirm replacement if in edit mode
        if (isEditMode && questions.length > 0) {
            const confirmed = confirm(
                `⚠️ Warning: This will delete all ${questions.length} existing question${questions.length !== 1 ? 's' : ''} and replace them with the questions from the uploaded file.\n\nAre you sure you want to continue?`
            );
            if (!confirmed) {
                e.target.value = ''; // Reset file input
                return;
            }
        }

        setIsUploading(true);
        
        try {
            const token = localStorage.getItem('adminToken');

            if (isEditMode && uploadedTestId) {
                // Edit mode: Update existing test with new questions from file
                const formData = new FormData();
                formData.append('file', file);
                formData.append('testName', testTitle);
                formData.append('jobRoles', JSON.stringify(jobRoles));
                formData.append('testDescription', jobRoles[0]?.job_description || '');
                formData.append('duration', duration);
                formData.append('maxAttempts', maxAttempts);
                formData.append('passingPercentage', passingPercentage);
                formData.append('startDateTime', convertISTToUTC(startDateTime) || '');
                formData.append('endDateTime', convertISTToUTC(endDateTime) || '');
                formData.append('testId', uploadedTestId); // Include test ID for update

                const response = await apiFetch(`api/upload/questions/${uploadedTestId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    // CODE EXECUTION FEATURE - TEMPORARILY DISABLED
                    if (ENABLE_CODE_EXECUTION) {
                        // Save coding questions after bulk upload in edit mode
                        console.log('[BULK UPLOAD EDIT] Saving coding questions:', codingQuestions.length);
                        console.log('[BULK UPLOAD EDIT] Coding questions data:', JSON.stringify(codingQuestions, null, 2));
                        
                        const codingResponse = await apiFetch(`api/coding-questions/test/${uploadedTestId}`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                codingQuestions: codingQuestions
                            })
                        });

                        const codingData = await codingResponse.json();
                        if (!codingResponse.ok || !codingData.success) {
                            console.error('[BULK UPLOAD EDIT] Failed to save coding questions:', codingData);
                            alert('Questions uploaded but failed to save coding questions: ' + codingData.message);
                            setIsUploading(false);
                            return;
                        }
                        console.log('[BULK UPLOAD EDIT] Coding questions saved successfully');
                    }
                    
                    alert(`Questions uploaded successfully! ${data.questionsCount} questions added. Click "Save Changes" to save.`);
                    // Reload test data to show new questions
                    const testResponse = await apiFetch(`api/tests/${uploadedTestId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    const testData = await testResponse.json();
                    if (testResponse.ok && testData.success && testData.test.questions) {
                        const loadedQuestions = testData.test.questions.map((q, idx) => ({
                            id: q.id || Date.now() + idx,
                            text: q.question_text,
                            options: [q.option_a, q.option_b, q.option_c || '', q.option_d || ''],
                            correctOption: q.correct_option.charCodeAt(0) - 65
                        }));
                        setQuestions(loadedQuestions);
                    }
                    // Stay in edit mode (init step) to allow saving
                    setStep('init');
                } else {
                    alert(data.message || 'Failed to upload questions');
                }
            } else {
                // Create mode: Create new test
                const formData = new FormData();
                formData.append('file', file);
                formData.append('testName', testTitle);
                formData.append('jobRoles', JSON.stringify(jobRoles));
                formData.append('testDescription', jobRoles[0]?.job_description || '');
                formData.append('duration', duration);
                formData.append('maxAttempts', maxAttempts);
                formData.append('passingPercentage', passingPercentage);
                formData.append('startDateTime', convertISTToUTC(startDateTime) || '');
                formData.append('endDateTime', convertISTToUTC(endDateTime) || '');
                formData.append('status', 'draft'); // Save as draft initially

                const response = await apiFetch('api/upload/questions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    const testId = data.testId;
                    
                    // CODE EXECUTION FEATURE - TEMPORARILY DISABLED
                    if (ENABLE_CODE_EXECUTION) {
                        // Save coding questions after bulk upload
                        console.log('[BULK UPLOAD] Saving coding questions:', codingQuestions.length);
                        console.log('[BULK UPLOAD] Coding questions data:', JSON.stringify(codingQuestions, null, 2));
                        
                        const codingResponse = await apiFetch(`api/coding-questions/test/${testId}`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                codingQuestions: codingQuestions
                            })
                        });

                        const codingData = await codingResponse.json();
                        if (!codingResponse.ok || !codingData.success) {
                            console.error('[BULK UPLOAD] Failed to save coding questions:', codingData);
                            alert('Test created but failed to save coding questions: ' + codingData.message);
                            setIsUploading(false);
                            return;
                        }
                        console.log('[BULK UPLOAD] Coding questions saved successfully');
                    }
                    
                    setUploadedTestId(testId);
                    setUploadedTestName(testTitle);
                    setStep('success');
                } else {
                    alert(data.message || 'Failed to upload test');
                }
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload test. Please try again.');
        } finally {
            setIsUploading(false);
            e.target.value = ''; // Reset file input
        }
    };

    const handlePublish = async () => {
        setIsPublishing(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await apiFetch(`api/tests/${uploadedTestId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'published' })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert(`Test "${uploadedTestName}" published successfully! Students can now see it.`);
                resetForm();
                if (onComplete) onComplete();
            } else {
                alert(data.message || 'Failed to publish test');
            }
        } catch (error) {
            console.error('Publish error:', error);
            alert('Failed to publish test. Please try again.');
        } finally {
            setIsPublishing(false);
        }
    };

    const resetForm = () => {
        setStep('init');
        setTestTitle('');
        setJobRoles([{ job_role: '', job_description: '' }]);
        setDuration(60);
        setMaxAttempts(1);
        setPassingPercentage(50);
        setStartDateTime('');
        setEndDateTime('');
        setQuestions([]);
        setCodingQuestions([]);
        setUploadedTestId(null);
        setUploadedTestName('');
    };

    return (
        <div className="space-y-6">
            {/* Step 1: Initialization */}
            {step === 'init' && (
                <div className="bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-light p-8 max-w-3xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-shnoor-navy">{isEditMode ? (viewMode ? 'View Assessment' : 'Edit Assessment') : 'Create New Assessment'}</h2>
                        {viewMode && (
                            <button
                                onClick={() => setViewMode(false)}
                                className="px-4 py-2 bg-shnoor-indigo text-white rounded-lg hover:bg-shnoor-indigo transition-colors font-medium flex items-center space-x-2"
                            >
                                <Pencil size={18} />
                                <span>Edit</span>
                            </button>
                        )}
                    </div>

                    <div className="space-y-6">
                        {/* Test Title */}
                        <div>
                            <label className="block text-sm font-bold text-shnoor-navy mb-2">Test Title *</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={testTitle}
                                    onChange={(e) => setTestTitle(e.target.value)}
                                    disabled={viewMode}
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:border-shnoor-indigo focus:ring-shnoor-indigo/20 transition-all font-medium text-shnoor-navy shadow-sm pr-10 ${viewMode ? 'bg-shnoor-light opacity-50 cursor-not-allowed border-shnoor-light' :
                                            nameAvailability.available === false
                                                ? 'border-shnoor-danger bg-shnoor-dangerLight'
                                                : nameAvailability.available === true
                                                    ? 'border-shnoor-success bg-white'
                                                    : 'border-shnoor-light bg-white'
                                    }`}
                                    placeholder="e.g., Java Fundamentals - Batch A"
                                    required
                                />
                                {nameAvailability.checking && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <Loader2 className="w-5 h-5 text-shnoor-navy animate-spin" />
                                    </div>
                                )}
                                {!nameAvailability.checking && nameAvailability.available === true && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <CheckCircle className="w-5 h-5 text-shnoor-success" />
                                    </div>
                                )}
                                {!nameAvailability.checking && nameAvailability.available === false && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <AlertCircle className="w-5 h-5 text-shnoor-danger" />
                                    </div>
                                )}
                            </div>
                            {nameAvailability.message && (
                                <p className={`mt-2 text-sm ${
                                    nameAvailability.available 
                                        ? 'text-shnoor-success' 
                                        : 'text-shnoor-danger'
                                }`}>
                                    {nameAvailability.message}
                                </p>
                            )}
                        </div>

                        {/* Job Roles Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-bold text-shnoor-navy">Job Roles & Descriptions *</label>
                                {!viewMode && (
                                    <button
                                        type="button"
                                        onClick={handleAddJobRole}
                                        className="flex items-center space-x-1 px-3 py-1.5 bg-white text-shnoor-indigo hover:text-shnoor-navy rounded-lg hover:bg-shnoor-light/30 border border-shnoor-light transition-colors text-sm font-medium"
                                    >
                                        <Plus size={16} />
                                        <span>Add Role</span>
                                    </button>
                                )}
                            </div>
                            
                            {jobRoles.map((role, index) => (
                                <div key={index} className="p-5 border border-shnoor-light rounded-xl space-y-3 bg-white shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-shnoor-navy">
                                            Role {index + 1} {index === 0 && <span className="text-shnoor-indigo ml-2 px-2 py-1 bg-shnoor-lavender rounded-md text-xs">(Default)</span>}
                                        </span>
                                        {!viewMode && jobRoles.length > 1 && (
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
                                            value={role.job_role}
                                            onChange={(e) => handleJobRoleChange(index, 'job_role', e.target.value)}
                                            disabled={viewMode}
                                            className={`w-full px-4 py-3 border-2 border-shnoor-light rounded-xl focus:ring-4 focus:ring-shnoor-indigo/20 focus:border-shnoor-indigo transition-all font-medium text-shnoor-navy ${viewMode ? 'bg-shnoor-light opacity-50 cursor-not-allowed' : 'bg-white'}`}
                                            placeholder="e.g., Senior Software Engineer, Junior Developer"
                                            required
                                        />
                                    </div>
                                    
                                    <div>
                                        <textarea
                                            value={role.job_description}
                                            onChange={(e) => handleJobRoleChange(index, 'job_description', e.target.value)}
                                            rows={4}
                                            disabled={viewMode}
                                            className={`w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent resize-y ${viewMode ? 'bg-shnoor-lavender cursor-not-allowed' : ''}`}
                                            placeholder="Enter job description, requirements, responsibilities..."
                                            required
                                        />
                                    </div>
                                </div>
                            ))}
                            <p className="text-xs text-shnoor-navy">Students will be able to select a role and view its description before taking the test</p>
                        </div>

                        {/* Duration and Max Attempts */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-shnoor-navy mb-2">Duration (minutes) *</label>
                                <input
                                    type="number"
                                    value={duration}
                                    onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                                    min="1"
                                    disabled={viewMode}
                                    className={`w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent ${viewMode ? 'bg-shnoor-lavender cursor-not-allowed' : ''}`}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-shnoor-navy mb-2">Max Attempts *</label>
                                <input
                                    type="number"
                                    value={maxAttempts}
                                    onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 1)}
                                    min="1"
                                    disabled={viewMode}
                                    className={`w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent ${viewMode ? 'bg-shnoor-lavender cursor-not-allowed' : ''}`}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-shnoor-navy mb-2">Passing % *</label>
                                <input
                                    type="number"
                                    value={passingPercentage}
                                    onChange={(e) => setPassingPercentage(parseInt(e.target.value) || 50)}
                                    disabled={viewMode}
                                    className={`w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent ${viewMode ? 'bg-shnoor-lavender cursor-not-allowed' : ''}`}
                                    min="0"
                                    max="100"
                                    required
                                />
                            </div>
                        </div>

                        {/* Start and End DateTime */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-shnoor-navy mb-2">Start Date & Time (Optional)</label>
                                <input
                                    type="datetime-local"
                                    value={startDateTime}
                                    onChange={(e) => setStartDateTime(e.target.value)}
                                    disabled={viewMode}
                                    className={`w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent ${viewMode ? 'bg-shnoor-lavender cursor-not-allowed' : ''}`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-shnoor-navy mb-2">End Date & Time (Optional)</label>
                                <input
                                    type="datetime-local"
                                    value={endDateTime}
                                    onChange={(e) => setEndDateTime(e.target.value)}
                                    disabled={viewMode}
                                    className={`w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent ${viewMode ? 'bg-shnoor-lavender cursor-not-allowed' : ''}`}
                                />
                            </div>
                        </div>

                        {/* Add Coding Question Button */}
                        {!viewMode && !isEditMode && (
                            <div className="pt-4 border-t border-shnoor-mist">
                                <button
                                    onClick={() => {
                                        setEditingCodingQuestionId(null);
                                        setCurrentCodingQuestion({
                                            title: '',
                                            description: '',
                                            publicTestCases: [{ input: '', output: '', explanation: '' }],
                                            hiddenTestCases: [{ input: '', output: '' }],
                                            timeLimit: 2,
                                            memoryLimit: 256
                                        });
                                        setShowCodingModal(true);
                                    }}
                                    className="w-full py-3 bg-white border-2 border-shnoor-mist hover:border-shnoor-indigo text-shnoor-navy hover:text-shnoor-indigo font-semibold rounded-lg transition-all flex items-center justify-center space-x-2"
                                >
                                    <Code size={20} />
                                    <span>Add Coding Question</span>
                                </button>
                            </div>
                        )}

                        {/* Coding Questions List */}
                        {!viewMode && !isEditMode && codingQuestions.length > 0 && (
                            <div className="pt-4 space-y-3">
                                {codingQuestions.map((q, idx) => (
                                    <div key={q.id} className="bg-white border-2 border-shnoor-mist rounded-lg p-4 hover:border-shnoor-mist transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-shnoor-lavender rounded-lg flex items-center justify-center">
                                                    <Code className="w-5 h-5 text-shnoor-navy" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-shnoor-navy">Coding Question {idx + 1}</h4>
                                                    <p className="text-sm text-shnoor-navy">{q.title}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleViewCodingQuestion(q)}
                                                    className="p-2 bg-shnoor-lavender hover:bg-shnoor-lavender text-shnoor-navy rounded-lg transition-colors"
                                                    title="View question"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleEditCodingQuestion(q)}
                                                    className="p-2 bg-shnoor-lavender hover:bg-shnoor-lavender text-shnoor-indigo rounded-lg transition-colors"
                                                    title="Edit question"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveCodingQuestion(q.id)}
                                                    className="p-2 bg-shnoor-dangerLight hover:bg-shnoor-dangerLight text-shnoor-danger rounded-lg transition-colors"
                                                    title="Delete question"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {isEditMode ? (
                            /* Edit Mode: Show options to edit manually or upload new file */
                            <div className="pt-6">
                                <div className="bg-shnoor-lavender border-2 border-shnoor-mist rounded-xl p-6 mb-6">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className="w-10 h-10 bg-shnoor-indigo rounded-full flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-shnoor-navy">Current Questions</h3>
                                            <p className="text-sm text-shnoor-navy">{questions.length} question{questions.length !== 1 ? 's' : ''} loaded</p>
                                        </div>
                                    </div>
                                    {!viewMode && (
                                        <p className="text-sm text-shnoor-navy">
                                            Choose how you want to update the questions for this test.
                                        </p>
                                    )}
                                </div>

                                {!viewMode && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            <button
                                                onClick={() => handleStart('manual')}
                                                className="p-6 border-2 border-shnoor-mist rounded-xl text-left transition-all hover:border-shnoor-indigo hover:shadow-lg group bg-white"
                                            >
                                                <div className="w-12 h-12 bg-shnoor-lavender rounded-full flex items-center justify-center mb-4 group-hover:bg-shnoor-indigo transition-colors">
                                                    <FileText className="w-6 h-6 text-shnoor-indigo group-hover:text-white" />
                                                </div>
                                                <h3 className="font-bold text-shnoor-navy mb-2">Edit Questions Manually</h3>
                                                <p className="text-sm text-shnoor-navy mb-3">Edit existing questions, add new ones, or remove questions individually.</p>
                                                <div className="flex items-center text-xs text-shnoor-indigo font-medium">
                                                    <span>Edit {questions.length} question{questions.length !== 1 ? 's' : ''}</span>
                                                    <ArrowLeft size={14} className="ml-1 rotate-180" />
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => handleStart('bulk')}
                                                className="p-6 border-2 border-shnoor-mist rounded-xl text-left transition-all hover:border-shnoor-danger hover:shadow-lg group bg-white"
                                            >
                                                <div className="w-12 h-12 bg-shnoor-dangerLight rounded-full flex items-center justify-center mb-4 group-hover:bg-shnoor-danger transition-colors">
                                                    <Upload className="w-6 h-6 text-shnoor-danger group-hover:text-white" />
                                                </div>
                                                <h3 className="font-bold text-shnoor-navy mb-2">Upload New Questions File</h3>
                                                <p className="text-sm text-shnoor-navy mb-3">Replace all existing questions by uploading a new CSV/Excel file.</p>
                                                <div className="flex items-center text-xs text-shnoor-danger font-medium">
                                                    <AlertCircle size={14} className="mr-1" />
                                                    <span>Will replace {questions.length} question{questions.length !== 1 ? 's' : ''}</span>
                                                </div>
                                            </button>
                                        </div>
                                        
                                        <div className="bg-shnoor-warningLight border-2 border-shnoor-warningLight rounded-xl p-4 flex items-start space-x-3 mb-6">
                                            <AlertCircle className="w-5 h-5 text-shnoor-warning flex-shrink-0 mt-0.5" />
                                            <div className="text-sm text-shnoor-warning">
                                                <p className="font-semibold mb-1">Important:</p>
                                                <ul className="list-disc list-inside space-y-1">
                                                    <li>Review test details above before proceeding</li>
                                                    <li>Uploading a new file will <strong>delete all existing questions</strong></li>
                                                    <li>Changes will be saved when you click "Save Changes"</li>
                                                </ul>
                                            </div>
                                        </div>

                                        {/* Save Changes and Cancel Buttons */}
                                        <div className="flex items-center space-x-3">
                                            <button
                                                onClick={handleManualSubmit}
                                                disabled={isUploading}
                                                className="flex-1 py-4 bg-shnoor-indigo hover:bg-shnoor-indigo text-white font-bold rounded-lg transition-colors shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isUploading ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                        <span>Saving...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save size={20} />
                                                        <span>Save Changes</span>
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => setViewMode(true)}
                                                disabled={isUploading}
                                                className="px-6 py-4 bg-shnoor-lavender hover:bg-shnoor-lavender text-shnoor-navy font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            /* Create Mode: Show manual and bulk upload options */
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                <button
                                    onClick={() => handleStart('manual')}
                                    className={`p-6 border-2 border-shnoor-mist rounded-xl text-left transition-all hover:border-shnoor-indigo group bg-white ${
                                        !testTitle || jobRoles.length === 0 || !jobRoles[0].job_role || !jobRoles[0].job_description || nameAvailability.available === false || nameAvailability.checking
                                            ? 'opacity-50 cursor-not-allowed' 
                                            : 'hover:shadow-md'
                                    }`}
                                    disabled={!testTitle || jobRoles.length === 0 || !jobRoles[0].job_role || !jobRoles[0].job_description || nameAvailability.available === false || nameAvailability.checking}
                                >
                                    <div className="w-12 h-12 bg-shnoor-lavender rounded-full flex items-center justify-center mb-4 group-hover:bg-shnoor-indigo transition-colors">
                                        <Plus className="w-6 h-6 text-shnoor-indigo group-hover:text-white" />
                                    </div>
                                    <h3 className="font-bold text-shnoor-navy mb-1">Manual Entry</h3>
                                    <p className="text-sm text-shnoor-navy">Add questions one by one with a simple form interface.</p>
                                </button>

                                <button
                                    onClick={() => handleStart('bulk')}
                                    className={`p-6 border-2 border-shnoor-mist rounded-xl text-left transition-all hover:border-shnoor-indigo group bg-white ${
                                        !testTitle || jobRoles.length === 0 || !jobRoles[0].job_role || !jobRoles[0].job_description || nameAvailability.available === false || nameAvailability.checking
                                            ? 'opacity-50 cursor-not-allowed' 
                                            : 'hover:shadow-md'
                                    }`}
                                    disabled={!testTitle || jobRoles.length === 0 || !jobRoles[0].job_role || !jobRoles[0].job_description || nameAvailability.available === false || nameAvailability.checking}
                                >
                                    <div className="w-12 h-12 bg-shnoor-lavender rounded-full flex items-center justify-center mb-4 group-hover:bg-shnoor-indigo transition-colors">
                                        <Upload className="w-6 h-6 text-shnoor-indigo group-hover:text-white" />
                                    </div>
                                    <h3 className="font-bold text-shnoor-navy mb-1">Bulk Upload</h3>
                                    <p className="text-sm text-shnoor-navy">Upload an Excel or CSV file containing multiple questions.</p>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Step 2: Manual Entry */}
            {step === 'manual' && (
                <div className="bg-white rounded-xl shadow-sm border border-shnoor-mist p-6">
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-shnoor-mist">
                        <div className="flex items-center space-x-4">
                            <button onClick={() => setStep('init')} className="p-2 hover:bg-shnoor-lavender rounded-full transition-colors">
                                <ArrowLeft size={20} className="text-shnoor-navy" />
                            </button>
                            <div>
                                <h2 className="text-xl font-bold text-shnoor-navy">{testTitle}</h2>
                                <p className="text-sm text-shnoor-navy">Adding questions manually</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 bg-shnoor-lavender px-4 py-2 rounded-lg">
                            <span className="text-shnoor-indigo font-bold">{questions.length}</span>
                            <span className="text-shnoor-indigo text-sm">Questions Added</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Form Side */}
                        <div className="lg:col-span-2 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-shnoor-navy mb-2">Question Text</label>
                                <textarea
                                    value={currentQuestion.text}
                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent"
                                    placeholder="Enter question text here..."
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-shnoor-navy">Options</label>
                                {currentQuestion.options.map((opt, idx) => (
                                    <div key={idx} className="flex items-center space-x-3">
                                        <span className="w-6 text-sm text-shnoor-navy font-medium">{String.fromCharCode(65 + idx)}</span>
                                        <input
                                            type="text"
                                            value={opt}
                                            onChange={(e) => {
                                                const newOptions = [...currentQuestion.options];
                                                newOptions[idx] = e.target.value;
                                                setCurrentQuestion({ ...currentQuestion, options: newOptions });
                                            }}
                                            className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-shnoor-navyLight focus:border-transparent ${currentQuestion.correctOption === idx ? 'border-shnoor-success bg-shnoor-successLight' : 'border-shnoor-mist'}`}
                                            placeholder={`Option ${idx + 1}`}
                                        />
                                        <button
                                            onClick={() => setCurrentQuestion({ ...currentQuestion, correctOption: idx })}
                                            className={`p-2 rounded-full transition-colors ${currentQuestion.correctOption === idx ? 'bg-shnoor-successLight text-shnoor-success' : 'bg-shnoor-lavender text-shnoor-navy hover:bg-shnoor-lavender'}`}
                                            title="Mark as correct answer"
                                        >
                                            <CheckCircle size={20} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleAddQuestion}
                                className="w-full py-3 bg-shnoor-navyLight hover:bg-shnoor-navyLight text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
                            >
                                <Plus size={20} />
                                <span>Add Question to Test</span>
                            </button>

                            <div className="pt-6 border-t border-shnoor-mist">
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={handleManualSubmit}
                                        disabled={questions.length === 0 || isUploading}
                                        className={`flex-1 py-4 bg-shnoor-indigo hover:bg-shnoor-indigo text-white font-bold rounded-lg transition-colors shadow-sm flex items-center justify-center space-x-2 ${questions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {isUploading ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        ) : (
                                            <>
                                                <Save size={20} />
                                                <span>{isEditMode ? 'Save Changes' : 'Save'} ({questions.length} Questions)</span>
                                            </>
                                        )}
                                    </button>
                                    {isEditMode && (
                                        <button
                                            onClick={() => {
                                                setStep('init');
                                                setViewMode(true);
                                            }}
                                            disabled={isUploading}
                                            className="px-6 py-4 bg-shnoor-lavender hover:bg-shnoor-lavender text-shnoor-navy font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Preview Side */}
                        <div className="bg-shnoor-lavender rounded-xl p-4 h-fit max-h-[600px] overflow-y-auto border border-shnoor-mist">
                            <h3 className="font-bold text-shnoor-navy mb-4 sticky top-0 bg-shnoor-lavender pb-2">Added Questions</h3>
                            {questions.length === 0 ? (
                                <div className="text-center py-8 text-shnoor-navy">
                                    <FileText className="mx-auto h-10 w-10 mb-2 opacity-50" />
                                    <p>No questions added yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {questions.map((q, idx) => (
                                        <div key={q.id} className="bg-white p-4 rounded-lg border border-shnoor-mist shadow-sm group">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-xs text-shnoor-navy bg-shnoor-lavender px-2 py-1 rounded">Q{idx + 1}</span>
                                                <button
                                                    onClick={() => handleRemoveQuestion(q.id)}
                                                    className="text-shnoor-danger hover:text-shnoor-danger opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <p className="text-sm font-medium text-shnoor-navy mb-2 line-clamp-2">{q.text}</p>
                                            <div className="space-y-1">
                                                {q.options.map((opt, i) => (
                                                    <div key={i} className={`text-xs px-2 py-1 rounded ${q.correctOption === i ? 'bg-shnoor-successLight text-shnoor-success font-medium' : 'text-shnoor-navy'}`}>
                                                        {opt}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Bulk Upload */}
            {step === 'bulk' && (
                <div className="bg-white rounded-xl shadow-sm border border-shnoor-mist p-6 max-w-2xl mx-auto">
                    <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-shnoor-mist">
                        <button onClick={() => setStep('init')} className="p-2 hover:bg-shnoor-lavender rounded-full transition-colors">
                            <ArrowLeft size={20} className="text-shnoor-navy" />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-shnoor-navy">{testTitle}</h2>
                            <p className="text-sm text-shnoor-navy">Bulk Upload via Excel/CSV</p>
                        </div>
                    </div>

                    <div className="border-2 border-dashed border-shnoor-mist rounded-lg p-12 text-center hover:border-shnoor-indigo transition-colors relative">
                        {isUploading && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shnoor-indigo"></div>
                            </div>
                        )}

                        <div className="w-16 h-16 bg-shnoor-lavender rounded-full flex items-center justify-center mx-auto mb-4">
                            <Upload className="w-8 h-8 text-shnoor-navy" />
                        </div>
                        <p className="text-shnoor-navy mb-2">Drag and drop your Excel/CSV file here</p>
                        <p className="text-sm text-shnoor-navy mb-6">Supported formats: .csv, .xlsx, .xls</p>

                        <label className="inline-flex items-center px-6 py-3 bg-shnoor-indigo hover:bg-shnoor-indigo text-white font-semibold rounded-lg cursor-pointer transition-colors shadow-sm">
                            <Upload size={18} className="mr-2" />
                            Select File
                            <input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                className="hidden"
                                onChange={handleBulkUpload}
                                disabled={isUploading}
                            />
                        </label>
                    </div>

                    <div className="mt-8 bg-shnoor-lavender p-4 rounded-lg flex items-start space-x-3">
                        <div className="flex-shrink-0">
                            <FileText className="h-5 w-5 text-shnoor-indigo" />
                        </div>
                        <div className="text-sm text-shnoor-indigo">
                            <p className="font-bold mb-1">CSV Template Format:</p>
                            <p>Question, Option1, Option2, Option3, Option4, CorrectOption(1-4), Marks, Tags</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Success Screen */}
            {step === 'success' && (
                <div className="bg-white rounded-xl shadow-sm border border-shnoor-mist p-8 max-w-2xl mx-auto">
                    <div className="text-center">
                        {/* Success Icon */}
                        <div className="w-20 h-20 bg-shnoor-successLight rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-12 h-12 text-shnoor-success" />
                        </div>

                        {/* Success Message */}
                        <h2 className="text-3xl font-bold text-shnoor-navy mb-3">Test Saved as Draft!</h2>
                        <p className="text-lg text-shnoor-navy mb-2">"{uploadedTestName}"</p>
                        <p className="text-sm text-shnoor-navy mb-8">Your test has been saved as a draft. You can publish it now or later from the dashboard.</p>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={handlePublish}
                                disabled={isPublishing}
                                className="w-full py-4 bg-shnoor-indigo hover:bg-shnoor-indigo text-white font-bold rounded-lg transition-colors shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPublishing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Publishing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={20} />
                                        <span>Publish Test Now</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => {
                                    resetForm();
                                    if (onComplete) onComplete();
                                }}
                                className="w-full py-4 bg-shnoor-lavender hover:bg-shnoor-lavender text-shnoor-navy font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
                            >
                                <ArrowLeft size={20} />
                                <span>Save as Draft & Return to Dashboard</span>
                            </button>
                        </div>

                        {/* Info Box */}
                        <div className="mt-8 bg-shnoor-lavender p-4 rounded-lg text-left">
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    <FileText className="h-5 w-5 text-shnoor-indigo" />
                                </div>
                                <div className="text-sm text-shnoor-indigo">
                                    <p className="font-bold mb-1">What's the difference?</p>
                                    <ul className="text-shnoor-indigo space-y-1 list-disc list-inside">
                                        <li><span className="font-semibold">Draft:</span> Test is saved but not visible to students</li>
                                        <li><span className="font-semibold">Published:</span> Students can immediately see and take the test</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Coding Question Modal */}
            {showCodingModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-shnoor-mist p-6 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-shnoor-lavender rounded-lg flex items-center justify-center">
                                    <Code className="w-6 h-6 text-shnoor-navy" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-shnoor-navy">
                                        {editingCodingQuestionId ? 'Edit Coding Question' : 'Add Coding Question'}
                                    </h2>
                                    <p className="text-shnoor-navy text-sm">Create a programming challenge for students</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowCodingModal(false);
                                    setEditingCodingQuestionId(null);
                                }}
                                className="p-2 hover:bg-shnoor-lavender rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6 text-shnoor-navy" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6">
                            {/* Question Title */}
                            <div>
                                <label className="block text-sm font-medium text-shnoor-navy mb-2">Question Title *</label>
                                <input
                                    type="text"
                                    value={currentCodingQuestion.title}
                                    onChange={(e) => setCurrentCodingQuestion({ ...currentCodingQuestion, title: e.target.value })}
                                    className="w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-indigo focus:border-transparent"
                                    placeholder="e.g., Two Sum Problem, Reverse a String"
                                />
                            </div>

                            {/* Question Description */}
                            <div>
                                <label className="block text-sm font-medium text-shnoor-navy mb-2">Problem Description *</label>
                                <textarea
                                    value={currentCodingQuestion.description}
                                    onChange={(e) => setCurrentCodingQuestion({ ...currentCodingQuestion, description: e.target.value })}
                                    rows={6}
                                    className="w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-indigo focus:border-transparent resize-y font-mono text-sm"
                                    placeholder="Describe the problem, constraints, input/output format, etc."
                                />
                            </div>

                            {/* Time and Memory Limits */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-shnoor-navy mb-2">Time Limit (seconds)</label>
                                    <input
                                        type="number"
                                        value={currentCodingQuestion.timeLimit}
                                        onChange={(e) => setCurrentCodingQuestion({ ...currentCodingQuestion, timeLimit: parseFloat(e.target.value) || 2 })}
                                        min="0.1"
                                        step="0.1"
                                        className="w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-indigo focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-shnoor-navy mb-2">Memory Limit (MB)</label>
                                    <input
                                        type="number"
                                        value={currentCodingQuestion.memoryLimit}
                                        onChange={(e) => setCurrentCodingQuestion({ ...currentCodingQuestion, memoryLimit: parseInt(e.target.value) || 256 })}
                                        min="1"
                                        className="w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-indigo focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-shnoor-navy mb-2">Marks *</label>
                                    <input
                                        type="number"
                                        value={currentCodingQuestion.marks}
                                        onChange={(e) => setCurrentCodingQuestion({ ...currentCodingQuestion, marks: parseInt(e.target.value) || 10 })}
                                        min="1"
                                        className="w-full px-4 py-3 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-indigo focus:border-transparent"
                                        placeholder="10"
                                    />
                                </div>
                            </div>

                            {/* Public Test Cases */}
                            <div className="border border-shnoor-mist rounded-lg p-4 bg-shnoor-lavender">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-shnoor-navy">Public Test Cases</h3>
                                        <p className="text-sm text-shnoor-navy">Students can see these test cases</p>
                                    </div>
                                    <button
                                        onClick={handleAddPublicTestCase}
                                        className="flex items-center space-x-1 px-3 py-2 bg-shnoor-indigo text-white rounded-lg hover:bg-shnoor-indigo transition-colors text-sm font-medium"
                                    >
                                        <Plus size={16} />
                                        <span>Add</span>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {currentCodingQuestion.publicTestCases.map((testCase, index) => (
                                        <div key={index} className="bg-white p-4 rounded-lg border border-shnoor-mist space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold text-shnoor-navy">Test Case {index + 1}</span>
                                                {currentCodingQuestion.publicTestCases.length > 1 && (
                                                    <button
                                                        onClick={() => handleRemovePublicTestCase(index)}
                                                        className="text-shnoor-danger hover:text-shnoor-danger p-1"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-shnoor-navy mb-1">Input</label>
                                                    <textarea
                                                        value={testCase.input}
                                                        onChange={(e) => {
                                                            const newTestCases = [...currentCodingQuestion.publicTestCases];
                                                            newTestCases[index].input = e.target.value;
                                                            setCurrentCodingQuestion({ ...currentCodingQuestion, publicTestCases: newTestCases });
                                                        }}
                                                        rows={3}
                                                        className="w-full px-3 py-2 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-indigo focus:border-transparent font-mono text-sm resize-y"
                                                        placeholder="Input data"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-shnoor-navy mb-1">Expected Output</label>
                                                    <textarea
                                                        value={testCase.output}
                                                        onChange={(e) => {
                                                            const newTestCases = [...currentCodingQuestion.publicTestCases];
                                                            newTestCases[index].output = e.target.value;
                                                            setCurrentCodingQuestion({ ...currentCodingQuestion, publicTestCases: newTestCases });
                                                        }}
                                                        rows={3}
                                                        className="w-full px-3 py-2 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-indigo focus:border-transparent font-mono text-sm resize-y"
                                                        placeholder="Expected output"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-shnoor-navy mb-1">Explanation (Optional)</label>
                                                <input
                                                    type="text"
                                                    value={testCase.explanation}
                                                    onChange={(e) => {
                                                        const newTestCases = [...currentCodingQuestion.publicTestCases];
                                                        newTestCases[index].explanation = e.target.value;
                                                        setCurrentCodingQuestion({ ...currentCodingQuestion, publicTestCases: newTestCases });
                                                    }}
                                                    className="w-full px-3 py-2 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-indigo focus:border-transparent text-sm"
                                                    placeholder="Explain why this output is expected"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Hidden Test Cases */}
                            <div className="border border-shnoor-mist rounded-lg p-4 bg-shnoor-lavender">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-shnoor-navy">Hidden Test Cases</h3>
                                        <p className="text-sm text-shnoor-navy">Used for evaluation only</p>
                                    </div>
                                    <button
                                        onClick={handleAddHiddenTestCase}
                                        className="flex items-center space-x-1 px-3 py-2 bg-shnoor-navyLight text-white rounded-lg hover:bg-shnoor-navyLight transition-colors text-sm font-medium"
                                    >
                                        <Plus size={16} />
                                        <span>Add</span>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {currentCodingQuestion.hiddenTestCases.map((testCase, index) => (
                                        <div key={index} className="bg-white p-4 rounded-lg border border-shnoor-mist space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold text-shnoor-navy">Hidden Test Case {index + 1}</span>
                                                {currentCodingQuestion.hiddenTestCases.length > 1 && (
                                                    <button
                                                        onClick={() => handleRemoveHiddenTestCase(index)}
                                                        className="text-shnoor-danger hover:text-shnoor-danger p-1"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-shnoor-navy mb-1">Input</label>
                                                    <textarea
                                                        value={testCase.input}
                                                        onChange={(e) => {
                                                            const newTestCases = [...currentCodingQuestion.hiddenTestCases];
                                                            newTestCases[index].input = e.target.value;
                                                            setCurrentCodingQuestion({ ...currentCodingQuestion, hiddenTestCases: newTestCases });
                                                        }}
                                                        rows={3}
                                                        className="w-full px-3 py-2 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-indigo focus:border-transparent font-mono text-sm resize-y"
                                                        placeholder="Input data"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-shnoor-navy mb-1">Expected Output</label>
                                                    <textarea
                                                        value={testCase.output}
                                                        onChange={(e) => {
                                                            const newTestCases = [...currentCodingQuestion.hiddenTestCases];
                                                            newTestCases[index].output = e.target.value;
                                                            setCurrentCodingQuestion({ ...currentCodingQuestion, hiddenTestCases: newTestCases });
                                                        }}
                                                        rows={3}
                                                        className="w-full px-3 py-2 border border-shnoor-mist rounded-lg focus:ring-2 focus:ring-shnoor-indigo focus:border-transparent font-mono text-sm resize-y"
                                                        placeholder="Expected output"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-3 pt-4 border-t border-shnoor-mist">
                                <button
                                    onClick={handleSaveCodingQuestion}
                                    className="flex-1 py-3 bg-shnoor-indigo hover:bg-shnoor-indigo text-white font-bold rounded-lg transition-colors flex items-center justify-center space-x-2"
                                >
                                    <Save size={20} />
                                    <span>{editingCodingQuestionId ? 'Update Question' : 'Save Question'}</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCodingModal(false);
                                        setEditingCodingQuestionId(null);
                                    }}
                                    className="px-6 py-3 bg-shnoor-lavender hover:bg-shnoor-lavender text-shnoor-navy font-semibold rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Coding Question View Modal */}
            {showCodingViewModal && viewingCodingQuestion && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-shnoor-mist p-6 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-shnoor-lavender rounded-lg flex items-center justify-center">
                                    <Code className="w-6 h-6 text-shnoor-navy" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-shnoor-navy">{viewingCodingQuestion.title}</h2>
                                    <p className="text-shnoor-navy text-sm">Coding Question Preview</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowCodingViewModal(false);
                                    setViewingCodingQuestion(null);
                                }}
                                className="p-2 hover:bg-shnoor-lavender rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6 text-shnoor-navy" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6">
                            {/* Description */}
                            <div>
                                <h3 className="font-bold text-shnoor-navy mb-2">Problem Description</h3>
                                <div className="bg-shnoor-lavender p-4 rounded-lg border border-shnoor-mist">
                                    <pre className="whitespace-pre-wrap font-mono text-sm text-shnoor-navy">{viewingCodingQuestion.description}</pre>
                                </div>
                            </div>

                            {/* Constraints */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-shnoor-lavender p-4 rounded-lg border border-shnoor-mist">
                                    <p className="text-sm font-medium text-shnoor-navy mb-1">Time Limit</p>
                                    <p className="text-lg font-bold text-shnoor-navy">{viewingCodingQuestion.timeLimit}s</p>
                                </div>
                                <div className="bg-shnoor-lavender p-4 rounded-lg border border-shnoor-mist">
                                    <p className="text-sm font-medium text-shnoor-navy mb-1">Memory Limit</p>
                                    <p className="text-lg font-bold text-shnoor-navy">{viewingCodingQuestion.memoryLimit}MB</p>
                                </div>
                            </div>

                            {/* Public Test Cases */}
                            <div>
                                <h3 className="font-bold text-shnoor-navy mb-3">Public Test Cases</h3>
                                <div className="space-y-3">
                                    {viewingCodingQuestion.publicTestCases.map((testCase, index) => (
                                        <div key={index} className="bg-shnoor-lavender p-4 rounded-lg border border-shnoor-mist">
                                            <p className="text-sm font-semibold text-shnoor-navy mb-3">Test Case {index + 1}</p>
                                            <div className="grid grid-cols-2 gap-3 mb-2">
                                                <div>
                                                    <p className="text-xs font-medium text-shnoor-navy mb-1">Input:</p>
                                                    <pre className="bg-white p-2 rounded border border-shnoor-mist font-mono text-sm text-shnoor-navy">{testCase.input}</pre>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-shnoor-navy mb-1">Output:</p>
                                                    <pre className="bg-white p-2 rounded border border-shnoor-mist font-mono text-sm text-shnoor-navy">{testCase.output}</pre>
                                                </div>
                                            </div>
                                            {testCase.explanation && (
                                                <div>
                                                    <p className="text-xs font-medium text-shnoor-navy mb-1">Explanation:</p>
                                                    <p className="text-sm text-shnoor-navy">{testCase.explanation}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Hidden Test Cases */}
                            <div>
                                <h3 className="font-bold text-shnoor-navy mb-3">Hidden Test Cases</h3>
                                <div className="space-y-3">
                                    {viewingCodingQuestion.hiddenTestCases.map((testCase, index) => (
                                        <div key={index} className="bg-shnoor-lavender p-4 rounded-lg border border-shnoor-mist">
                                            <p className="text-sm font-semibold text-shnoor-navy mb-3">Hidden Test Case {index + 1}</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-xs font-medium text-shnoor-navy mb-1">Input:</p>
                                                    <pre className="bg-white p-2 rounded border border-shnoor-mist font-mono text-sm text-shnoor-navy">{testCase.input}</pre>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-shnoor-navy mb-1">Output:</p>
                                                    <pre className="bg-white p-2 rounded border border-shnoor-mist font-mono text-sm text-shnoor-navy">{testCase.output}</pre>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Close Button */}
                            <div className="pt-4 border-t border-shnoor-mist">
                                <button
                                    onClick={() => {
                                        setShowCodingViewModal(false);
                                        setViewingCodingQuestion(null);
                                    }}
                                    className="w-full py-3 bg-shnoor-lavender hover:bg-shnoor-lavender text-shnoor-navy font-semibold rounded-lg transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Coding Questions Preview (show in init step) - REMOVED */}
        </div>
    );
};

export default CreateTestSection;
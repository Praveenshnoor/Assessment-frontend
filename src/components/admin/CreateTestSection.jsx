import { useState, useEffect } from 'react';
import { Upload, FileText, Plus, Save, Trash2, ArrowLeft, CheckCircle, AlertCircle, Loader2, Pencil, Code, X, Eye } from 'lucide-react';
import { apiFetch } from '../../config/api';

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
        memoryLimit: 256
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
                    setStartDateTime(test.start_datetime ? new Date(test.start_datetime).toISOString().slice(0, 16) : '');
                    setEndDateTime(test.end_datetime ? new Date(test.end_datetime).toISOString().slice(0, 16) : '');
                    
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
                        startDateTime: startDateTime || null,
                        endDateTime: endDateTime || null,
                        questions: questionData
                    })
                });

                data = await response.json();

                if (response.ok && data.success) {
                    // CODE EXECUTION & CODING PROBLEMS - TEMPORARILY DISABLED
                    // ALWAYS save coding questions (even if empty, to clear old ones)
                    // console.log('[UPDATE TEST] Saving coding questions:', codingQuestions.length);
                    // console.log('[UPDATE TEST] Coding questions data:', JSON.stringify(codingQuestions, null, 2));
                    
                    // const codingResponse = await apiFetch(`api/coding-questions/test/${uploadedTestId}`, {
                    //     method: 'POST',
                    //     headers: {
                    //         'Authorization': `Bearer ${token}`,
                    //         'Content-Type': 'application/json'
                    //     },
                    //     body: JSON.stringify({
                    //         codingQuestions: codingQuestions
                    //     })
                    // });

                    // const codingData = await codingResponse.json();
                    // if (!codingResponse.ok || !codingData.success) {
                    //     console.error('[UPDATE TEST] Failed to save coding questions:', codingData);
                    //     alert('Test updated but failed to save coding questions: ' + codingData.message);
                    //     setIsUploading(false);
                    //     return;
                    // }
                    // console.log('[UPDATE TEST] Coding questions saved successfully');

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
                        startDateTime: startDateTime || null,
                        endDateTime: endDateTime || null,
                        status: 'draft', // Save as draft initially
                        questions: questionData
                    })
                });

                data = await response.json();

                if (response.ok && data.success) {
                    const testId = data.testId;
                    
                    // CODE EXECUTION & CODING PROBLEMS - TEMPORARILY DISABLED
                    // ALWAYS save coding questions (even if empty, to ensure consistency)
                    // console.log('[CREATE TEST] Saving coding questions for new test:', codingQuestions.length);
                    // console.log('[CREATE TEST] Coding questions data:', JSON.stringify(codingQuestions, null, 2));
                    
                    // const codingResponse = await apiFetch(`api/coding-questions/test/${testId}`, {
                    //     method: 'POST',
                    //     headers: {
                    //         'Authorization': `Bearer ${token}`,
                    //         'Content-Type': 'application/json'
                    //     },
                    //     body: JSON.stringify({
                    //         codingQuestions: codingQuestions
                    //     })
                    // });

                    // const codingData = await codingResponse.json();
                    // if (!codingResponse.ok || !codingData.success) {
                    //     console.error('[CREATE TEST] Failed to save coding questions:', codingData);
                    //     alert('Test created but failed to save coding questions: ' + codingData.message);
                    //     setIsUploading(false);
                    //     return;
                    // }
                    // console.log('[CREATE TEST] Coding questions saved successfully');

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
                formData.append('startDateTime', startDateTime || '');
                formData.append('endDateTime', endDateTime || '');
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
                    // CODE EXECUTION & CODING PROBLEMS - TEMPORARILY DISABLED
                    // Save coding questions after bulk upload in edit mode
                    // console.log('[BULK UPLOAD EDIT] Saving coding questions:', codingQuestions.length);
                    // console.log('[BULK UPLOAD EDIT] Coding questions data:', JSON.stringify(codingQuestions, null, 2));
                    
                    // const codingResponse = await apiFetch(`api/coding-questions/test/${uploadedTestId}`, {
                    //     method: 'POST',
                    //     headers: {
                    //         'Authorization': `Bearer ${token}`,
                    //         'Content-Type': 'application/json'
                    //     },
                    //     body: JSON.stringify({
                    //         codingQuestions: codingQuestions
                    //     })
                    // });

                    // const codingData = await codingResponse.json();
                    // if (!codingResponse.ok || !codingData.success) {
                    //     console.error('[BULK UPLOAD EDIT] Failed to save coding questions:', codingData);
                    //     alert('Questions uploaded but failed to save coding questions: ' + codingData.message);
                    //     setIsUploading(false);
                    //     return;
                    // }
                    // console.log('[BULK UPLOAD EDIT] Coding questions saved successfully');
                    
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
                formData.append('startDateTime', startDateTime || '');
                formData.append('endDateTime', endDateTime || '');
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
                    
                    // CODE EXECUTION & CODING PROBLEMS - TEMPORARILY DISABLED
                    // Save coding questions after bulk upload
                    // console.log('[BULK UPLOAD] Saving coding questions:', codingQuestions.length);
                    // console.log('[BULK UPLOAD] Coding questions data:', JSON.stringify(codingQuestions, null, 2));
                    
                    // const codingResponse = await apiFetch(`api/coding-questions/test/${testId}`, {
                    //     method: 'POST',
                    //     headers: {
                    //         'Authorization': `Bearer ${token}`,
                    //         'Content-Type': 'application/json'
                    //     },
                    //     body: JSON.stringify({
                    //         codingQuestions: codingQuestions
                    //     })
                    // });

                    // const codingData = await codingResponse.json();
                    // if (!codingResponse.ok || !codingData.success) {
                    //     console.error('[BULK UPLOAD] Failed to save coding questions:', codingData);
                    //     alert('Test created but failed to save coding questions: ' + codingData.message);
                    //     setIsUploading(false);
                    //     return;
                    // }
                    // console.log('[BULK UPLOAD] Coding questions saved successfully');
                    
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-3xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">{isEditMode ? (viewMode ? 'View Assessment' : 'Edit Assessment') : 'Create New Assessment'}</h2>
                        {viewMode && (
                            <button
                                onClick={() => setViewMode(false)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                            >
                                <Pencil size={18} />
                                <span>Edit</span>
                            </button>
                        )}
                    </div>

                    <div className="space-y-6">
                        {/* Test Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Test Title *</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={testTitle}
                                    onChange={(e) => setTestTitle(e.target.value)}
                                    disabled={viewMode}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent pr-10 ${
                                        viewMode ? 'bg-gray-100 cursor-not-allowed' :
                                        nameAvailability.available === false 
                                            ? 'border-red-300 bg-red-50' 
                                            : nameAvailability.available === true 
                                            ? 'border-green-300 bg-green-50' 
                                            : 'border-gray-300'
                                    }`}
                                    placeholder="e.g., Java Fundamentals - Batch A"
                                    required
                                />
                                {nameAvailability.checking && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                                    </div>
                                )}
                                {!nameAvailability.checking && nameAvailability.available === true && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                )}
                                {!nameAvailability.checking && nameAvailability.available === false && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                    </div>
                                )}
                            </div>
                            {nameAvailability.message && (
                                <p className={`mt-2 text-sm ${
                                    nameAvailability.available 
                                        ? 'text-green-600' 
                                        : 'text-red-600'
                                }`}>
                                    {nameAvailability.message}
                                </p>
                            )}
                        </div>

                        {/* Job Roles Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium text-gray-700">Job Roles & Descriptions *</label>
                                {!viewMode && (
                                    <button
                                        type="button"
                                        onClick={handleAddJobRole}
                                        className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-100 transition-colors text-sm font-medium"
                                    >
                                        <Plus size={16} />
                                        <span>Add Role</span>
                                    </button>
                                )}
                            </div>
                            
                            {jobRoles.map((role, index) => (
                                <div key={index} className="p-4 border-2 border-gray-200 rounded-lg space-y-3 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-gray-700">
                                            Role {index + 1} {index === 0 && <span className="text-blue-600">(Default)</span>}
                                        </span>
                                        {!viewMode && jobRoles.length > 1 && (
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
                                            value={role.job_role}
                                            onChange={(e) => handleJobRoleChange(index, 'job_role', e.target.value)}
                                            disabled={viewMode}
                                            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent ${viewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
                                            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-y ${viewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                            placeholder="Enter job description, requirements, responsibilities..."
                                            required
                                        />
                                    </div>
                                </div>
                            ))}
                            <p className="text-xs text-gray-500">Students will be able to select a role and view its description before taking the test</p>
                        </div>

                        {/* Duration and Max Attempts */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes) *</label>
                                <input
                                    type="number"
                                    value={duration}
                                    onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                                    min="1"
                                    disabled={viewMode}
                                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent ${viewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Max Attempts *</label>
                                <input
                                    type="number"
                                    value={maxAttempts}
                                    onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 1)}
                                    min="1"
                                    disabled={viewMode}
                                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent ${viewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Passing % *</label>
                                <input
                                    type="number"
                                    value={passingPercentage}
                                    onChange={(e) => setPassingPercentage(parseInt(e.target.value) || 50)}
                                    disabled={viewMode}
                                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent ${viewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    min="0"
                                    max="100"
                                    required
                                />
                            </div>
                        </div>

                        {/* Start and End DateTime */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date & Time (Optional)</label>
                                <input
                                    type="datetime-local"
                                    value={startDateTime}
                                    onChange={(e) => setStartDateTime(e.target.value)}
                                    disabled={viewMode}
                                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent ${viewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">End Date & Time (Optional)</label>
                                <input
                                    type="datetime-local"
                                    value={endDateTime}
                                    onChange={(e) => setEndDateTime(e.target.value)}
                                    disabled={viewMode}
                                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent ${viewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                />
                            </div>
                        </div>

                        {/* Add Coding Question Button */}
                        {!viewMode && !isEditMode && (
                            <div className="pt-4 border-t border-gray-200">
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
                                    className="w-full py-3 bg-white border-2 border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 font-semibold rounded-lg transition-all flex items-center justify-center space-x-2"
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
                                    <div key={q.id} className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                    <Code className="w-5 h-5 text-gray-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">Coding Question {idx + 1}</h4>
                                                    <p className="text-sm text-gray-500">{q.title}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleViewCodingQuestion(q)}
                                                    className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                                                    title="View question"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleEditCodingQuestion(q)}
                                                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                                                    title="Edit question"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveCodingQuestion(q.id)}
                                                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
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
                                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">Current Questions</h3>
                                            <p className="text-sm text-gray-600">{questions.length} question{questions.length !== 1 ? 's' : ''} loaded</p>
                                        </div>
                                    </div>
                                    {!viewMode && (
                                        <p className="text-sm text-gray-600">
                                            Choose how you want to update the questions for this test.
                                        </p>
                                    )}
                                </div>

                                {!viewMode && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            <button
                                                onClick={() => handleStart('manual')}
                                                className="p-6 border-2 border-gray-200 rounded-xl text-left transition-all hover:border-blue-500 hover:shadow-lg group bg-white"
                                            >
                                                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                                                    <FileText className="w-6 h-6 text-blue-600 group-hover:text-white" />
                                                </div>
                                                <h3 className="font-bold text-gray-900 mb-2">Edit Questions Manually</h3>
                                                <p className="text-sm text-gray-600 mb-3">Edit existing questions, add new ones, or remove questions individually.</p>
                                                <div className="flex items-center text-xs text-blue-600 font-medium">
                                                    <span>Edit {questions.length} question{questions.length !== 1 ? 's' : ''}</span>
                                                    <ArrowLeft size={14} className="ml-1 rotate-180" />
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => handleStart('bulk')}
                                                className="p-6 border-2 border-gray-200 rounded-xl text-left transition-all hover:border-red-500 hover:shadow-lg group bg-white"
                                            >
                                                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-red-600 transition-colors">
                                                    <Upload className="w-6 h-6 text-red-600 group-hover:text-white" />
                                                </div>
                                                <h3 className="font-bold text-gray-900 mb-2">Upload New Questions File</h3>
                                                <p className="text-sm text-gray-600 mb-3">Replace all existing questions by uploading a new CSV/Excel file.</p>
                                                <div className="flex items-center text-xs text-red-600 font-medium">
                                                    <AlertCircle size={14} className="mr-1" />
                                                    <span>Will replace {questions.length} question{questions.length !== 1 ? 's' : ''}</span>
                                                </div>
                                            </button>
                                        </div>
                                        
                                        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 flex items-start space-x-3 mb-6">
                                            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                            <div className="text-sm text-yellow-800">
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
                                                className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                className="px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    className={`p-6 border-2 border-gray-200 rounded-xl text-left transition-all hover:border-blue-500 group bg-white ${
                                        !testTitle || jobRoles.length === 0 || !jobRoles[0].job_role || !jobRoles[0].job_description || nameAvailability.available === false || nameAvailability.checking
                                            ? 'opacity-50 cursor-not-allowed' 
                                            : 'hover:shadow-md'
                                    }`}
                                    disabled={!testTitle || jobRoles.length === 0 || !jobRoles[0].job_role || !jobRoles[0].job_description || nameAvailability.available === false || nameAvailability.checking}
                                >
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                                        <Plus className="w-6 h-6 text-blue-600 group-hover:text-white" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-1">Manual Entry</h3>
                                    <p className="text-sm text-gray-600">Add questions one by one with a simple form interface.</p>
                                </button>

                                <button
                                    onClick={() => handleStart('bulk')}
                                    className={`p-6 border-2 border-gray-200 rounded-xl text-left transition-all hover:border-blue-500 group bg-white ${
                                        !testTitle || jobRoles.length === 0 || !jobRoles[0].job_role || !jobRoles[0].job_description || nameAvailability.available === false || nameAvailability.checking
                                            ? 'opacity-50 cursor-not-allowed' 
                                            : 'hover:shadow-md'
                                    }`}
                                    disabled={!testTitle || jobRoles.length === 0 || !jobRoles[0].job_role || !jobRoles[0].job_description || nameAvailability.available === false || nameAvailability.checking}
                                >
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                                        <Upload className="w-6 h-6 text-blue-600 group-hover:text-white" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-1">Bulk Upload</h3>
                                    <p className="text-sm text-gray-600">Upload an Excel or CSV file containing multiple questions.</p>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Step 2: Manual Entry */}
            {step === 'manual' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
                        <div className="flex items-center space-x-4">
                            <button onClick={() => setStep('init')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <ArrowLeft size={20} className="text-gray-500" />
                            </button>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{testTitle}</h2>
                                <p className="text-sm text-gray-500">Adding questions manually</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
                            <span className="text-blue-700 font-bold">{questions.length}</span>
                            <span className="text-blue-600 text-sm">Questions Added</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Form Side */}
                        <div className="lg:col-span-2 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
                                <textarea
                                    value={currentQuestion.text}
                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                                    placeholder="Enter question text here..."
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">Options</label>
                                {currentQuestion.options.map((opt, idx) => (
                                    <div key={idx} className="flex items-center space-x-3">
                                        <span className="w-6 text-sm text-gray-400 font-medium">{String.fromCharCode(65 + idx)}</span>
                                        <input
                                            type="text"
                                            value={opt}
                                            onChange={(e) => {
                                                const newOptions = [...currentQuestion.options];
                                                newOptions[idx] = e.target.value;
                                                setCurrentQuestion({ ...currentQuestion, options: newOptions });
                                            }}
                                            className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent ${currentQuestion.correctOption === idx ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}
                                            placeholder={`Option ${idx + 1}`}
                                        />
                                        <button
                                            onClick={() => setCurrentQuestion({ ...currentQuestion, correctOption: idx })}
                                            className={`p-2 rounded-full transition-colors ${currentQuestion.correctOption === idx ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                            title="Mark as correct answer"
                                        >
                                            <CheckCircle size={20} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleAddQuestion}
                                className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
                            >
                                <Plus size={20} />
                                <span>Add Question to Test</span>
                            </button>

                            <div className="pt-6 border-t border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={handleManualSubmit}
                                        disabled={questions.length === 0 || isUploading}
                                        className={`flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm flex items-center justify-center space-x-2 ${questions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                                            className="px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Preview Side */}
                        <div className="bg-gray-50 rounded-xl p-4 h-fit max-h-[600px] overflow-y-auto border border-gray-200">
                            <h3 className="font-bold text-gray-900 mb-4 sticky top-0 bg-gray-50 pb-2">Added Questions</h3>
                            {questions.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <FileText className="mx-auto h-10 w-10 mb-2 opacity-50" />
                                    <p>No questions added yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {questions.map((q, idx) => (
                                        <div key={q.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm group">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Q{idx + 1}</span>
                                                <button
                                                    onClick={() => handleRemoveQuestion(q.id)}
                                                    className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <p className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">{q.text}</p>
                                            <div className="space-y-1">
                                                {q.options.map((opt, i) => (
                                                    <div key={i} className={`text-xs px-2 py-1 rounded ${q.correctOption === i ? 'bg-green-100 text-green-700 font-medium' : 'text-gray-600'}`}>
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl mx-auto">
                    <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-gray-100">
                        <button onClick={() => setStep('init')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <ArrowLeft size={20} className="text-gray-500" />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{testTitle}</h2>
                            <p className="text-sm text-gray-500">Bulk Upload via Excel/CSV</p>
                        </div>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors relative">
                        {isUploading && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        )}

                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Upload className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600 mb-2">Drag and drop your Excel/CSV file here</p>
                        <p className="text-sm text-gray-400 mb-6">Supported formats: .csv, .xlsx, .xls</p>

                        <label className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg cursor-pointer transition-colors shadow-sm">
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

                    <div className="mt-8 bg-blue-50 p-4 rounded-lg flex items-start space-x-3">
                        <div className="flex-shrink-0">
                            <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="text-sm text-blue-800">
                            <p className="font-bold mb-1">CSV Template Format:</p>
                            <p>Question, Option1, Option2, Option3, Option4, CorrectOption(1-4), Marks, Tags</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Success Screen */}
            {step === 'success' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-2xl mx-auto">
                    <div className="text-center">
                        {/* Success Icon */}
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>

                        {/* Success Message */}
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">Test Saved as Draft!</h2>
                        <p className="text-lg text-gray-600 mb-2">"{uploadedTestName}"</p>
                        <p className="text-sm text-gray-500 mb-8">Your test has been saved as a draft. You can publish it now or later from the dashboard.</p>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={handlePublish}
                                disabled={isPublishing}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
                            >
                                <ArrowLeft size={20} />
                                <span>Save as Draft & Return to Dashboard</span>
                            </button>
                        </div>

                        {/* Info Box */}
                        <div className="mt-8 bg-blue-50 p-4 rounded-lg text-left">
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="text-sm text-blue-800">
                                    <p className="font-bold mb-1">What's the difference?</p>
                                    <ul className="text-blue-700 space-y-1 list-disc list-inside">
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
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <Code className="w-6 h-6 text-gray-700" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {editingCodingQuestionId ? 'Edit Coding Question' : 'Add Coding Question'}
                                    </h2>
                                    <p className="text-gray-500 text-sm">Create a programming challenge for students</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowCodingModal(false);
                                    setEditingCodingQuestionId(null);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6">
                            {/* Question Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Question Title *</label>
                                <input
                                    type="text"
                                    value={currentCodingQuestion.title}
                                    onChange={(e) => setCurrentCodingQuestion({ ...currentCodingQuestion, title: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="e.g., Two Sum Problem, Reverse a String"
                                />
                            </div>

                            {/* Question Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Problem Description *</label>
                                <textarea
                                    value={currentCodingQuestion.description}
                                    onChange={(e) => setCurrentCodingQuestion({ ...currentCodingQuestion, description: e.target.value })}
                                    rows={6}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y font-mono text-sm"
                                    placeholder="Describe the problem, constraints, input/output format, etc."
                                />
                            </div>

                            {/* Time and Memory Limits */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (seconds)</label>
                                    <input
                                        type="number"
                                        value={currentCodingQuestion.timeLimit}
                                        onChange={(e) => setCurrentCodingQuestion({ ...currentCodingQuestion, timeLimit: parseFloat(e.target.value) || 2 })}
                                        min="0.1"
                                        step="0.1"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Memory Limit (MB)</label>
                                    <input
                                        type="number"
                                        value={currentCodingQuestion.memoryLimit}
                                        onChange={(e) => setCurrentCodingQuestion({ ...currentCodingQuestion, memoryLimit: parseInt(e.target.value) || 256 })}
                                        min="1"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Public Test Cases */}
                            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-gray-900">Public Test Cases</h3>
                                        <p className="text-sm text-gray-600">Students can see these test cases</p>
                                    </div>
                                    <button
                                        onClick={handleAddPublicTestCase}
                                        className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                    >
                                        <Plus size={16} />
                                        <span>Add</span>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {currentCodingQuestion.publicTestCases.map((testCase, index) => (
                                        <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold text-gray-700">Test Case {index + 1}</span>
                                                {currentCodingQuestion.publicTestCases.length > 1 && (
                                                    <button
                                                        onClick={() => handleRemovePublicTestCase(index)}
                                                        className="text-red-600 hover:text-red-700 p-1"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Input</label>
                                                    <textarea
                                                        value={testCase.input}
                                                        onChange={(e) => {
                                                            const newTestCases = [...currentCodingQuestion.publicTestCases];
                                                            newTestCases[index].input = e.target.value;
                                                            setCurrentCodingQuestion({ ...currentCodingQuestion, publicTestCases: newTestCases });
                                                        }}
                                                        rows={3}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-y"
                                                        placeholder="Input data"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Expected Output</label>
                                                    <textarea
                                                        value={testCase.output}
                                                        onChange={(e) => {
                                                            const newTestCases = [...currentCodingQuestion.publicTestCases];
                                                            newTestCases[index].output = e.target.value;
                                                            setCurrentCodingQuestion({ ...currentCodingQuestion, publicTestCases: newTestCases });
                                                        }}
                                                        rows={3}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-y"
                                                        placeholder="Expected output"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Explanation (Optional)</label>
                                                <input
                                                    type="text"
                                                    value={testCase.explanation}
                                                    onChange={(e) => {
                                                        const newTestCases = [...currentCodingQuestion.publicTestCases];
                                                        newTestCases[index].explanation = e.target.value;
                                                        setCurrentCodingQuestion({ ...currentCodingQuestion, publicTestCases: newTestCases });
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                    placeholder="Explain why this output is expected"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Hidden Test Cases */}
                            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-gray-900">Hidden Test Cases</h3>
                                        <p className="text-sm text-gray-600">Used for evaluation only</p>
                                    </div>
                                    <button
                                        onClick={handleAddHiddenTestCase}
                                        className="flex items-center space-x-1 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                                    >
                                        <Plus size={16} />
                                        <span>Add</span>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {currentCodingQuestion.hiddenTestCases.map((testCase, index) => (
                                        <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold text-gray-700">Hidden Test Case {index + 1}</span>
                                                {currentCodingQuestion.hiddenTestCases.length > 1 && (
                                                    <button
                                                        onClick={() => handleRemoveHiddenTestCase(index)}
                                                        className="text-red-600 hover:text-red-700 p-1"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Input</label>
                                                    <textarea
                                                        value={testCase.input}
                                                        onChange={(e) => {
                                                            const newTestCases = [...currentCodingQuestion.hiddenTestCases];
                                                            newTestCases[index].input = e.target.value;
                                                            setCurrentCodingQuestion({ ...currentCodingQuestion, hiddenTestCases: newTestCases });
                                                        }}
                                                        rows={3}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-y"
                                                        placeholder="Input data"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Expected Output</label>
                                                    <textarea
                                                        value={testCase.output}
                                                        onChange={(e) => {
                                                            const newTestCases = [...currentCodingQuestion.hiddenTestCases];
                                                            newTestCases[index].output = e.target.value;
                                                            setCurrentCodingQuestion({ ...currentCodingQuestion, hiddenTestCases: newTestCases });
                                                        }}
                                                        rows={3}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-y"
                                                        placeholder="Expected output"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                                <button
                                    onClick={handleSaveCodingQuestion}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center space-x-2"
                                >
                                    <Save size={20} />
                                    <span>{editingCodingQuestionId ? 'Update Question' : 'Save Question'}</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCodingModal(false);
                                        setEditingCodingQuestionId(null);
                                    }}
                                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
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
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <Code className="w-6 h-6 text-gray-700" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{viewingCodingQuestion.title}</h2>
                                    <p className="text-gray-500 text-sm">Coding Question Preview</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowCodingViewModal(false);
                                    setViewingCodingQuestion(null);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6">
                            {/* Description */}
                            <div>
                                <h3 className="font-bold text-gray-900 mb-2">Problem Description</h3>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700">{viewingCodingQuestion.description}</pre>
                                </div>
                            </div>

                            {/* Constraints */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <p className="text-sm font-medium text-gray-600 mb-1">Time Limit</p>
                                    <p className="text-lg font-bold text-gray-900">{viewingCodingQuestion.timeLimit}s</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <p className="text-sm font-medium text-gray-600 mb-1">Memory Limit</p>
                                    <p className="text-lg font-bold text-gray-900">{viewingCodingQuestion.memoryLimit}MB</p>
                                </div>
                            </div>

                            {/* Public Test Cases */}
                            <div>
                                <h3 className="font-bold text-gray-900 mb-3">Public Test Cases</h3>
                                <div className="space-y-3">
                                    {viewingCodingQuestion.publicTestCases.map((testCase, index) => (
                                        <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <p className="text-sm font-semibold text-gray-700 mb-3">Test Case {index + 1}</p>
                                            <div className="grid grid-cols-2 gap-3 mb-2">
                                                <div>
                                                    <p className="text-xs font-medium text-gray-600 mb-1">Input:</p>
                                                    <pre className="bg-white p-2 rounded border border-gray-200 font-mono text-sm text-gray-700">{testCase.input}</pre>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-gray-600 mb-1">Output:</p>
                                                    <pre className="bg-white p-2 rounded border border-gray-200 font-mono text-sm text-gray-700">{testCase.output}</pre>
                                                </div>
                                            </div>
                                            {testCase.explanation && (
                                                <div>
                                                    <p className="text-xs font-medium text-gray-600 mb-1">Explanation:</p>
                                                    <p className="text-sm text-gray-700">{testCase.explanation}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Hidden Test Cases */}
                            <div>
                                <h3 className="font-bold text-gray-900 mb-3">Hidden Test Cases</h3>
                                <div className="space-y-3">
                                    {viewingCodingQuestion.hiddenTestCases.map((testCase, index) => (
                                        <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <p className="text-sm font-semibold text-gray-700 mb-3">Hidden Test Case {index + 1}</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-xs font-medium text-gray-600 mb-1">Input:</p>
                                                    <pre className="bg-white p-2 rounded border border-gray-200 font-mono text-sm text-gray-700">{testCase.input}</pre>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-gray-600 mb-1">Output:</p>
                                                    <pre className="bg-white p-2 rounded border border-gray-200 font-mono text-sm text-gray-700">{testCase.output}</pre>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Close Button */}
                            <div className="pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setShowCodingViewModal(false);
                                        setViewingCodingQuestion(null);
                                    }}
                                    className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
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
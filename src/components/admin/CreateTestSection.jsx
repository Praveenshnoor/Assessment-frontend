import { useState, useEffect } from 'react';
import { Upload, FileText, Plus, Save, Trash2, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const CreateTestSection = ({ onComplete }) => {
    const [step, setStep] = useState('init'); // init, manual, bulk, success
    const [testTitle, setTestTitle] = useState('');
    const [testDescription, setTestDescription] = useState('');
    const [duration, setDuration] = useState(60);
    const [maxAttempts, setMaxAttempts] = useState(1);
    const [passingPercentage, setPassingPercentage] = useState(50);
    const [startDateTime, setStartDateTime] = useState('');
    const [endDateTime, setEndDateTime] = useState('');
    const [questions, setQuestions] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedTestId, setUploadedTestId] = useState(null);
    const [uploadedTestName, setUploadedTestName] = useState('');
    const [isPublishing, setIsPublishing] = useState(false);
    
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

    // Check name availability when title changes
    useEffect(() => {
        const checkNameAvailability = async () => {
            if (!testTitle.trim()) {
                setNameAvailability({ checking: false, available: null, message: '' });
                return;
            }

            setNameAvailability({ checking: true, available: null, message: '' });

            try {
                const token = localStorage.getItem('adminToken');
                const response = await fetch(`/api/tests/check-name/${encodeURIComponent(testTitle)}`, {
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
    }, [testTitle]);

    const handleStart = (mode) => {
        if (!testTitle.trim()) {
            alert('Please enter a test title first');
            return;
        }
        if (nameAvailability.available === false) {
            alert('This test name is already taken. Please choose a different name.');
            return;
        }
        setStep(mode);
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

    const handleManualSubmit = async () => {
        if (questions.length === 0) {
            alert('Please add at least one question');
            return;
        }

        setIsUploading(true);
        
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch('/api/upload/manual', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    testName: testTitle,
                    testDescription: testDescription,
                    duration: duration,
                    maxAttempts: maxAttempts,
                    passingPercentage: passingPercentage,
                    startDateTime: startDateTime,
                    endDateTime: endDateTime,
                    status: 'draft', // Save as draft initially
                    questions: questions.map(q => ({
                        question: q.text,
                        optiona: q.options[0],
                        optionb: q.options[1],
                        optionc: q.options[2],
                        optiond: q.options[3],
                        correctoption: String.fromCharCode(65 + q.correctOption),
                        marks: 1
                    }))
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setUploadedTestId(data.testId);
                setUploadedTestName(testTitle);
                setStep('success');
            } else {
                alert(data.message || 'Failed to create test');
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('Failed to create test. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleBulkUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('testName', testTitle);
            formData.append('testDescription', testDescription);
            formData.append('duration', duration);
            formData.append('maxAttempts', maxAttempts);
            formData.append('passingPercentage', passingPercentage);
            formData.append('startDateTime', startDateTime);
            formData.append('endDateTime', endDateTime);
            formData.append('status', 'draft'); // Save as draft initially

            const token = localStorage.getItem('adminToken');
            const response = await fetch('/api/upload/questions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setUploadedTestId(data.testId);
                setUploadedTestName(testTitle);
                setStep('success');
            } else {
                alert(data.message || 'Failed to upload test');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload test. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handlePublish = async () => {
        setIsPublishing(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`/api/tests/${uploadedTestId}/status`, {
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
        setTestDescription('');
        setDuration(60);
        setMaxAttempts(1);
        setStartDateTime('');
        setEndDateTime('');
        setQuestions([]);
        setUploadedTestId(null);
        setUploadedTestName('');
    };

    return (
        <div className="space-y-6">
            {/* Step 1: Initialization */}
            {step === 'init' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Create New Assessment</h2>

                    <div className="space-y-6">
                        {/* Test Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Test Title *</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={testTitle}
                                    onChange={(e) => setTestTitle(e.target.value)}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent pr-10 ${
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

                        {/* Test Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                            <textarea
                                value={testDescription}
                                onChange={(e) => setTestDescription(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                                placeholder="Brief description of the test..."
                            />
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
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
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
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Passing % *</label>
                                <input
                                    type="number"
                                    value={passingPercentage}
                                    onChange={(e) => setPassingPercentage(parseInt(e.target.value) || 50)}
                                    min="0"
                                    max="100"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
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
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">End Date & Time (Optional)</label>
                                <input
                                    type="datetime-local"
                                    value={endDateTime}
                                    onChange={(e) => setEndDateTime(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                            <button
                                onClick={() => handleStart('manual')}
                                className={`p-6 border-2 rounded-xl text-left transition-all hover:border-slate-900 group ${
                                    !testTitle || nameAvailability.available === false || nameAvailability.checking
                                        ? 'opacity-50 cursor-not-allowed' 
                                        : 'hover:shadow-md'
                                }`}
                                disabled={!testTitle || nameAvailability.available === false || nameAvailability.checking}
                            >
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                                    <Plus className="w-6 h-6 text-blue-600 group-hover:text-white" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-1">Manual Entry</h3>
                                <p className="text-sm text-gray-500">Add questions one by one with a simple form interface.</p>
                            </button>

                            <button
                                onClick={() => handleStart('bulk')}
                                className={`p-6 border-2 rounded-xl text-left transition-all hover:border-slate-900 group ${
                                    !testTitle || nameAvailability.available === false || nameAvailability.checking
                                        ? 'opacity-50 cursor-not-allowed' 
                                        : 'hover:shadow-md'
                                }`}
                                disabled={!testTitle || nameAvailability.available === false || nameAvailability.checking}
                            >
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
                                    <Upload className="w-6 h-6 text-green-600 group-hover:text-white" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-1">Bulk Upload</h3>
                                <p className="text-sm text-gray-500">Upload an Excel or CSV file containing multiple questions.</p>
                            </button>
                        </div>
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
                                <button
                                    onClick={handleManualSubmit}
                                    disabled={questions.length === 0 || isUploading}
                                    className={`w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors shadow-sm flex items-center justify-center space-x-2 ${questions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isUploading ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    ) : (
                                        <>
                                            <Save size={20} />
                                            <span>Save Assessment ({questions.length} Questions)</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Preview Side */}
                        <div className="bg-gray-50 rounded-xl p-4 h-fit max-h-[600px] overflow-y-auto">
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
                                                    <div key={i} className={`text-xs px-2 py-1 rounded ${q.correctOption === i ? 'bg-green-100 text-green-700 font-medium' : 'text-gray-500'}`}>
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

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-slate-900 transition-colors relative">
                        {isUploading && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                            </div>
                        )}

                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Upload className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600 mb-2">Drag and drop your Excel/CSV file here</p>
                        <p className="text-sm text-gray-400 mb-6">Supported formats: .csv, .xlsx, .xls</p>

                        <label className="inline-flex items-center px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg cursor-pointer transition-colors shadow-sm">
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
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">Test Uploaded Successfully!</h2>
                        <p className="text-lg text-gray-600 mb-2">"{uploadedTestName}"</p>
                        <p className="text-sm text-gray-500 mb-8">Click the button below to publish this test and make it visible to students.</p>

                        {/* Action Button */}
                        <div className="space-y-4">
                            <button
                                onClick={handlePublish}
                                disabled={isPublishing}
                                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        </div>

                        {/* Info Box */}
                        <div className="mt-8 bg-blue-50 p-4 rounded-lg text-left">
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="text-sm text-blue-800">
                                    <p className="font-bold mb-1">What happens next?</p>
                                    <p className="text-blue-700">Once published, students will immediately see this test in their dashboard and can start taking it.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateTestSection;
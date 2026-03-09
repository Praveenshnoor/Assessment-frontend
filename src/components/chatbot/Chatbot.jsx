import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, ChevronLeft, Send, Upload, Image, AlertCircle, Check } from 'lucide-react';
import { CHATBOT_TOPICS, CHATBOT_QA, TOPIC_ICONS } from '../../data/chatbotData';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Icon = ({ d, className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState('topics'); // 'topics', 'questions', 'chat', 'contact'
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [messages, setMessages] = useState([]);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null); // 'success' | 'error' | null

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Clear send status after 3 seconds
  useEffect(() => {
    if (sendStatus) {
      const timer = setTimeout(() => setSendStatus(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [sendStatus]);

  const handleOpen = () => {
    setIsOpen(true);
    setCurrentView('topics');
    setSelectedTopic(null);
    setMessages([]);
    setSendStatus(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    resetState();
  };

  const resetState = () => {
    setCurrentView('topics');
    setSelectedTopic(null);
    setMessages([]);
    setContactForm({ name: '', email: '', message: '' });
    setSelectedImage(null);
    setImagePreview(null);
    setSendStatus(null);
  };

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    setCurrentView('questions');
    setMessages([{
      type: 'bot',
      content: `You selected "${topic.title}". Here are some common questions:`
    }]);
  };

  const handleQuestionClick = (qa) => {
    setMessages(prev => [
      ...prev,
      { type: 'user', content: qa.question },
      { type: 'bot', content: qa.answer }
    ]);
    setCurrentView('chat');
  };

  const handleBackToTopics = () => {
    setCurrentView('topics');
    setSelectedTopic(null);
    setMessages([]);
  };

  const handleBackToQuestions = () => {
    setCurrentView('questions');
  };

  const handleContactAdmin = () => {
    setCurrentView('contact');
    setMessages(prev => [
      ...prev,
      { type: 'bot', content: 'Please fill in the form below to contact our support team. You can also attach a screenshot if needed.' }
    ]);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitContact = async (e) => {
    e.preventDefault();
    
    if (!contactForm.message.trim()) {
      alert('Please enter your message');
      return;
    }

    setIsSending(true);
    setSendStatus(null);

    try {
      const formData = new FormData();
      formData.append('name', contactForm.name.trim() || 'Anonymous');
      formData.append('email', contactForm.email.trim() || '');
      formData.append('message', contactForm.message.trim());
      formData.append('topic', selectedTopic?.title || 'General');
      
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await fetch(`${API_URL}/api/student-messages`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setSendStatus('success');
        setMessages(prev => [
          ...prev,
          { type: 'user', content: `📧 Message sent: ${contactForm.message.substring(0, 50)}${contactForm.message.length > 50 ? '...' : ''}` },
          { type: 'bot', content: '✅ Your message has been sent to the admin team! They will review it and respond if needed. Thank you for reaching out.' }
        ]);
        setContactForm({ name: '', email: '', message: '' });
        removeImage();
        setCurrentView('chat');
      } else {
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setSendStatus('error');
      setMessages(prev => [
        ...prev,
        { type: 'bot', content: '❌ Failed to send your message. Please try again or contact us through an alternative channel.' }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // Render topic selection
  const renderTopics = () => (
    <div className="p-4 space-y-3">
      <p className="text-sm text-shnoor-soft mb-4">
        Hi there! 👋 How can I help you today? Select a topic below:
      </p>
      {CHATBOT_TOPICS.map((topic) => (
        <button
          key={topic.id}
          onClick={() => handleTopicSelect(topic)}
          className="w-full flex items-center gap-3 p-3 rounded-xl border border-shnoor-mist bg-white hover:bg-shnoor-lavender hover:border-shnoor-indigo/30 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-shnoor-lavender flex items-center justify-center group-hover:bg-shnoor-indigo/20">
            <Icon d={TOPIC_ICONS[topic.icon]} className="w-5 h-5 text-shnoor-indigo" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm text-shnoor-navy">{topic.title}</p>
            <p className="text-xs text-shnoor-soft">{topic.description}</p>
          </div>
        </button>
      ))}
    </div>
  );

  // Render questions for selected topic
  const renderQuestions = () => {
    const questions = CHATBOT_QA[selectedTopic.id] || [];
    
    return (
      <div className="p-4 space-y-2">
        {questions.map((qa, index) => (
          <button
            key={index}
            onClick={() => handleQuestionClick(qa)}
            className="w-full text-left p-3 rounded-lg border border-shnoor-mist bg-white hover:bg-shnoor-lavender hover:border-shnoor-indigo/30 transition-all text-sm text-shnoor-navy"
          >
            {qa.question}
          </button>
        ))}
        
        {/* Contact Admin option */}
        <button
          onClick={handleContactAdmin}
          className="w-full flex items-center justify-center gap-2 p-3 mt-4 rounded-lg bg-shnoor-indigo text-white hover:bg-shnoor-navy transition-all text-sm font-semibold"
        >
          <MessageCircle size={16} />
          Still have a doubt? Contact Admin
        </button>
      </div>
    );
  };

  // Render chat messages
  const renderChat = () => (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[85%] p-3 rounded-xl text-sm whitespace-pre-wrap ${
              msg.type === 'user'
                ? 'bg-shnoor-indigo text-white rounded-tr-none'
                : 'bg-shnoor-lavender text-shnoor-navy rounded-tl-none'
            }`}
          >
            {msg.content}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
      
      {/* Show more questions button */}
      {currentView === 'chat' && selectedTopic && (
        <div className="pt-4 space-y-2">
          <button
            onClick={handleBackToQuestions}
            className="w-full text-center p-2 rounded-lg border border-shnoor-mist bg-white hover:bg-shnoor-lavender text-sm text-shnoor-indigo font-medium"
          >
            Show more questions
          </button>
          <button
            onClick={handleContactAdmin}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-shnoor-indigo/10 text-shnoor-indigo hover:bg-shnoor-indigo/20 transition-all text-sm font-medium"
          >
            <MessageCircle size={14} />
            Contact Admin
          </button>
        </div>
      )}
    </div>
  );

  // Render contact form
  const renderContactForm = () => (
    <div className="flex-1 overflow-y-auto p-4">
      <form onSubmit={handleSubmitContact} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-shnoor-navy mb-1">Name (optional)</label>
          <input
            type="text"
            value={contactForm.name}
            onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
            placeholder="Your name"
            className="w-full p-2.5 rounded-lg border border-shnoor-mist focus:border-shnoor-indigo focus:ring-1 focus:ring-shnoor-indigo outline-none text-sm"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-shnoor-navy mb-1">Email (optional)</label>
          <input
            type="email"
            value={contactForm.email}
            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
            placeholder="your@email.com"
            className="w-full p-2.5 rounded-lg border border-shnoor-mist focus:border-shnoor-indigo focus:ring-1 focus:ring-shnoor-indigo outline-none text-sm"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-shnoor-navy mb-1">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            value={contactForm.message}
            onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
            placeholder="Describe your issue or question..."
            rows={4}
            required
            className="w-full p-2.5 rounded-lg border border-shnoor-mist focus:border-shnoor-indigo focus:ring-1 focus:ring-shnoor-indigo outline-none text-sm resize-none"
          />
        </div>

        {/* Image upload */}
        <div>
          <label className="block text-xs font-medium text-shnoor-navy mb-1">
            Attach Screenshot (optional)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          
          {imagePreview ? (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-24 h-24 object-cover rounded-lg border border-shnoor-mist"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 p-2.5 rounded-lg border border-dashed border-shnoor-mist hover:border-shnoor-indigo bg-shnoor-lavender/50 text-sm text-shnoor-soft hover:text-shnoor-indigo transition-all"
            >
              <Upload size={16} />
              Click to upload image
            </button>
          )}
          <p className="text-xs text-shnoor-soft mt-1">Max 5MB, JPG/PNG/GIF</p>
        </div>

        {/* Status messages */}
        {sendStatus === 'success' && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 text-green-700 text-sm">
            <Check size={16} />
            Message sent successfully!
          </div>
        )}
        {sendStatus === 'error' && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 text-red-700 text-sm">
            <AlertCircle size={16} />
            Failed to send. Please try again.
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSending || !contactForm.message.trim()}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-shnoor-indigo text-white font-semibold hover:bg-shnoor-navy transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send size={16} />
              Send Message
            </>
          )}
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={handleOpen}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-shnoor-indigo text-white shadow-lg hover:bg-shnoor-navy transition-all hover:scale-110 flex items-center justify-center ${isOpen ? 'hidden' : ''}`}
        aria-label="Open chat"
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-shnoor-indigo text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(currentView !== 'topics') && (
                <button
                  onClick={currentView === 'contact' ? handleBackToQuestions : handleBackToTopics}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <div>
                <h3 className="font-bold text-base">
                  {currentView === 'topics' && 'Help Center'}
                  {currentView === 'questions' && selectedTopic?.title}
                  {currentView === 'chat' && selectedTopic?.title}
                  {currentView === 'contact' && 'Contact Admin'}
                </h3>
                <p className="text-xs text-white/70">
                  {currentView === 'topics' && 'SHNOOR Assessment Portal'}
                  {currentView !== 'topics' && 'Ask us anything'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-gray-50/50">
            {currentView === 'topics' && renderTopics()}
            {currentView === 'questions' && renderQuestions()}
            {currentView === 'chat' && renderChat()}
            {currentView === 'contact' && renderContactForm()}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-shnoor-mist bg-white text-center">
            <p className="text-xs text-shnoor-soft">
              Powered by SHNOOR Assessments
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;

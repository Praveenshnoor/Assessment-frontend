// Chatbot Topics and Predefined Q&A Data

export const CHATBOT_TOPICS = [
  {
    id: 'about',
    title: 'About the Assessment Portal',
    icon: 'info',
    description: 'Learn about how the portal works'
  },
  {
    id: 'registration',
    title: 'Registration & Login Help',
    icon: 'user',
    description: 'Help with account and access'
  },
  {
    id: 'exam-guidelines',
    title: 'Exam Guidelines',
    icon: 'book',
    description: 'Rules and exam conduct'
  },
  {
    id: 'technical',
    title: 'Technical Requirements',
    icon: 'settings',
    description: 'Device and browser requirements'
  },
  {
    id: 'results',
    title: 'Results & Scores',
    icon: 'chart',
    description: 'Results, passing criteria, retakes'
  },
  {
    id: 'contact',
    title: 'Contact / Support',
    icon: 'message',
    description: 'Get help from admin'
  }
];

export const CHATBOT_QA = {
  about: [
    {
      question: 'What is this assessment portal?',
      answer: 'This is SHNOOR\'s secure online assessment portal designed for recruitment drives. Students can take proctored exams, complete assessments, and receive results all in one place.'
    },
    {
      question: 'How does the online exam work?',
      answer: 'After logging in, you\'ll see your assigned tests on the dashboard. Select a test, read the instructions, and start your exam. Your answers are auto-saved, and you must submit before the timer ends.'
    },
    {
      question: 'Is the exam timed?',
      answer: 'Yes, each exam has a specific time limit (usually 30-60 minutes). A countdown timer will be visible during the exam. Your exam will auto-submit when time runs out.'
    },
    {
      question: 'Can I attempt multiple times?',
      answer: 'It depends on the test configuration. Some tests allow multiple attempts while others allow only one. Check the "Attempts Remaining" field on your test card to see if retakes are available.'
    },
    {
      question: 'What happens after I submit my exam?',
      answer: 'After submission, you\'ll receive a confirmation. Your responses are recorded and will be evaluated. Results are typically available within the timeframe specified by your institute.'
    }
  ],
  registration: [
    {
      question: 'How do I register?',
      answer: 'Click the "Register Now" button on the homepage. Fill in your details including full name, email, roll number, and institute. You\'ll receive an OTP on your email for verification.'
    },
    {
      question: 'I forgot my password.',
      answer: 'There is no traditional password - we use Firebase authentication. Click "Sign In", enter your email, and you\'ll receive a login link or OTP to access your account.'
    },
    {
      question: 'OTP not received.',
      answer: 'Please check your spam/junk folder first. OTPs are valid for 10 minutes. If not received, click "Resend OTP" after 60 seconds. Make sure you entered the correct email address.'
    },
    {
      question: 'Unable to login.',
      answer: 'Clear your browser cache and cookies, then try again. Ensure you\'re using the correct email address. If the issue persists, use the "Contact Admin" option to report your problem.'
    },
    {
      question: 'My account is suspended.',
      answer: 'Account suspension can occur due to security violations or administrative reasons. Please contact the admin through the "Contact / Support" option for assistance.'
    }
  ],
  'exam-guidelines': [
    {
      question: 'What are the exam rules?',
      answer: '1. Don\'t switch tabs or minimize the browser\n2. Keep your webcam on throughout the exam\n3. No external help or materials unless specified\n4. Complete the exam in one sitting\n5. Submit before the time limit'
    },
    {
      question: 'Is live proctoring enabled?',
      answer: 'Yes, most exams have AI-based proctoring. Your webcam captures frames periodically to detect any violations. Multiple faces, no face detected, or suspicious behavior will be flagged.'
    },
    {
      question: 'What happens if internet disconnects?',
      answer: 'Your answers are auto-saved every few seconds. If disconnected, log back in and resume your exam. Your progress and remaining time will be preserved.'
    },
    {
      question: 'Can I switch tabs?',
      answer: 'No. Tab switching is monitored and counted as a violation. After a certain number of violations, you may be warned or your exam may be flagged for review.'
    },
    {
      question: 'Can I use calculator or notes?',
      answer: 'External tools are generally not allowed unless specified in the test instructions. Using any unauthorized materials will be considered a violation.'
    },
    {
      question: 'What if I face technical issues during exam?',
      answer: 'Don\'t panic! Your progress is auto-saved. Try refreshing the page. If the issue persists, note the error, take a screenshot, and contact admin immediately through the support option.'
    }
  ],
  technical: [
    {
      question: 'What browser should I use?',
      answer: 'We recommend using the latest version of Google Chrome or Microsoft Edge for best compatibility. Firefox also works but may have minor issues with some features.'
    },
    {
      question: 'Is webcam required?',
      answer: 'Yes, a working webcam is mandatory for proctored exams. The portal will run a webcam check before allowing you to start the exam. Ensure proper lighting.'
    },
    {
      question: 'What devices are supported?',
      answer: 'The portal works best on laptops or desktop computers. Tablets may work but are not recommended. Mobile phones are not supported for taking exams.'
    },
    {
      question: 'Minimum internet speed required?',
      answer: 'A stable connection of at least 2 Mbps is recommended. Avoid using mobile hotspots if possible. Wired connections are preferred over WiFi for stability.'
    },
    {
      question: 'My camera is not working.',
      answer: 'Check if camera permissions are granted in your browser. Go to Settings > Privacy > Camera and ensure the browser has access. Try restarting your browser.'
    },
    {
      question: 'The page is not loading properly.',
      answer: 'Clear your browser cache (Ctrl+Shift+Del), disable any ad blockers or VPNs, and try again. If using incognito mode, ensure cookies are enabled.'
    }
  ],
  results: [
    {
      question: 'When will results be published?',
      answer: 'Results are typically available immediately after exam submission, showing your score. Final results and passing status are published according to your institute\'s timeline.'
    },
    {
      question: 'What is the passing criteria?',
      answer: 'The passing percentage varies by test, typically between 40-60%. You can see the required passing percentage on the test details before starting.'
    },
    {
      question: 'Can I retake the exam?',
      answer: 'Retakes depend on the test configuration and your institute\'s policy. Check the "Attempts Remaining" on your test card. If attempts are exhausted, contact your institute.'
    },
    {
      question: 'How is my score calculated?',
      answer: 'Each question carries marks (typically 1 mark each). Your final score = (Correct Answers × Marks per Question). There\'s usually no negative marking unless specified.'
    },
    {
      question: 'Can I see my answer sheet?',
      answer: 'This depends on your institute\'s policy. Some exams show correct answers after submission, while others don\'t reveal answers for confidentiality.'
    },
    {
      question: 'My result shows incorrect score.',
      answer: 'If you believe there\'s an error in your score, please contact the admin through the "Contact / Support" option with your exam details and specific concerns.'
    }
  ],
  contact: [
    {
      question: 'How can I contact support?',
      answer: 'You can send a message directly to the admin using the form below. Click "Still have a doubt? Contact Admin" to write your query and upload any screenshots if needed.'
    },
    {
      question: 'What are the support hours?',
      answer: 'Admin support is typically available during business hours (9 AM - 6 PM IST). For urgent exam-related issues during test windows, immediate assistance may be available.'
    },
    {
      question: 'How long for a response?',
      answer: 'Most queries are addressed within 24-48 hours. Urgent issues related to ongoing exams are prioritized.'
    },
    {
      question: 'I want to report a bug.',
      answer: 'Please use the "Contact Admin" option below. Describe the issue in detail, include which page/feature is affected, and attach a screenshot if possible.'
    }
  ]
};

export const TOPIC_ICONS = {
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  book: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  message: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
};

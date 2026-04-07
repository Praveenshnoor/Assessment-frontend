import { apiFetch } from '../config/api';

class CodeExecutionAPI {
  /**
   * Execute code without input
   * @param {string} code - The code to execute
   * @param {string} language - Programming language (python, javascript, java, cpp)
   * @returns {Promise<Object>} Execution result
   */
  async executeCode(code, language) {
    try {
      const response = await apiFetch('api/code/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('studentAuthToken')}`
        },
        body: JSON.stringify({
          code,
          language
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Code execution failed');
      }

      const data = await response.json();
      return data.data; // Return the execution result
    } catch (error) {
      console.error('Code execution error:', error);
      return {
        success: false,
        output: '',
        error: error.message,
        executionTime: 0
      };
    }
  }

  /**
   * Execute code with input
   * @param {string} code - The code to execute
   * @param {string} language - Programming language
   * @param {string} input - Input for the code
   * @returns {Promise<Object>} Execution result
   */
  async executeCodeWithInput(code, language, input) {
    try {
      const response = await apiFetch('api/code/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('studentAuthToken')}`
        },
        body: JSON.stringify({
          code,
          language,
          input
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Code execution failed');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Code execution with input error:', error);
      return {
        success: false,
        output: '',
        error: error.message,
        executionTime: 0
      };
    }
  }

  /**
   * Execute code against test cases
   * @param {string} code - The code to execute
   * @param {string} language - Programming language
   * @param {Array} testCases - Array of test cases with input and expected output
   * @returns {Promise<Object>} Evaluation result
   */
  async evaluateWithTestCases(code, language, testCases) {
    try {
      const response = await apiFetch('api/code/run-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('studentAuthToken')}`
        },
        body: JSON.stringify({
          code,
          language,
          testCases
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Code evaluation failed');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Code evaluation error:', error);
      return {
        success: false,
        testResults: [],
        summary: {
          totalTestCases: testCases.length,
          passedTestCases: 0,
          failedTestCases: testCases.length,
          percentage: 0
        },
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * Submit coding solution - runs against all test cases and saves to DB
   * @param {string} studentId - Student ID
   * @param {number} codingQuestionId - Coding question ID
   * @param {number} testId - Test ID
   * @param {string} code - The code to submit
   * @param {string} language - Programming language
   * @returns {Promise<Object>} Submission result with evaluation
   */
  async submitCodingSolution(studentId, codingQuestionId, testId, code, language) {
    try {
      const response = await apiFetch('api/coding-questions/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('studentAuthToken')}`
        },
        body: JSON.stringify({
          studentId,
          codingQuestionId,
          testId,
          code,
          language
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Code submission failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Code submission error:', error);
      return {
        success: false,
        message: error.message,
        result: null
      };
    }
  }

  /**
   * Check if code execution service is healthy
   * @returns {Promise<Object>} Health check result
   */
  async healthCheck() {
    try {
      const response = await apiFetch('api/code/health');
      
      if (!response.ok) {
        throw new Error('Health check failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

const codeExecutionAPI = new CodeExecutionAPI();
export default codeExecutionAPI;
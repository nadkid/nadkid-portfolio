import React, { useState } from 'react';
import { wordpressAPI } from '../utils/api.js';

const CommentForm = ({ postId, onCommentSubmitted, parentId = null, onCancel = null, isMobile = false }) => {
  const [formData, setFormData] = useState({
    authorName: '',
    authorEmail: '',
    authorUrl: '',
    content: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', or null
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.authorName.trim()) {
      setErrorMessage('Please enter your name.');
      setSubmitStatus('error');
      return;
    }
    
    if (!formData.authorEmail.trim()) {
      setErrorMessage('Please enter your email address.');
      setSubmitStatus('error');
      return;
    }
    
    if (!formData.content.trim()) {
      setErrorMessage('Please enter your comment.');
      setSubmitStatus('error');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.authorEmail)) {
      setErrorMessage('Please enter a valid email address.');
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage('');

    try {
      const commentData = {
        postId: parseInt(postId),
        authorName: formData.authorName.trim(),
        authorEmail: formData.authorEmail.trim(),
        authorUrl: formData.authorUrl.trim(),
        content: formData.content.trim(),
        parentId: parentId ? parseInt(parentId) : 0,
      };

      await wordpressAPI.submitComment(commentData);
      
      setSubmitStatus('success');
      setFormData({
        authorName: '',
        authorEmail: '',
        authorUrl: '',
        content: '',
      });

      // Notify parent component that a comment was submitted
      if (onCommentSubmitted) {
        onCommentSubmitted();
      }

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSubmitStatus(null);
      }, 3000);

    } catch (error) {
      console.error('Error submitting comment:', error);
      setSubmitStatus('error');
      setErrorMessage('Failed to submit comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${isMobile ? 'p-3' : 'p-4'} mb-6`}>
      <h4 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 mb-4`}>
        {parentId ? 'Leave a Reply' : 'Leave a Comment'}
      </h4>

      {/* Status Messages */}
      {submitStatus === 'success' && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="text-green-800 text-sm">
            {parentId 
              ? 'Your reply has been submitted and is awaiting moderation.' 
              : 'Your comment has been submitted and is awaiting moderation.'
            }
          </div>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-800 text-sm">{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          {/* Name Field */}
          <div>
            <label htmlFor="authorName" className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              id="authorName"
              name="authorName"
              value={formData.authorName}
              onChange={handleInputChange}
              required
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isMobile ? 'text-sm' : 'text-base'
              }`}
              placeholder="Your name"
            />
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="authorEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              id="authorEmail"
              name="authorEmail"
              value={formData.authorEmail}
              onChange={handleInputChange}
              required
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isMobile ? 'text-sm' : 'text-base'
              }`}
              placeholder="your@email.com"
            />
          </div>
        </div>

        {/* Website Field */}
        <div>
          <label htmlFor="authorUrl" className="block text-sm font-medium text-gray-700 mb-1">
            Website
          </label>
          <input
            type="url"
            id="authorUrl"
            name="authorUrl"
            value={formData.authorUrl}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isMobile ? 'text-sm' : 'text-base'
            }`}
            placeholder="https://yourwebsite.com (optional)"
          />
        </div>

        {/* Comment Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            {parentId ? 'Reply' : 'Comment'} *
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            required
            rows={isMobile ? 4 : 5}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical ${
              isMobile ? 'text-sm' : 'text-base'
            }`}
            placeholder={parentId 
              ? 'Write your reply here...' 
              : 'Share your thoughts on this post...'
            }
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${
              isMobile ? 'text-sm' : 'text-base'
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                {parentId ? 'Submitting Reply...' : 'Submitting Comment...'}
              </>
            ) : (
              parentId ? 'Submit Reply' : 'Submit Comment'
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className={`px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium transition-colors ${
                isMobile ? 'text-sm' : 'text-base'
              }`}
            >
              Cancel
            </button>
          )}
        </div>

        {/* Note about moderation */}
        <div className="text-xs text-gray-500 mt-2">
          * Required fields. Comments are moderated and may take time to appear.
        </div>
      </form>
    </div>
  );
};

export default CommentForm;

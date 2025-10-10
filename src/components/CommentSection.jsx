import React, { useState } from 'react';
import { useWordPressComments } from '../hooks/useWordPressComments.js';
import CommentForm from './CommentForm.jsx';

const CommentSection = ({ postId, theme = 'persimmon', isMobile = false }) => {
  const { comments, loading, error, refetch } = useWordPressComments(postId);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  if (loading) {
    return (
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Comments</h3>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading comments...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Comments</h3>
        <div className="text-red-500 text-center py-4">
          Unable to load comments. Please try again later.
        </div>
      </div>
    );
  }

  const handleCommentSubmitted = () => {
    // Refresh comments after a new comment is submitted
    if (refetch) {
      refetch();
    }
    setShowCommentForm(false);
    setReplyingTo(null);
  };

  const handleReplyClick = (commentId) => {
    setReplyingTo(commentId);
    setShowCommentForm(false);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  if (!comments || comments.length === 0) {
    return (
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Comments</h3>
        
        {/* Comment Form for empty state */}
        <CommentForm 
          postId={postId} 
          onCommentSubmitted={handleCommentSubmitted}
          isMobile={isMobile}
        />
        
        {!showCommentForm && (
          <div className="text-gray-500 text-center py-4">
            No comments yet. Be the first to share your thoughts!
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          Comments ({comments.length})
        </h3>
        <button
          onClick={() => setShowCommentForm(!showCommentForm)}
          className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors ${
            isMobile ? 'text-sm' : 'text-base'
          }`}
        >
          {showCommentForm ? 'Hide Form' : 'Leave Comment'}
        </button>
      </div>

      {/* Comment Form */}
      {showCommentForm && (
        <CommentForm 
          postId={postId} 
          onCommentSubmitted={handleCommentSubmitted}
          isMobile={isMobile}
        />
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <CommentItem 
            key={comment.id} 
            comment={comment} 
            theme={theme} 
            isMobile={isMobile}
            onReplyClick={handleReplyClick}
            replyingTo={replyingTo}
            onCancelReply={handleCancelReply}
            postId={postId}
            onCommentSubmitted={handleCommentSubmitted}
          />
        ))}
      </div>
    </div>
  );
};

const CommentItem = ({ 
  comment, 
  theme, 
  isMobile, 
  onReplyClick, 
  replyingTo, 
  onCancelReply, 
  postId, 
  onCommentSubmitted 
}) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stripHtmlTags = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  };

  return (
    <div className="comment-item">
      {/* Main Comment */}
      <div className={`bg-gray-50 rounded-lg p-4 ${isMobile ? 'p-3' : 'p-4'}`}>
        <div className="flex items-start space-x-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {comment.authorAvatar ? (
              <img
                src={comment.authorAvatar}
                alt={comment.author}
                className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} rounded-full`}
              />
            ) : (
              <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-gray-300 flex items-center justify-center`}>
                <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>
                  {comment.author.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Comment Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold text-gray-900`}>
                {comment.author}
              </h4>
              {comment.authorUrl && (
                <a
                  href={comment.authorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-xs"
                >
                  Website
                </a>
              )}
            </div>
            
            <time className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mb-2 block`}>
              {formatDate(comment.date)}
            </time>

            <div 
              className={`prose prose-sm max-w-none text-gray-700 ${
                isMobile ? 'text-sm' : 'text-base'
              }`}
              dangerouslySetInnerHTML={{ __html: comment.content }}
            />

            {/* Reply Button */}
            <div className="mt-3">
              <button
                onClick={() => onReplyClick && onReplyClick(comment.id)}
                className={`text-blue-600 hover:text-blue-800 font-medium transition-colors ${
                  isMobile ? 'text-xs' : 'text-sm'
                }`}
              >
                Reply
              </button>
            </div>
          </div>
        </div>

        {/* Reply Form */}
        {replyingTo === comment.id && (
          <div className="mt-4 ml-12">
            <CommentForm
              postId={postId}
              parentId={comment.id}
              onCommentSubmitted={onCommentSubmitted}
              onCancel={onCancelReply}
              isMobile={isMobile}
            />
          </div>
        )}
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-4 mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-start space-x-3">
                {/* Reply Avatar */}
                <div className="flex-shrink-0">
                  {reply.authorAvatar ? (
                    <img
                      src={reply.authorAvatar}
                      alt={reply.author}
                      className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full`}
                    />
                  ) : (
                    <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-gray-300 flex items-center justify-center`}>
                      <span className={`${isMobile ? 'text-xs' : 'text-xs'} font-medium text-gray-600`}>
                        {reply.author.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Reply Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h5 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-900`}>
                      {reply.author}
                    </h5>
                    {reply.authorUrl && (
                      <a
                        href={reply.authorUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        Website
                      </a>
                    )}
                  </div>
                  
                  <time className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 mb-2 block`}>
                    {formatDate(reply.date)}
                  </time>

                  <div 
                    className={`prose prose-sm max-w-none text-gray-700 ${
                      isMobile ? 'text-xs' : 'text-sm'
                    }`}
                    dangerouslySetInnerHTML={{ __html: reply.content }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;

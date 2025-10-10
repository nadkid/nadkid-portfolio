import { useState, useEffect } from 'react';
import { wordpressAPI, transformWordPressComment } from '../utils/api.js';

export function useWordPressComments(postId) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchComments = async () => {
    if (!postId) {
      setComments([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const rawComments = await wordpressAPI.getComments(postId);
      const transformedComments = rawComments.map(transformWordPressComment);
      
      // Organize comments into a hierarchical structure (parent/child)
      const organizedComments = organizeCommentsHierarchy(transformedComments);
      setComments(organizedComments);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const refetch = () => {
    fetchComments();
  };

  return { comments, loading, error, refetch };
}

// Helper function to organize comments into parent/child hierarchy
function organizeCommentsHierarchy(comments) {
  const commentMap = new Map();
  const rootComments = [];

  // First pass: create a map of all comments
  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  // Second pass: organize into hierarchy
  comments.forEach(comment => {
    if (comment.parent === 0) {
      // This is a root comment
      rootComments.push(commentMap.get(comment.id));
    } else {
      // This is a reply to another comment
      const parent = commentMap.get(comment.parent);
      if (parent) {
        parent.replies.push(commentMap.get(comment.id));
      }
    }
  });

  return rootComments;
}

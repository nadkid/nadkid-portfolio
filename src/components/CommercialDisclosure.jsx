import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWordPressPostsSafe } from '../hooks/useWordPressSafe';

const CommercialDisclosure = ({ isOpen, onClose, theme }) => {
  const { data: commercialPosts, loading, error } = useWordPressPostsSafe('commercial');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          
          {/* Modal Content */}
          <motion.div
            className="relative z-50 w-full max-w-4xl mx-auto h-[80vh] flex flex-col overflow-hidden rounded-3xl bg-white/95 backdrop-blur-md shadow-2xl border border-white/20"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-900">Commercial Disclosure</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-lg text-gray-600">Loading commercial disclosure...</div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="text-lg text-red-600 mb-2">Error loading content</div>
                    <div className="text-sm text-gray-500">{error}</div>
                  </div>
                </div>
              ) : commercialPosts.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="text-lg text-gray-600 mb-2">No commercial disclosure found</div>
                    <div className="text-sm text-gray-500">Please contact support for more information.</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 max-w-3xl mx-auto">
                  {commercialPosts.map((post, index) => (
                    <div key={post.id} className="prose prose-gray max-w-none">
                      <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>
                      {post.featuredImage && (
                        <div className="mb-6">
                          <img
                            src={post.featuredImage}
                            alt={post.title}
                            className="w-full rounded-2xl shadow-lg"
                          />
                        </div>
                      )}
                      <div 
                        className="text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center p-6 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={onClose}
                className="px-8 py-3 bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommercialDisclosure;

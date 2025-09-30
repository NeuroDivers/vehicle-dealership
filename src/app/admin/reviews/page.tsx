'use client';

import { useState, useEffect } from 'react';
import { Star, Plus, Edit2, Trash2, Check, X } from 'lucide-react';

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  review_text: string;
  location?: string;
  date: string;
  is_featured: number;
  is_approved: number;
}

export default function ReviewsManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    rating: 5,
    review_text: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    is_featured: 0,
    is_approved: 1
  });

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://vehicle-dealership-api.nick-damato0011527.workers.dev';
      const response = await fetch(`${apiUrl}/api/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://vehicle-dealership-api.nick-damato0011527.workers.dev';
      const url = editingReview 
        ? `${apiUrl}/api/reviews/${editingReview.id}`
        : `${apiUrl}/api/reviews`;
      
      const response = await fetch(url, {
        method: editingReview ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        loadReviews();
        setShowAddModal(false);
        setEditingReview(null);
        resetForm();
      } else {
        alert('Failed to save review');
      }
    } catch (error) {
      console.error('Error saving review:', error);
      alert('Failed to save review');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://vehicle-dealership-api.nick-damato0011527.workers.dev';
      const response = await fetch(`${apiUrl}/api/reviews/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadReviews();
      } else {
        alert('Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review');
    }
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setFormData({
      customer_name: review.customer_name,
      rating: review.rating,
      review_text: review.review_text,
      location: review.location || '',
      date: review.date,
      is_featured: review.is_featured,
      is_approved: review.is_approved
    });
    setShowAddModal(true);
  };

  const toggleFeatured = async (review: Review) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://vehicle-dealership-api.nick-damato0011527.workers.dev';
      const response = await fetch(`${apiUrl}/api/reviews/${review.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...review,
          is_featured: review.is_featured === 1 ? 0 : 1
        })
      });

      if (response.ok) {
        loadReviews();
      }
    } catch (error) {
      console.error('Error updating review:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      customer_name: '',
      rating: 5,
      review_text: '',
      location: '',
      date: new Date().toISOString().split('T')[0],
      is_featured: 0,
      is_approved: 1
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading reviews...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Reviews</h1>
          <p className="text-gray-600 mt-1">Manage customer testimonials and ratings</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingReview(null);
            setShowAddModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="h-5 w-5" />
          <span>Add Review</span>
        </button>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg">{review.customer_name}</h3>
                {review.location && (
                  <p className="text-sm text-gray-500">{review.location}</p>
                )}
              </div>
              <div className="flex space-x-1">
                {renderStars(review.rating)}
              </div>
            </div>

            <p className="text-gray-700 mb-4 line-clamp-3">{review.review_text}</p>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>{new Date(review.date).toLocaleDateString()}</span>
              {review.is_featured === 1 && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                  Featured
                </span>
              )}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => toggleFeatured(review)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  review.is_featured === 1
                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {review.is_featured === 1 ? 'Unfeature' : 'Feature'}
              </button>
              <button
                onClick={() => handleEdit(review)}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(review.id)}
                className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {reviews.length === 0 && (
        <div className="text-center py-12">
          <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No reviews yet. Add your first review!</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingReview ? 'Edit Review' : 'Add New Review'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Montreal, QC"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rating *
                  </label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={5}>5 Stars - Excellent</option>
                    <option value={4}>4 Stars - Very Good</option>
                    <option value={3}>3 Stars - Good</option>
                    <option value={2}>2 Stars - Fair</option>
                    <option value={1}>1 Star - Poor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Review Text *
                </label>
                <textarea
                  value={formData.review_text}
                  onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Write the customer's review..."
                />
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_featured === 1}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked ? 1 : 0 })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Feature this review on homepage</span>
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingReview(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editingReview ? 'Update Review' : 'Add Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

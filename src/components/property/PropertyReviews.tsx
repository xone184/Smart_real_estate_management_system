import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/ui/Card';
import { Star, ThumbsUp, MessageSquare, User, CheckCircle2, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiGetReviews, apiCreateReview, ApiReview } from '../../services/api';
import { Button } from '../shared/ui/Button';

interface PropertyReviewsProps {
  propertyId: number;
  user?: { id: number; display_name: string; photo_url?: string } | null;
}

export function PropertyReviews({ propertyId, user }: PropertyReviewsProps) {
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [propertyId]);

  const fetchReviews = async () => {
    try {
      const data = await apiGetReviews(propertyId);
      setReviews(data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setSubmitting(true);
    try {
      await apiCreateReview({
        property_id: propertyId,
        rating: newRating,
        comment: newComment,
      });
      setNewComment('');
      setNewRating(5);
      // Refresh reviews
      await fetchReviews();
    } catch (error) {
      console.error('Error creating review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <Card className="border-gray-50 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Đánh giá từ cộng đồng
        </CardTitle>
        <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 rounded-full border border-yellow-100">
          <Star className="w-4 h-4 text-yellow-500 fill-current" />
          <span className="font-bold text-yellow-700">{averageRating} / 5</span>
          <span className="text-xs text-yellow-600">({reviews.length} đánh giá)</span>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Review Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b border-gray-50">
          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl">
            <p className="text-sm text-gray-500 mb-1">Thiết kế</p>
            <div className="flex text-yellow-400 mb-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
            </div>
            <p className="font-bold">4.9</p>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl">
            <p className="text-sm text-gray-500 mb-1">Vị trí</p>
            <div className="flex text-yellow-400 mb-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
            </div>
            <p className="font-bold">4.7</p>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl">
            <p className="text-sm text-gray-500 mb-1">Tiện ích</p>
            <div className="flex text-yellow-400 mb-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
            </div>
            <p className="font-bold">4.8</p>
          </div>
        </div>

        {/* Add Review Form */}
        {user ? (
          <form onSubmit={handleSubmitReview} className="space-y-4 pb-6 border-b border-gray-50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full border bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                {user.photo_url ? <img src={user.photo_url} alt="" className="w-full h-full object-cover" /> : user.display_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-grow">
                <p className="text-sm font-bold text-gray-700">Viết đánh giá của bạn</p>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="focus:outline-none"
                    >
                      <Star className={`w-5 h-5 ${star <= newRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn về bất động sản này..."
                className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 min-h-[100px] text-sm"
              />
              <Button 
                type="submit" 
                disabled={submitting || !newComment.trim()}
                className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </form>
        ) : (
          <div className="p-6 bg-blue-50 rounded-2xl text-center">
            <p className="text-sm text-blue-700 mb-2">Đăng nhập để chia sẻ đánh giá của bạn</p>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : reviews.length > 0 ? (
            reviews.map((review, index) => (
              <motion.div 
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      {review.user_avatar ? (
                        <img src={review.user_avatar} alt={review.user_name} className="w-full h-full object-cover" />
                      ) : (
                        review.user_name?.charAt(0) || 'U'
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-gray-900">{review.user_name}</p>
                        {review.verified && (
                          <CheckCircle2 className="w-3 h-3 text-blue-500" />
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                        {new Date(review.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex text-yellow-400">
                    {[...Array(review.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed italic">"{review.comment}"</p>
                <div className="flex items-center gap-4 pt-1">
                  <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 transition-colors">
                    <ThumbsUp className="w-3 h-3" />
                    Hữu ích ({review.likes})
                  </button>
                  <button className="text-xs text-gray-400 hover:text-blue-600 transition-colors">Phản hồi</button>
                </div>
                {index < reviews.length - 1 && <div className="pt-6 border-b border-gray-50" />}
              </motion.div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-500">
              <p>Chưa có đánh giá nào cho bất động sản này.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

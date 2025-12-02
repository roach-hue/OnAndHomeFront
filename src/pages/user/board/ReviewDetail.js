import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import toast from 'react-hot-toast';
import './ReviewDetail.css';

const ReviewDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.user);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);

  // 알림에서 온 경우
  const fromNotifications = location.state?.from === 'notifications';

  console.log('⭐ ReviewDetail 마운트, id:', id);
  console.log('📍 알림에서 왔는가?', fromNotifications);

  useEffect(() => {
    fetchReviewDetail();
  }, [id]);

  const fetchReviewDetail = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`http://localhost:8080/api/reviews/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (response.data.success) {
        setReview(response.data.data);
      } else {
        throw new Error(response.data.message || '리뷰를 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('리뷰 로드 실패:', error);
      toast.error('리뷰를 불러오는데 실패했습니다.');
      handleBack();
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (fromNotifications) {
      console.log('🚀 알림 목록으로 이동');
      navigate('/notifications');
    } else if (review?.productId) {
      console.log('🚀 상품 상세로 이동');
      navigate(`/products/${review.productId}`);
    } else {
      console.log('🚀 홈으로 이동');
      navigate('/');
    }
  };

  const handleProductClick = () => {
    if (review?.productId) {
      navigate(`/products/${review.productId}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(rating || 0);
  };

  if (loading) {
    return (
      <div className="review-detail-container">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="review-detail-container">
        <div className="error-message">리뷰를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="review-detail-container">
      <div className="review-detail-inner">
        <div className="review-detail-header">
          <h1>리뷰 상세</h1>
        </div>

        <div className="review-detail-card">
          {/* 상품 정보 */}
          {review.productName && (
            <div className="product-info" onClick={handleProductClick} style={{ cursor: 'pointer' }}>
              <span className="product-label">상품:</span>
              <span className="product-name">{review.productName}</span>
            </div>
          )}

          {/* 헤더 */}
          <div className="detail-header">
            <div className="rating-display">
              <span className="stars">{renderStars(review.rating)}</span>
              <span className="rating-number">{review.rating}/5</span>
            </div>
            
            <div className="meta-info">
              <div className="meta-item">
                <span className="meta-label">작성자</span>
                <span className="meta-value">{review.author || review.username || '익명'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">작성일</span>
                <span className="meta-value">{formatDate(review.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* 리뷰 내용 */}
          <div className="detail-content">
            <div className="content-body">
              {review.content.split('\n').map((line, index) => (
                <p key={index}>{line || '\u00A0'}</p>
              ))}
            </div>
          </div>

          {/* 답글 영역 */}
          {review.reply && (
            <div className="reply-section">
              <div className="reply-header">
                <span className="reply-icon">💬</span>
                <span className="reply-title">판매자 답변</span>
              </div>
              <div className="reply-content">
                {review.reply.split('\n').map((line, index) => (
                  <p key={index}>{line || '\u00A0'}</p>
                ))}
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="detail-actions">
            <button className="btn-back" onClick={handleBack}>
              {fromNotifications ? '알림 목록으로' : '돌아가기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewDetail;

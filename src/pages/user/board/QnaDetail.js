import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import toast from 'react-hot-toast';
import './QnaDetail.css';

const QnaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.user);
  const [qna, setQna] = useState(null);
  const [loading, setLoading] = useState(true);

  // 알림에서 온 경우
  const fromNotifications = location.state?.from === 'notifications';

  console.log('❓ QnaDetail 마운트, id:', id);
  console.log('📍 알림에서 왔는가?', fromNotifications);

  useEffect(() => {
    fetchQnaDetail();
  }, [id]);

  const fetchQnaDetail = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`http://localhost:8080/api/qna/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (response.data.success) {
        setQna(response.data.data);
      } else {
        throw new Error(response.data.message || 'Q&A를 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('Q&A 로드 실패:', error);
      toast.error('Q&A를 불러오는데 실패했습니다.');
      handleBack();
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (fromNotifications) {
      console.log('🚀 알림 목록으로 이동');
      navigate('/notifications');
    } else if (qna?.productId) {
      console.log('🚀 상품 상세로 이동');
      navigate(`/products/${qna.productId}`);
    } else {
      console.log('🚀 홈으로 이동');
      navigate('/');
    }
  };

  const handleProductClick = () => {
    if (qna?.productId) {
      navigate(`/products/${qna.productId}`);
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

  if (loading) {
    return (
      <div className="qna-detail-container">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  if (!qna) {
    return (
      <div className="qna-detail-container">
        <div className="error-message">Q&A를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="qna-detail-container">
      <div className="qna-detail-inner">
        <div className="qna-detail-header">
          <h1>Q&A 상세</h1>
        </div>

        <div className="qna-detail-card">
          {/* 상품 정보 */}
          {qna.productName && (
            <div className="product-info" onClick={handleProductClick} style={{ cursor: 'pointer' }}>
              <span className="product-label">상품:</span>
              <span className="product-name">{qna.productName}</span>
            </div>
          )}

          {/* 헤더 */}
          <div className="detail-header">
            <h2 className="detail-title">{qna.title || '상품 문의'}</h2>
            
            <div className="meta-info">
              <div className="meta-item">
                <span className="meta-label">작성자</span>
                <span className="meta-value">{qna.writer || '익명'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">작성일</span>
                <span className="meta-value">{formatDate(qna.createdAt)}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">답변 상태</span>
                <span className={`status-badge ${qna.replies && qna.replies.length > 0 ? 'answered' : 'pending'}`}>
                  {qna.replies && qna.replies.length > 0 ? '답변 완료' : '답변 대기'}
                </span>
              </div>
            </div>
          </div>

          {/* Q&A 질문 내용 */}
          <div className="detail-content">
            <div className="question-label">
              <span className="icon">❓</span>
              <span>질문</span>
            </div>
            <div className="content-body">
              {qna.question.split('\n').map((line, index) => (
                <p key={index}>{line || '\u00A0'}</p>
              ))}
            </div>
          </div>

          {/* 답글 영역 */}
          {qna.replies && qna.replies.length > 0 && (
            <div className="reply-section">
              {qna.replies.map((reply, index) => (
                <div key={reply.id || index} className="reply-item">
                  <div className="reply-header">
                    <span className="reply-icon">💬</span>
                    <span className="reply-title">답변</span>
                    <span className="reply-author">{reply.responder || reply.author || '관리자'}</span>
                    <span className="reply-date">{formatDate(reply.createdAt)}</span>
                  </div>
                  <div className="reply-content">
                    {reply.content.split('\n').map((line, idx) => (
                      <p key={idx}>{line || '\u00A0'}</p>
                    ))}
                  </div>
                </div>
              ))}
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

export default QnaDetail;

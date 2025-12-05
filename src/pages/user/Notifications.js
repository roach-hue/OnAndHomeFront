import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import notificationApi from '../../api/notificationApi';
import { 
  setNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  removeNotification 
} from '../../store/slices/notificationSlice';
import './Notifications.css';

const Notifications = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.user);
  const { notifications } = useSelector((state) => state.notification);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    loadNotifications();
  }, [isAuthenticated]);

  const loadNotifications = async () => {
    try {
      console.log('🔔 알림 로딩 시작...');
      setLoading(true);
      const response = await notificationApi.getNotifications();
      console.log('📦 API 응답:', response);
      
      if (response.success) {
        console.log('✅ 알림 개수:', response.notifications?.length || 0);
        console.log('📋 알림 목록:', response.notifications);
        dispatch(setNotifications(response.notifications));
      } else {
        console.error('❌ API 실패:', response.message);
        toast.error('알림을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('💥 알림 조회 실패:', error);
      console.error('에러 상세:', error.response?.data || error.message);
      toast.error('알림을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      console.log('🏁 알림 로딩 완료');
    }
  };

  const handleNotificationClick = async (notification) => {
    console.log('🔔 알림 클릭:', notification);
    console.log('Type:', notification.type);
    console.log('ReferenceId:', notification.referenceId);
    
    try {
      if (!notification.isRead) {
        await notificationApi.markAsRead(notification.id);
        dispatch(markNotificationAsRead(notification.id));
      }

      // 알림 타입에 따라 페이지 이동
      switch (notification.type) {
        case 'ORDER':
        case 'ORDER_STATUS':      // 배송 상태 변경 알림
        case 'PAYMENT_CONFIRMED': // 입금 확인 알림
          // 해당 주문 상세 페이지로 이동
          if (notification.referenceId) {
            const path = `/order/${notification.referenceId}`;
            console.log('🚀 주문 상세로 이동:', path);
            navigate(path, { state: { from: 'notifications' } });
          } else {
            console.warn('⚠️ referenceId 없음, 주문 목록으로 이동');
            navigate('/mypage/orders');
          }
          break;
        case 'REVIEW':
          // 해당 상품 상세 페이지로 이동
          if (notification.referenceId) {
            const path = `/products/${notification.referenceId}`;
            console.log('🚀 상품 상세로 이동:', path);
            navigate(path, {
              state: { from: 'notifications', type: notification.type },
            });
          }
          break;
        case 'REVIEW_REPLY':
          // 리뷰 답변 - 리뷰 상세 페이지로 이동
          if (notification.referenceId) {
            const path = `/review/${notification.referenceId}`;
            console.log('🚀 리뷰 상세로 이동:', path);
            navigate(path, { state: { from: 'notifications' } });
          }
          break;
        case 'QNA':
          // Q&A - 상품 상세 페이지로 이동
          if (notification.productId) {
            const path = `/products/${notification.productId}`;
            console.log('🚀 상품 상세로 이동:', path);
            navigate(path, {
              state: { from: 'notifications', type: notification.type },
            });
          }
          break;
        case 'QNA_REPLY':
          // Q&A 답변 - 마이페이지 문의 내역으로 이동
          console.log('🚀 마이페이지 문의 내역으로 이동');
          navigate('/mypage/qna', { state: { from: 'notifications' } });
          break;
        case 'NOTICE':
          if (notification.referenceId) {
            const path = `/notices/${notification.referenceId}`;
            console.log('🚀 공지사항으로 이동:', path);
            navigate(path, { state: { from: 'notifications' } });
          } else {
            navigate('/notices');
          }
          break;
        case 'MARKETING':
        case 'ADVERTISEMENT':
          // 광고 상세 페이지로 이동
          if (notification.referenceId) {
            const path = `/advertisements/${notification.referenceId}`;
            console.log('🚀 광고 상세로 이동:', path);
            navigate(path, { state: { from: 'notifications' } });
          }
          break;
        default:
          console.warn('⚠️ 알 수 없는 타입:', notification.type);
          break;
      }
    } catch (error) {
      console.error('❌ 알림 읽음 처리 실패:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      dispatch(markAllNotificationsAsRead());
      toast.success('모든 알림을 읽음 처리했습니다.', { duration: 1300 });
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
      toast.error('알림 처리에 실패했습니다.');
    }
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    try {
      await notificationApi.deleteNotification(notificationId);
      dispatch(removeNotification(notificationId));
      toast.success('알림을 삭제했습니다.', { duration: 1300 });
    } catch (error) {
      console.error('알림 삭제 실패:', error);
      toast.error('알림 삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return date.toLocaleDateString('ko-KR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } else if (days > 0) {
      return `${days}일 전`;
    } else if (hours > 0) {
      return `${hours}시간 전`;
    } else if (minutes > 0) {
      return `${minutes}분 전`;
    } else {
      return '방금 전';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ORDER':
        return '📦'; // 주문 완료
      case 'ORDER_STATUS':
        return '🚚'; // 배송 상태 변경
      case 'PAYMENT_CONFIRMED':
        return '💳'; // 입금 확인
      case 'REVIEW':
      case 'REVIEW_REPLY':
        return '⭐'; // 리뷰
      case 'QNA':
      case 'QNA_REPLY':
        return '❓'; // Q&A
      case 'NOTICE':
        return '📢'; // 공지사항
      case 'MARKETING':
      case 'ADVERTISEMENT':
        return '📢'; // 광고
      case 'SYSTEM':
        return '⚙️'; // 시스템
      default:
        return '📌'; // 기본
    }
  };

  if (loading) {
    return (
      <div className="notifications-page">
        <div className="notifications-container">
          <div className="loading">알림을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="notifications-container">
        <div className="notifications-header">
          <h2>알림</h2>
          {notifications.length > 0 && (
            <button 
              className="mark-all-read-btn"
              onClick={handleMarkAllAsRead}
            >
              모두 읽음
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="empty-notifications">
            <div className="empty-icon">🔔</div>
            <p>새로운 알림이 없습니다.</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${
                  !notification.isRead ? "unread" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-content">
                  <div className="notification-title">
                    {notification.title}
                    {!notification.isRead && (
                      <span className="unread-dot"></span>
                    )}
                  </div>
                  <div className="notification-message">
                    {notification.content}
                  </div>
                  <div className="notification-time">
                    {formatDate(notification.createdAt)}
                  </div>
                </div>
                <button
                  className="delete-btn"
                  onClick={(e) => handleDelete(e, notification.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;

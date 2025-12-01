import axios from "axios";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./OrderDetail.css";

const OrderDetail = () => {
  const { orderId } = useParams(); // URL에서 주문 ID 추출
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useSelector((state) => state.user);

  // 주문 상세 정보
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // 알림(Notification) 화면에서 진입한 경우 구분
  // 주문 완료 알림 클릭 → 상세로 이동 시 사용됨
  const fromNotifications = location.state?.from === "notifications";

  const handleBack = () => {
    // 뒤로가기 경로 분기
    // 알림에서 왔으면 알림 페이지로, 아니면 주문 목록으로 이동
    if (fromNotifications) {
      navigate("/notifications");
    } else {
      navigate("/mypage/orders");
    }
  };

  useEffect(() => {
    // 주문 상세 페이지 진입 초기 처리
    // 1) 로그인 여부 검사
    // 2) orderId 유효성 검증
    // 3) 정상일 경우 → 주문 상세 데이터 조회
    if (!isAuthenticated) {
      toast.error("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    loadOrderDetail();
  }, [orderId, isAuthenticated]);

  // 주문 상세 정보 조회
  // 백엔드: GET /api/orders/{orderId}
  // - 주문 기본정보, 상품 목록, 배송지, 결제 상태 등을 반환
  const loadOrderDetail = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("accessToken");
      const url = `http://localhost:8080/api/orders/${orderId}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // success=true인 경우에만 정상 데이터 세팅
      if (response.data.success) {
        setOrder(response.data.order);
      } else {
        toast.error("주문 정보를 불러올 수 없습니다.");
        navigate("/mypage/orders");
      }
    } catch (error) {
      // 조회 실패 시 자동으로 목록 페이지로 이동
      toast.error("주문 정보를 불러오는데 실패했습니다.");
      navigate("/mypage/orders");
    } finally {
      setLoading(false);
    }
  };

  // 날짜 포맷 변환 (createdAt, paidAt)
  // 백엔드 LocalDateTime → 사용자가 읽기 쉬운 한국 시간 표시
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price) => {
    return price?.toLocaleString() || "0";
  };

  // 주문 상태 변환 (백엔드 ENUM → UI용 텍스트)
  const getStatusText = (status) => {
    const statusMap = {
      ORDERED: "주문완료",
      PAYMENT_PENDING: "입금대기",
      DELIVERING: "배송중",
      DELIVERED: "배송완료",
      CANCELED: "주문취소",
    };
    return statusMap[status] || status;
  };

  // 주문 상태에 따른 스타일 클래스 지정
  const getStatusClass = (status) => {
    const classMap = {
      ORDERED: "status-ordered",
      PAYMENT_PENDING: "status-pending",
      DELIVERING: "status-delivering",
      DELIVERED: "status-delivered",
      CANCELED: "status-canceled",
    };
    return classMap[status] || "";
  };

  if (loading) {
    return (
      <div className="order-detail-container">
        <div className="loading">주문 정보를 불러오는 중...</div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="order-detail-container">
      <div className="order-detail-header">
        <button onClick={handleBack} className="back-button">
          ← {fromNotifications ? "알림 목록으로" : "주문 목록으로"}
        </button>
        <h2>주문 상세</h2>
      </div>

      <div className="order-detail-content">
        {/* 주문 정보 섹션 */}
        <div className="detail-section">
          <h3>주문 정보</h3>

          {/* 주문 고유번호, 생성 시각, 상태, 결제 방식 등 기본 정보 */}
          <div className="info-grid">
            <div className="info-row">
              <span className="info-label">주문번호</span>
              <span className="info-value">{order.orderNumber}</span>
            </div>

            <div className="info-row">
              <span className="info-label">주문일시</span>
              <span className="info-value">{formatDate(order.createdAt)}</span>
            </div>

            <div className="info-row">
              <span className="info-label">주문상태</span>
              <span className={`order-status ${getStatusClass(order.status)}`}>
                {getStatusText(order.status)}
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">결제방법</span>
              <span className="info-value">
                {order.paymentMethod === "CARD" ? "카드결제" : "무통장입금"}
              </span>
            </div>
          </div>
        </div>

        {/* 주문 상품 목록 */}
        <div className="detail-section">
          <h3>주문 상품</h3>

          {/* 주문 상품명, 단가, 수량, 소계 표시 */}
          <div className="order-items">
            {order.orderItems &&
              order.orderItems.map((item, index) => (
                <div key={index} className="order-item-card">
                  <div className="item-image">
                    {item.productImage ? (
                      <img
                        src={`http://localhost:8080${item.productImage}`}
                        alt={item.productName}
                        onError={(e) => {
                          e.target.src = "/images/no-image.png";
                        }}
                      />
                    ) : (
                      <div className="no-image">이미지 없음</div>
                    )}
                  </div>

                  <div className="item-info">
                    <h4
                      className="item-name"
                      onClick={() => navigate(`/products/${item.productId}`)}
                    >
                      {item.productName}
                    </h4>

                    <p className="item-price">
                      {formatPrice(item.price)}원 × {item.quantity}개
                    </p>

                    <p className="item-total">
                      소계:{" "}
                      <strong>
                        {formatPrice(item.price * item.quantity)}원
                      </strong>
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* 배송 정보 */}
        <div className="detail-section">
          <h3>배송 정보</h3>

          {/* 주문 시 입력한 배송지 정보 */}
          <div className="info-grid">
            <div className="info-row">
              <span className="info-label">수령인</span>
              <span className="info-value">{order.recipientName || "-"}</span>
            </div>

            <div className="info-row">
              <span className="info-label">연락처</span>
              <span className="info-value">{order.recipientPhone || "-"}</span>
            </div>

            <div className="info-row full-width">
              <span className="info-label">배송지</span>
              <span className="info-value">{order.shippingAddress || "-"}</span>
            </div>

            <div className="info-row full-width">
              <span className="info-label">배송 요청사항</span>
              <span className="info-value">{order.shippingRequest || "-"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;

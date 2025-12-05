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
  const [productDetails, setProductDetails] = useState({}); // 상품 상세 정보 저장

  // 알림(Notification) 화면에서 진입한 경우 구분
  const fromNotifications = location.state?.from === "notifications";

  const handleBack = () => {
    if (fromNotifications) {
      navigate("/notifications");
    } else {
      navigate("/mypage/orders");
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    loadOrderDetail();
  }, [orderId, isAuthenticated]);

  // 주문 상세 정보 조회
  const loadOrderDetail = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("accessToken");
      const url = `http://localhost:8080/api/orders/${orderId}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        console.log("주문 상세 데이터:", response.data.order);
        setOrder(response.data.order);

        // 주문 상품들의 상세 정보 조회
        if (response.data.order.orderItems) {
          await loadProductDetails(response.data.order.orderItems);
        }
      } else {
        toast.error("주문 정보를 불러올 수 없습니다.");
        navigate("/mypage/orders");
      }
    } catch (error) {
      console.error("주문 상세 조회 오류:", error);
      toast.error("주문 정보를 불러오는데 실패했습니다.");
      navigate("/mypage/orders");
    } finally {
      setLoading(false);
    }
  };

  // 상품 상세 정보 조회 (이미지 포함)
  const loadProductDetails = async (orderItems) => {
    try {
      const details = {};

      for (const item of orderItems) {
        if (item.productId) {
          try {
            const response = await axios.get(
              `http://localhost:8080/api/products/${item.productId}`
            );

            if (response.data) {
              console.log(`상품 ${item.productId} 상세 정보:`, response.data);
              details[item.productId] = response.data;
            }
          } catch (error) {
            console.error(`상품 ${item.productId} 조회 실패:`, error);
          }
        }
      }

      setProductDetails(details);
      console.log("모든 상품 상세 정보:", details);
    } catch (error) {
      console.error("상품 상세 정보 로드 오류:", error);
    }
  };

  // 이미지 URL 생성 함수 (ProductCard와 동일한 로직)
  const getImageUrl = (imagePath) => {
    console.log("원본 imagePath:", imagePath);

    if (!imagePath) return "/images/no-image.png";

    // uploads/ 경로면 백엔드 서버에서 가져오기
    if (imagePath.startsWith("uploads/") || imagePath.startsWith("/uploads/")) {
      const url = `http://localhost:8080${
        imagePath.startsWith("/") ? "" : "/"
      }${imagePath}`;
      console.log("생성된 이미지 URL (uploads):", url);
      return url;
    }

    // 짧은 이름이면 public/product_img/ 폴더에서 가져오기
    if (!imagePath.includes("/") && !imagePath.startsWith("http")) {
      const url = `/product_img/${imagePath}.jpg`;
      console.log("생성된 이미지 URL (product_img):", url);
      return url;
    }

    console.log("원본 그대로 사용:", imagePath);
    return imagePath;
  };

  // 날짜 포맷 변환
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

  // 주문 상태 변환
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

          <div className="order-items">
            {order.orderItems &&
              order.orderItems.map((item, index) => {
                // 상품 상세 정보에서 이미지 가져오기
                const productDetail = productDetails[item.productId];
                const imageSource =
                  productDetail?.thumbnailImage ||
                  productDetail?.image ||
                  productDetail?.mainImg ||
                  item.thumbnailImage ||
                  item.productImage ||
                  item.image ||
                  item.mainImg;

                console.log(
                  `상품 ${index + 1} (ID: ${item.productId}) 이미지:`,
                  imageSource
                );

                return (
                  <div key={index} className="order-item-card">
                    <div className="item-image">
                      <img
                        src={getImageUrl(imageSource)}
                        alt={item.productName}
                        onError={(e) => {
                          console.error("이미지 로드 실패:", e.target.src);
                          e.target.src = "/images/placeholder.png";
                          e.target.onerror = null;
                        }}
                      />
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
                );
              })}
          </div>
        </div>

        {/* 배송 정보 */}
        <div className="detail-section">
          <h3>배송 정보</h3>

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

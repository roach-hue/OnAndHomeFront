import axios from "axios";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import "./MyOrders.css";

const MyOrders = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.user);
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

  const [allOrders, setAllOrders] = useState([]);
  const [displayOrders, setDisplayOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [showHidden, setShowHidden] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!isAuthenticated) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    // 주문 내역 조회 API 호출
    // 사용자가 MyOrders 페이지에 진입하거나 로그인 상태가 바뀌거나
    // "숨긴 주문 보기" 토글이 변경될 때마다 다시 호출된다.
    fetchOrders();
  }, [isAuthenticated, navigate, showHidden]);

  useEffect(() => {
    // 주문 전체 목록이 갱신되면 현재 페이지에 맞게 화면 표시 목록을 업데이트한다.
    if (allOrders.length > 0) {
      updateDisplayOrders();
    }
  }, [currentPage, allOrders]);

  const fetchOrders = async () => {
    // 전체 주문 목록 불러오기
    // 백엔드 엔드포인트: GET /api/orders/user/{userId}
    // includeHidden=true 이면 숨긴 주문도 포함하여 가져온다.
    setLoading(true);
    setError(null);

    try {
      console.log(
        "주문 내역 조회 시작... (숨긴 주문 포함: " + showHidden + ")"
      );
      console.log("User ID:", user?.id);

      const url = `${API_BASE_URL}/api/orders/user/${user?.id}?includeHidden=${showHidden}`;

      // JWT 인증이 필요한 API라 Authorization 헤더에 토큰을 실어 보냄
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          "Content-Type": "application/json",
        },
      });

      // 백엔드에서 반환된 주문 목록 (data 배열)
      const orders = response.data.data || [];

      // 최신 주문이 먼저 오도록 createdAt 기준으로 정렬
      const sortedOrders = orders.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      // 전체 주문 저장 (페이지네이션 전 전체 데이터)
      setAllOrders(sortedOrders);

      // 총 페이지 수 계산
      const pages = Math.ceil(sortedOrders.length / itemsPerPage);
      setTotalPages(pages);
    } catch (error) {
      console.error("주문 내역 조회 실패:", error);

      // 백엔드에서 message 필드 제공 시 그 내용을 그대로 표시
      setError(
        error.response?.data?.message || "주문 내역을 불러오는데 실패했습니다."
      );

      // 인증 실패 시 로그인 만료 처리
      if (error.response?.status === 401) {
        alert("로그인이 만료되었습니다. 다시 로그인해주세요.");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userInfo");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateDisplayOrders = () => {
    // 화면에 보여줄 주문 목록(페이지 단위) 계산
    // allOrders = 전체 데이터 / displayOrders = 현재 페이지에 해당되는 데이터
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedOrders = allOrders.slice(startIndex, endIndex);
    setDisplayOrders(paginatedOrders);
  };

  const formatDate = (dateString) => {
    // 주문일자 포맷 (YYYY.MM.DD)
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}.${month}.${day}`;
    } catch (error) {
      return "-";
    }
  };

  const formatPrice = (price) => {
    // 주문 총 금액 표시
    // 무통장입금(PAYMENT_PENDING) 상태에서도 deposit 금액으로 표시됨
    if (!price && price !== 0) return "0원";
    return price.toLocaleString() + "원";
  };

  const getStatusText = (status) => {
    // 주문 상태 텍스트 변환
    // (백엔드 ENUM → 사용자 UI용 문자열로 변환)
    const statusMap = {
      PAYMENT_PENDING: "입금대기",
      ORDERED: "결제완료",
      PREPARING: "상품준비중",
      DELIVERING: "배송중",
      DELIVERED: "배송완료",
      CANCELED: "주문취소",
    };
    return statusMap[status] || status || "상태없음";
  };

  const getStatusClass = (status) => {
    // 주문 상태별 CSS 클래스 반환
    const classMap = {
      PAYMENT_PENDING: "status-pending",
      ORDERED: "status-paid",
      PREPARING: "status-preparing",
      DELIVERING: "status-shipping",
      DELIVERED: "status-delivered",
      CANCELED: "status-cancelled",
    };
    return classMap[status] || "status-pending";
  };

  const generatePageNumbers = () => {
    // 페이지네이션 번호 생성 (최대 5개까지 표시)
    const pageNumbers = [];
    const maxPagesToShow = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  const handlePageChange = (pageNumber) => {
    // 페이지 이동 시 리스트 갱신 및 최상단 스크롤 이동
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleHideOrder = async (orderId, orderNumber) => {
    // 특정 주문 숨김 처리 → 백엔드: POST /api/orders/{orderId}/hide
    if (!window.confirm(`주문번호 ${orderNumber}를 숨김 처리하시겠습니까?`)) {
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/orders/${orderId}/hide`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        alert("주문이 숨김 처리되었습니다.");
        fetchOrders();
      }
    } catch (error) {
      alert("주문 숨김 중 오류가 발생했습니다.");
    }
  };

  const handleUnhideOrder = async (orderId, orderNumber) => {
    // 숨김 주문 해제 → 백엔드: POST /api/orders/{orderId}/unhide
    if (!window.confirm(`주문번호 ${orderNumber}의 숨김을 해제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/orders/${orderId}/unhide`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        alert("주문 숨김이 해제되었습니다.");
        fetchOrders();
      }
    } catch (error) {
      alert("주문 숨김 해제 중 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="my-orders-container">
        <div className="loading">주문 내역을 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-orders-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchOrders} className="retry-button">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-orders-container">
      <div className="my-orders-content">
        <h1>주문 내역</h1>

        {allOrders.length === 0 ? (
          <div className="empty-orders">
            <p>주문 내역이 없습니다.</p>
            <button
              onClick={() => navigate("/products")}
              className="go-shopping-btn"
            >
              쇼핑하러 가기
            </button>
          </div>
        ) : (
          <>
            <div className="orders-controls">
              <div className="orders-summary">
                총 {allOrders.length}개의 주문
              </div>

              {/* 숨긴 주문 보기 토글 → 백엔드 includeHidden 과 연동됨 */}
              <div className="show-hidden-toggle">
                <label>
                  <input
                    type="checkbox"
                    checked={showHidden}
                    onChange={(e) => setShowHidden(e.target.checked)}
                  />
                  <span>숨긴 주문 보기</span>
                </label>
              </div>
            </div>

            {/* 페이지에 따라 표시되는 주문 카드 리스트 */}
            <div className="orders-list">
              {displayOrders.map((order) => (
                <div
                  key={order.orderId}
                  className={`order-card ${order.hidden ? "hidden-order" : ""}`}
                >
                  {/* 주문 카드 헤더 영역 */}
                  <div className="order-header">
                    <div className="order-date">
                      <span className="label">주문일자:</span>
                      <span className="value">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>

                    <div className="order-number">
                      <span className="label">주문번호:</span>
                      <span className="value">
                        {order.orderNumber || order.orderId}
                      </span>
                    </div>

                    <div className="order-header-right">
                      <div
                        className={`order-status ${getStatusClass(
                          order.status
                        )}`}
                      >
                        {/* 주문 상태 텍스트 표시 */}
                        {getStatusText(order.status)}
                      </div>

                      {/* 숨김 / 숨김 해제 버튼 */}
                      {order.hidden ? (
                        <button
                          className="unhide-order-btn"
                          onClick={() =>
                            handleUnhideOrder(
                              order.orderId,
                              order.orderNumber || order.orderId
                            )
                          }
                        >
                          보이기
                        </button>
                      ) : (
                        <button
                          className="hide-order-btn"
                          onClick={() =>
                            handleHideOrder(
                              order.orderId,
                              order.orderNumber || order.orderId
                            )
                          }
                        >
                          숨김
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 주문 본문 */}
                  <div className="order-body">
                    {/* 주문 상품 리스트 */}

                    {/* 무통장 입금(PAYMENT_PENDING) 주문에게만 표시되는 안내 영역 */}
                    {order.status === "PAYMENT_PENDING" && (
                      <div className="bank-info-section">
                        <h3 className="bank-info-title">입금 계좌 정보</h3>

                        <div className="bank-info-content">
                          <div className="bank-detail">
                            <span className="bank-label">은행:</span>
                            <span className="bank-value">국민은행</span>
                          </div>
                          <div className="bank-detail">
                            <span className="bank-label">계좌번호:</span>
                            <span className="bank-value">123-456-789012</span>
                          </div>
                          <div className="bank-detail">
                            <span className="bank-label">예금주:</span>
                            <span className="bank-value">(주)온앤홈</span>
                          </div>

                          {/* 입금해야 하는 금액 */}
                          <div className="bank-detail highlight">
                            <span className="bank-label">입금금액:</span>
                            <span className="bank-value amount">
                              {formatPrice(order.totalPrice)}
                            </span>
                          </div>
                        </div>

                        <div className="bank-notice">
                          <p>입금자명은 주문자명과 동일하게 입력해주세요.</p>
                          <p>입금 확인 후 배송이 시작됩니다.</p>
                        </div>
                      </div>
                    )}

                    {/* 주문 금액 표시 */}
                    <div className="order-total">
                      <span className="total-label">총 결제금액</span>
                      <span className="total-amount">
                        {formatPrice(order.totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 페이지 번호 표시 */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="page-button"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                >
                  처음
                </button>

                <button
                  className="page-button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  이전
                </button>

                {generatePageNumbers().map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`page-number ${
                      currentPage === pageNum ? "active" : ""
                    }`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  className="page-button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  다음
                </button>

                <button
                  className="page-button"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  마지막
                </button>
              </div>
            )}

            <div className="page-info">
              {currentPage} / {totalPages} 페이지
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyOrders;

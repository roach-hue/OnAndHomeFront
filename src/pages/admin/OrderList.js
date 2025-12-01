import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import "./OrderList.css";

const OrderList = () => {
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

  const [orders, setOrders] = useState([]); // 전체 주문 목록
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [searchTerm, setSearchTerm] = useState(""); // 검색 텍스트
  const [filterStatus, setFilterStatus] = useState("all"); // 상태 필터 조건

  useEffect(() => {
    // 관리자 페이지 접속 시 최초 한 번 주문 목록 조회
    fetchOrders();
  }, []);

  // 관리자용 전체 주문 목록 조회
  // 백엔드: GET /api/admin/orders
  // 결제 전/후/배송중/취소 포함 전체 리스트 반환
  const fetchOrders = async () => {
    setLoading(true);

    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/orders`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      // 백엔드가 배열을 반환하는 경우에만 저장
      if (response.data && Array.isArray(response.data)) {
        setOrders(response.data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("주문 목록 조회 실패:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // 주문 상세 페이지 이동
  const handleRowClick = (orderId) => {
    navigate(`/admin/orders/${orderId}`);
  };

  // 검색 + 상태 필터 적용된 주문 목록
  // 1) 주문번호 검색
  // 2) 구매자 ID(searchTerm 매칭)
  // 3) 구매자명(userName/username)
  // 4) 상태 필터(filterStatus)
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !searchTerm ||
      order.orderNumber?.includes(searchTerm) ||
      order.userId?.includes(searchTerm) ||
      (order.userName || order.username || "").includes(searchTerm);

    const matchesStatus =
      filterStatus === "all" || order.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="admin-order-list">
        <AdminSidebar />
        <div className="order-list-main">
          <div className="loading">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-order-list">
      <AdminSidebar />

      <div className="order-list-main">
        {/* 페이지 상단 헤더 */}
        <div className="page-header">
          <h1>Order List</h1>

          <div className="header-controls">
            {/* 주문 상태 필터 */}
            {/* 백엔드 ENUM(OrderStatus)과 연동되는 선택 옵션 */}
            <select
              className="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">전체 상태</option>
              <option value="ORDERED">결제완료</option>
              <option value="DELIVERING">배송중</option>
              <option value="DELIVERED">배송완료</option>
              <option value="CANCELED">취소</option>
            </select>

            {/* 검색창 (주문번호/구매자 검색) */}
            <div className="search-box">
              <form onSubmit={(e) => e.preventDefault()}>
                <input
                  type="text"
                  placeholder="주문번호 또는 구매자명을 입력하세요"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit" className="search-btn">
                  🔍
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* 주문 테이블 */}
        <div className="order-table-container">
          <table className="order-table">
            <thead>
              <tr>
                <th>주문번호</th>
                <th>상품명</th>
                <th>주문가격</th>
                <th>구매자 ID</th>
                <th>구매자명</th>
                <th>주문상태</th>
                <th>주문일자</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7">조회된 주문이 없습니다.</td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  // 주문 첫 번째 상품명 + 외 몇 건 표시
                  let productName = "-";
                  if (
                    order.orderItems &&
                    Array.isArray(order.orderItems) &&
                    order.orderItems.length > 0
                  ) {
                    const first = order.orderItems[0];
                    productName = first.productName || "-";

                    if (order.orderItems.length > 1) {
                      productName += ` 외 ${order.orderItems.length - 1}건`;
                    }
                  }

                  // 가격 표시 포맷
                  const price = order.totalPrice
                    ? order.totalPrice.toLocaleString() + "원"
                    : "0원";

                  // 날짜 포맷 (YYYY-MM-DD)
                  let dateStr = "-";
                  if (order.createdAt) {
                    try {
                      const d = new Date(order.createdAt);
                      dateStr = `${d.getFullYear()}-${String(
                        d.getMonth() + 1
                      ).padStart(2, "0")}-${String(d.getDate()).padStart(
                        2,
                        "0"
                      )}`;
                    } catch (e) {
                      dateStr = "-";
                    }
                  }

                  // 주문 상태 → 한글 변환
                  const statusMap = {
                    ORDERED: "결제완료",
                    CANCELED: "취소",
                    DELIVERING: "배송중",
                    DELIVERED: "배송완료",
                  };
                  const statusText = statusMap[order.status] || order.status;

                  // 상태에 따른 CSS 클래스
                  const statusClassMap = {
                    ORDERED: "status-paid",
                    CANCELED: "status-cancelled",
                    DELIVERING: "status-shipping",
                    DELIVERED: "status-delivered",
                  };
                  const statusClass = statusClassMap[order.status] || "";

                  return (
                    <tr
                      key={order.id}
                      onClick={() => handleRowClick(order.id)}
                      className="clickable-row"
                    >
                      {/* 주문번호 */}
                      <td>{order.orderNumber || "-"}</td>

                      {/* 상품명 */}
                      <td style={{ textAlign: "left", paddingLeft: "15px" }}>
                        {productName}
                      </td>

                      {/* 가격 */}
                      <td style={{ textAlign: "right", paddingRight: "15px" }}>
                        {price}
                      </td>

                      {/* 구매자 ID */}
                      <td>{order.userId || "-"}</td>

                      {/* 구매자 이름 */}
                      <td>{order.userName || order.username || "-"}</td>

                      {/* 상태 */}
                      <td>
                        <span className={`status-badge ${statusClass}`}>
                          {statusText}
                        </span>
                      </td>

                      {/* 주문일자 */}
                      <td>{dateStr}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 하단 요약 영역 (총 주문 수 / 총 매출) */}
        {/* 관리자에게 전체 매출과 주문량을 빠르게 보여주는 역할 */}
        <div className="order-summary">
          <div className="summary-item">
            <span className="summary-label">총 주문 수:</span>
            <span className="summary-value">{filteredOrders.length}건</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">총 매출액:</span>
            <span className="summary-value">
              {filteredOrders
                .reduce((sum, o) => sum + (o.totalPrice || 0), 0)
                .toLocaleString()}
              원
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderList;

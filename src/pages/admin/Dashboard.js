import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import DashboardCard from "../../components/admin/DashboardCard";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState({
    sales: {
      todayOrders: 0,
      todayRevenue: 0,
      monthRevenue: 0,
    },
    products: {
      totalProducts: 0,
      outOfStock: 0,
    },
    members: {
      newMembers: 0,
      totalMembers: 0,
      inactiveMembers: 0,
    },
    board: {
      notices: 0,
      reviews: 0,
      qna: 0,
    },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [adminInfo, setAdminInfo] = useState({
    name: "Admin",
    username: "안녕하세요",
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "http://localhost:8080/api/admin/dashboard",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("대시보드 데이터 로드 실패");
      }

      const data = await response.json();

      setDashboardData({
        sales: {
          todayOrders: data.todayOrderCount || 0,
          todayRevenue: data.todayRevenue || 0,
          monthRevenue: data.monthRevenue || 0,
        },
        products: {
          totalProducts: data.totalProducts || 0,
          outOfStock: data.outOfStockProducts || 0,
        },
        members: {
          newMembers: data.todayNewUsers || 0,
          totalMembers: data.totalUsers || 0,
          inactiveMembers: data.inactiveUsers || 0,
        },
        board: {
          notices: data.totalNotices || 0,
          reviews: data.totalReviews || 0,
          qna: data.totalQnas || 0,
        },
      });

      setLoading(false);
    } catch (error) {
      console.error("대시보드 데이터 로드 실패:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("accessToken");
    navigate("/admin/login");
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("ko-KR").format(value);
  };

  const goToProductList = () => {
    navigate("/admin/products");
  };

  const goToUserList = () => {
    navigate("/admin/users");
  };

  const goToNoticeList = () => {
    navigate("/admin/notices");
  };

  const goToQnaList = () => {
    navigate("/admin/qna");
  };

  const goToReviewList = () => {
    navigate("/admin/reviews");
  };

  const goToDeletedUserList = () => {
    navigate("/admin/users/deleted");
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <AdminSidebar />
        <div className="dashboard-main">
          <div className="loading-message">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <AdminSidebar />
        <div className="dashboard-main">
          <div className="error-message">오류: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <AdminSidebar />

      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1>Dash Board</h1>
        </div>

        <div className="dashboard-grid">
          {/* 매출현황 카드 */}
          <DashboardCard title="매출현황" type="sales">
            <div className="card-content">
              <div className="data-row">
                <span className="label">오늘의 주문</span>
                <span className="value">
                  {dashboardData.sales.todayOrders} 건
                </span>
              </div>
              <div className="data-row">
                <span className="label">오늘의 매출</span>
                <span className="value">
                  {formatCurrency(dashboardData.sales.todayRevenue)} 원
                </span>
              </div>
              <div className="data-row">
                <span className="label">이달의 매출</span>
                <span className="value highlight">
                  {formatCurrency(dashboardData.sales.monthRevenue)} 원
                </span>
              </div>
            </div>
          </DashboardCard>

          {/* 상품 현황 카드 - 여기 클릭 기능 추가됨 */}
          <DashboardCard title="상품 현황" type="products">
            <div className="card-content">
              <div className="data-row clickable" onClick={goToProductList}>
                <span className="label">전체상품</span>
                <span className="value">
                  {dashboardData.products.totalProducts} 건
                </span>
              </div>
              <div className="data-row clickable" onClick={goToProductList}>
                <span className="label">품절 상품</span>
                <span className="value">
                  {dashboardData.products.outOfStock} 건
                </span>
              </div>
            </div>
          </DashboardCard>

          {/* 회원 현황 카드 */}
          <DashboardCard title="회원 현황" type="members">
            <div className="card-content">
              <div className="data-row clickable" onClick={goToUserList}>
                <span className="label">신규가입 회원</span>
                <span className="value">
                  {dashboardData.members.newMembers} 명
                </span>
              </div>
              <div className="data-row clickable" onClick={goToUserList}>
                <span className="label">전체회원</span>
                <span className="value">
                  {dashboardData.members.totalMembers} 명
                </span>
              </div>
              <div className="data-row clickable" onClick={goToDeletedUserList}>
                <span className="label">탈퇴 회원</span>
                <span className="value">
                  {dashboardData.members.inactiveMembers} 명
                </span>
              </div>
            </div>
          </DashboardCard>

          {/* 게시판 카드 */}
          <DashboardCard title="게시판" type="board">
            <div className="card-content">
              <div className="data-row clickable" onClick={goToNoticeList}>
                <span className="label">공지사항</span>
                <span className="value">{dashboardData.board.notices} 건</span>
              </div>
              <div className="data-row clickable" onClick={goToReviewList}>
                <span className="label">리뷰게시판</span>
                <span className="value">{dashboardData.board.reviews} 건</span>
              </div>
              <div className="data-row clickable" onClick={goToQnaList}>
                <span className="label">Q&A게시판</span>
                <span className="value">{dashboardData.board.qna} 건</span>
              </div>
            </div>
          </DashboardCard>
        </div>

        {/* 관리자 정보 플로팅 박스 */}
        <div className="admin-info-box">
          <div className="admin-info">
            <div className="admin-name">{adminInfo.name} 님</div>
            <div className="admin-greeting">{adminInfo.username}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            logout
            <span className="logout-icon">➡</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

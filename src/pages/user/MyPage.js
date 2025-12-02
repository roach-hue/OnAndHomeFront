import React from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import "./MyPage.css";

const MyPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);

  // 관리자 여부 확인
  const isAdmin =
    user && (user.role === 0 || user.role === "0" || Number(user.role) === 0);

  const handleAdminClick = () => {
    navigate("/admin/dashboard");
  };

  return (
    <div className="mypage-container">
      <div className="mypage-header">
        <h1>마이페이지</h1>
        {isAdmin && (
          <button className="admin-btn" onClick={handleAdminClick}>
            관리자 페이지로 이동
          </button>
        )}
      </div>

      <div className="mypage-content">
        {/* 회원 정보 */}
        <div className="mypage-section">
          <h2>회원 정보</h2>
          <div className="mypage-menu">
            <Link to="/mypage/info" className="mypage-menu-item">
              <div className="menu-icon">👤</div>
              <div className="menu-text">
                <h3>내 정보 관리</h3>
                <p>회원 정보를 수정할 수 있습니다.</p>
              </div>
            </Link>
          </div>
        </div>

        {/* 주문 관리 */}
        <div className="mypage-section">
          <h2>상품 및 주문 관리</h2>
          <div className="mypage-menu">
            {/* 주문/배송 조회 */}
            <Link to="/mypage/orders" className="mypage-menu-item">
              <div className="menu-icon">📦</div>
              <div className="menu-text">
                <h3>주문/배송 조회</h3>
                <p>주문 내역 및 배송 상태를 확인할 수 있습니다.</p>
              </div>
            </Link>

            {/* 장바구니 */}
            <Link to="/cart" className="mypage-menu-item">
              <div className="menu-icon">🛒</div>
              <div className="menu-text">
                <h3>장바구니</h3>
                <p>담아둔 상품을 확인할 수 있습니다.</p>
              </div>
            </Link>

            {/* 찜 목록 */}
            <Link to="/mypage/favorites" className="mypage-menu-item">
              <div className="menu-icon">❤️</div>
              <div className="menu-text">
                <h3>찜 목록</h3>
                <p>찜한 상품을 확인할 수 있습니다.</p>
              </div>
            </Link>
          </div>
        </div>

        {/* 게시판 */}
        <div className="mypage-section">
          <h2>게시판</h2>
          <div className="mypage-menu">
            <Link to="/mypage/qna" className="mypage-menu-item">
              <div className="menu-icon">❓</div>
              <div className="menu-text">
                <h3>문의 내역</h3>
                <p>작성한 문의를 확인할 수 있습니다.</p>
              </div>
            </Link>

            <Link to="/mypage/reviews" className="mypage-menu-item">
              <div className="menu-icon">⭐</div>
              <div className="menu-text">
                <h3>리뷰 관리</h3>
                <p>작성한 리뷰를 확인할 수 있습니다.</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPage;

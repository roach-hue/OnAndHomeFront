import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { logout } from "../../store/slices/userSlice";
import { setUnreadCount } from "../../store/slices/notificationSlice";
import CompareFloatingButton from "../common/CompareFloatingButton";
import CartFloatingButton from "../cart/CartFloatingButton";
import notificationApi from "../../api/notificationApi";
import "./UserLayout.css";

const UserLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.user);
  const unreadCount = useSelector((state) => state.notification?.unreadCount || 0);
  const [showMyPageDropdown, setShowMyPageDropdown] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);

  // 관리자 여부 확인 함수
  const isAdmin = () => {
    if (!user) return false;
    return user.role === 0 || user.role === "0" || Number(user.role) === 0;
  };

  // 알림 개수 업데이트
  useEffect(() => {
    const updateNotificationCount = async () => {
      if (!isAuthenticated) {
        dispatch(setUnreadCount(0));
        return;
      }

      try {
        const response = await notificationApi.getUnreadCount();
        if (response.success) {
          dispatch(setUnreadCount(response.count || 0));
        }
      } catch (error) {
        console.error('알림 개수 조회 실패:', error);
      }
    };

    if (isAuthenticated) {
      updateNotificationCount();
      // 30초마다 알림 개수 갱신
      const interval = setInterval(updateNotificationCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, dispatch]);

  // 카테고리 구조 정의
  const categories = [
    {
      id: "tv-audio",
      name: "TV/오디오",
      subCategories: [
        { name: "TV", link: "/products/category/TV" },
        { name: "오디오", link: "/products/category/오디오" },
      ],
    },
    {
      id: "kitchen",
      name: "주방가전",
      subCategories: [
        { name: "냉장고", link: "/products/category/냉장고" },
        { name: "전자레인지", link: "/products/category/전자레인지" },
        { name: "식기세척기", link: "/products/category/식기세척기" },
      ],
    },
    {
      id: "living",
      name: "생활가전",
      subCategories: [
        { name: "세탁기", link: "/products/category/세탁기" },
        { name: "청소기", link: "/products/category/청소기" },
      ],
    },
    {
      id: "air",
      name: "에어컨/공기청정기",
      subCategories: [
        { name: "에어컨", link: "/products/category/에어컨" },
        { name: "공기청정기", link: "/products/category/공기청정기" },
        { name: "정수기", link: "/products/category/정수기" },
      ],
    },
    {
      id: "etc",
      name: "기타",
      subCategories: [
        { name: "안마의자", link: "/products/category/안마의자" },
        { name: "PC", link: "/products/category/PC" },
      ],
    },
  ];

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userInfo");
    navigate("/");
    alert("로그아웃되었습니다.");
  };

  const toggleMyPageDropdown = () => {
    setShowMyPageDropdown(!showMyPageDropdown);
  };

  const closeDropdowns = () => {
    setShowMyPageDropdown(false);
    setHoveredCategory(null);
  };

  const handleCategoryMouseEnter = (categoryId) => {
    setHoveredCategory(categoryId);
  };

  const handleCategoryMouseLeave = () => {
    setHoveredCategory(null);
  };

  const handleCategoryClick = (e, category) => {
    // 소카테고리가 있는 경우 클릭 방지
    if (category.subCategories && category.subCategories.length > 0) {
      e.preventDefault();
    }
  };

  return (
    <div className="user-layout">
      {/* 헤더 */}
      <header className="user-header">
        {/* 상단 라인: 로그인/회원가입/공지사항 */}
        <div className="header-top-line">
          <div className="header-container">
            <div className="header-left">
              {/* SNS 아이콘은 제거하거나 추가 가능 */}
            </div>
            <div className="header-right">
              {isAuthenticated ? (
                <>
                  <span className="user-name">{user?.username}님</span>
                  <Link to="/mypage" onClick={closeDropdowns}>
                    마이페이지
                  </Link>
                  {isAdmin() && (
                    <Link
                      to="/admin/dashboard"
                      onClick={closeDropdowns}
                      style={{ color: "#ff6b00", fontWeight: "bold" }}
                    >
                      관리자페이지
                    </Link>
                  )}
                  <button onClick={handleLogout} className="logout-button">
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={closeDropdowns}>
                    로그인
                  </Link>
                  <Link to="/signup" onClick={closeDropdowns}>
                    회원가입
                  </Link>
                </>
              )}
              <Link to="/notices" onClick={closeDropdowns}>
                공지사항
              </Link>
              {isAuthenticated && (
                <div
                  className="notification-bell-container"
                  onClick={() => {
                    closeDropdowns();
                    navigate('/notifications');
                  }}
                  title="알림"
                >
                  <span className="bell-icon">🔔</span>
                  {unreadCount > 0 && (
                    <span className="bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 로고 중앙 배치 */}
        <div className="header-logo-line">
          <div className="logo-center">
            <Link to="/" onClick={closeDropdowns}>
              <img src="/images/logo.png" alt="On&Home" />
            </Link>
          </div>
        </div>

        {/* 네비게이션 바 */}
        <div className="header-nav-line">
          <div className="header-container">
            <nav className="main-nav">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="nav-item-wrapper"
                  onMouseEnter={() => handleCategoryMouseEnter(category.id)}
                  onMouseLeave={handleCategoryMouseLeave}
                >
                  {category.link ? (
                    <Link
                      to={category.link}
                      className="nav-item"
                      onClick={closeDropdowns}
                    >
                      {category.name}
                    </Link>
                  ) : (
                    <span
                      className="nav-item nav-item-no-link"
                      onClick={(e) => handleCategoryClick(e, category)}
                    >
                      {category.name}
                    </span>
                  )}

                  {/* 소카테고리 드롭다운 */}
                  {category.subCategories &&
                    category.subCategories.length > 0 &&
                    hoveredCategory === category.id && (
                      <div className="sub-category-dropdown">
                        {category.subCategories.map((subCategory, index) => (
                          <Link
                            key={index}
                            to={subCategory.link}
                            className="sub-category-item"
                            onClick={closeDropdowns}
                          >
                            {subCategory.name}
                          </Link>
                        ))}
                      </div>
                    )}
                </div>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="main-content" onClick={closeDropdowns}>
        <Outlet />
      </main>

      {/* 상품 비교 플로팅 버튼 - 여기에 추가! */}
      <CompareFloatingButton />

      {/* 장바구니 플로팅 버튼 - 추가 */}
      <CartFloatingButton />

      {/* 푸터 */}
      <footer className="user-footer">
        <div className="footer-container">
          <div className="footer-info">
            <h3>On&Home</h3>
            <p>고객센터: 1544-7777</p>
            <p>© 2024 On&Home. All rights reserved.</p>
          </div>
          <div className="footer-links">
            <Link to="/notices" onClick={closeDropdowns}>
              공지사항
            </Link>
            <Link to={isAuthenticated ? "/mypage/qna" : "/login"} onClick={closeDropdowns}>
              Q&A
            </Link>
            <Link to={isAuthenticated ? "/mypage/reviews" : "/login"} onClick={closeDropdowns}>
              리뷰
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UserLayout;

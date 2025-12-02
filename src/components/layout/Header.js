import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../../api";
import notificationApi from "../../api/notificationApi";
import { setUnreadCount } from "../../store/slices/notificationSlice";
import { logout } from "../../store/slices/userSlice";
import NotificationBell from "../common/NotificationBell";
import webSocketService from "../../utils/webSocketService";
import toast from "react-hot-toast";
import "./Header.css";

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.user);
  const cartState = useSelector((state) => state.cart);
  const totalCount = cartState?.totalCount || 0;

  const [searchKeyword, setSearchKeyword] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [openMenu, setOpenMenu] = useState(null);
  const menuTimeoutRef = React.useRef(null);

  // 카테고리 데이터
  const categoryData = [
    {
      parentName: "TV/오디오",
      children: ["TV", "오디오"],
    },
    {
      parentName: "주방가전",
      children: ["냉장고", "전자레인지", "식기세척기"],
    },
    {
      parentName: "생활가전",
      children: ["세탁기", "청소기"],
    },
    {
      parentName: "에어컨/공기청정기",
      children: ["에어컨", "공기청정기", "정수기"],
    },
    {
      parentName: "기타",
      children: ["안마의자", "PC"],
    },
  ];

  // 장바구니 개수 업데이트
  useEffect(() => {
    const updateCartCount = async () => {
      // 로그인하지 않은 경우 카운트 0으로 설정
      if (!isAuthenticated) {
        setCartCount(0);
        return;
      }

      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        setCartCount(0);
        return;
      }

      try {
        const response = await fetch("http://localhost:8080/api/cart/count", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
          // 인증 오류 등의 경우 조용히 처리
          setCartCount(0);
          return;
        }

        const data = await response.json();
        if (data.success) {
          setCartCount(data.count || 0);
        } else {
          setCartCount(0);
        }
      } catch (error) {
        // 에러 발생 시 조용히 처리 (콘솔에만 로그)
        console.debug("장바구니 개수 조회 실패:", error.message);
        setCartCount(0);
      }
    };

    updateCartCount();
  }, [isAuthenticated]);

  // 알림 개수 업데이트
  useEffect(() => {
    const updateNotificationCount = async () => {
      // 로그인하지 않은 경우 카운트 0으로 설정
      if (!isAuthenticated) {
        dispatch(setUnreadCount(0));
        return;
      }

      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        dispatch(setUnreadCount(0));
        return;
      }

      try {
        const response = await notificationApi.getUnreadCount();
        if (response.success) {
          dispatch(setUnreadCount(response.count || 0));
        } else {
          dispatch(setUnreadCount(0));
        }
      } catch (error) {
        // 에러 발생 시 조용히 처리
        console.debug("알림 개수 조회 실패:", error.message);
        dispatch(setUnreadCount(0));
      }
    };

    if (isAuthenticated) {
      updateNotificationCount();
      // 30초마다 알림 개수 갱신
      const interval = setInterval(updateNotificationCount, 30000);
      return () => clearInterval(interval);
    } else {
      dispatch(setUnreadCount(0));
    }
  }, [isAuthenticated, dispatch]);

  // WebSocket 연결 및 실시간 알림
  useEffect(() => {
    console.log("🔍 WebSocket useEffect 실행:", { isAuthenticated, user });

    if (isAuthenticated && user?.userId) {
      console.log("✅ WebSocket 연결 조건 충족 - userId:", user.userId);

      // 알림 수신 콜백
      const handleNotification = (notification) => {
        console.log("🔔 실시간 알림 수신:", notification);

        // 읽지 않은 알림 개수 업데이트
        dispatch(setUnreadCount((prev) => (prev || 0) + 1));

        // Toast 알림 표시
        toast.success(
          <div
            onClick={() => navigate("/notifications")}
            style={{ cursor: "pointer" }}
          >
            <strong>{notification.title}</strong>
            <br />
            <span>{notification.content}</span>
          </div>,
          {
            duration: 3000,
            position: "top-right",
            icon: "🔔",
          }
        );
      };

      // WebSocket 연결
      console.log("🔌 WebSocket 연결 호출...");
      webSocketService.connect(user.userId, handleNotification, () =>
        console.log("✅ WebSocket 연결 완료 콜백 실행")
      );

      // 컴포넌트 언마운트 시 연결 해제
      return () => {
        console.log("🔌 WebSocket 연결 해제");
        webSocketService.disconnect();
      };
    } else {
      console.log("❌ WebSocket 연결 조건 불충족:", {
        isAuthenticated,
        userId: user?.userId,
      });
    }
  }, [isAuthenticated, user, dispatch, navigate]);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("로그아웃 오류:", error);
    } finally {
      dispatch(logout());
      navigate("/");
      window.location.reload();
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchKeyword.trim()) {
      alert("검색어를 입력하세요.");
      return;
    }

    const categoryMap = {
      tv: "TV",
      오디오: "오디오",
      audio: "오디오",
      냉장고: "냉장고",
      refrigerator: "냉장고",
      전자레인지: "전자레인지",
      microwave: "전자레인지",
      식기세척기: "식기세척기",
      dishwasher: "식기세척기",
      세탁기: "세탁기",
      washer: "세탁기",
      청소기: "청소기",
      vacuum: "청소기",
      에어컨: "에어컨",
      airconditioner: "에어컨",
      aircon: "에어컨",
      공기청정기: "공기청정기",
      airpurifier: "공기청정기",
      정수기: "정수기",
      waterpurifier: "정수기",
      안마의자: "안마의자",
      massagechair: "안마의자",
      pc: "PC",
      컴퓨터: "PC",
    };

    const lowerKeyword = searchKeyword.toLowerCase();
    let targetCategory = null;

    for (const [key, value] of Object.entries(categoryMap)) {
      if (lowerKeyword === key || searchKeyword === value) {
        targetCategory = value;
        break;
      }
    }

    if (targetCategory) {
      navigate(`/products/category/${encodeURIComponent(targetCategory)}`);
    } else {
      navigate(`/products?keyword=${encodeURIComponent(searchKeyword)}`);
    }
  };

  // 메뉴 열기/닫기 함수
  const handleMenuEnter = (index) => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
    }
    setOpenMenu(index);
  };

  const handleMenuLeave = () => {
    menuTimeoutRef.current = setTimeout(() => {
      setOpenMenu(null);
    }, 200);
  };

  // 관리자 여부 확인 함수
  const isAdmin = () => {
    if (!user) return false;
    return user.role === 0 || user.role === "0" || Number(user.role) === 0;
  };

  return (
    <header className="on-header">
      {/* line01 - SNS 및 로그인 */}
      <div className="on-header-top">
        <div className="on-header-inner">
          <div>
            <ul className="sns-list">
              <a
                href="https://www.facebook.com/?locale=ko_KR"
                target="_blank"
                rel="noopener noreferrer"
              >
                <li className="sns-obj-fb"></li>
              </a>
              <a
                href="https://section.blog.naver.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <li className="sns-obj-blg"></li>
              </a>
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <li className="sns-obj-ins"></li>
              </a>
              <a
                href="https://www.youtube.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <li className="sns-obj-ut"></li>
              </a>
            </ul>
          </div>
          <div className="login-group">
            <ul className="login-group-list">
              {isAuthenticated ? (
                <>
                  <li>
                    <span className="user-name">
                      {user?.username || user?.userId}님
                    </span>
                  </li>
                  <li>
                    <Link to="/mypage">마이페이지</Link>
                  </li>
                  {isAdmin() && (
                    <li>
                      <Link
                        to="/admin/dashboard"
                        style={{ color: "#ff6b00", fontWeight: "bold" }}
                      >
                        관리자페이지
                      </Link>
                    </li>
                  )}
                  <li onClick={handleLogout}>로그아웃</li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/login">로그인</Link>
                  </li>
                  <li>
                    <Link to="/signup">회원가입</Link>
                  </li>
                </>
              )}
              <li>
                <Link to="/notices">공지사항</Link>
              </li>
            </ul>
            {isAuthenticated && <NotificationBell />}
          </div>
        </div>
      </div>

      {/* line02 - 로고만 완전 중앙 배치 */}
      <div className="on-header-logo-section">
        <div className="logo-container">
          <Link to="/">
            <h1 className="header-logo"></h1>
          </Link>
        </div>
      </div>

      {/* line03 - 네비게이션 바 (로고 아래 중앙) */}
      <div className="on-header-nav-section">
        <div className="nav-container">
          <ul className="gnb">
            {categoryData.map((category, index) => (
              <li
                key={index}
                onMouseEnter={() => handleMenuEnter(index)}
                onMouseLeave={handleMenuLeave}
                className={openMenu === index ? "menu-open" : ""}
              >
                <a href="#" onClick={(e) => e.preventDefault()}>
                  {category.parentName}
                </a>
                <ul className={`depth2 ${openMenu === index ? "show" : ""}`}>
                  {category.children.map((child, childIndex) => (
                    <li key={childIndex}>
                      <Link
                        to={`/products/category/${encodeURIComponent(child)}`}
                      >
                        {child}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Header;

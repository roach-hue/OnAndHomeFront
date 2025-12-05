import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../store/slices/userSlice";
import { authAPI } from "../../api";
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
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        setCartCount(0);
        return;
      }

      try {
        const response = await fetch("http://localhost:8080/api/cart/count", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await response.json();
        if (data.success) {
          setCartCount(data.count || 0);
        }
      } catch (error) {
        console.error("장바구니 개수 조회 실패:", error);
      }
    };

    if (isAuthenticated) {
      updateCartCount();
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("로그아웃 오류:", error);
    } finally {
      dispatch(logout());
      // 홈페이지로 이동하면서 완전히 새로고침
      window.location.href = '/';
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
                    <Link to="/mypage">마이페이지</Link>
                  </li>
                  {isAdmin() && (
                    <li>
                      <Link to="/admin/dashboard" className="admin-link">
                        관리자페이지
                      </Link>
                    </li>
                  )}
                  <li onClick={handleLogout} style={{ cursor: "pointer" }}>
                    로그아웃
                  </li>
                  <li>
                    <Link to="/notices">공지사항</Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/login">로그인</Link>
                  </li>
                  <li>
                    <Link to="/signup">회원가입</Link>
                  </li>
                  <li>
                    <Link to="/notices">공지사항</Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* line02 - 로고 및 검색 */}
      <div className="on-header-top">
        <div className="on-header-inner2">
          <Link to="/">
            <div className="header-logo-placeholder"></div>
          </Link>
          <div>
            <Link to="/">
              <h1 className="header-logo ml-200"></h1>
            </Link>
          </div>
          <div className="header-search-area">
            <form onSubmit={handleSearch}>
              <input
                type="text"
                className="input-m"
                placeholder="검색어를 입력하세요"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </form>
            <ul className="header-icons">
              <Link to="/mypage">
                <li className="ico-mypage"></li>
              </Link>
              <Link to="/cart">
                <li className="ico-cart">
                  {cartCount > 0 && (
                    <span className="cart-badge">{cartCount}</span>
                  )}
                </li>
              </Link>
            </ul>
          </div>
        </div>
      </div>

      {/* line03 - 메뉴 */}
      <div className="on-header-top">
        <div className="on-header-inner">
          <div className="menu-wrapper">
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
      </div>
    </header>
  );
};

export default Header;

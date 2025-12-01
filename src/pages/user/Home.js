import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { favoriteAPI } from "../../api/favoriteApi";

import {
  addToCompare,
  removeFromCompare,
} from "../../store/slices/compareSlice";

import { Link } from "react-router-dom";
import { productAPI } from "../../api";
import "./Home.css";

const SEARCH_PLACEHOLDER =
  "상품명 또는 카테고리를 검색해 보세요 (예: TV, 냉장고)";

const POPULAR_KEYWORDS = [
  "LG 올레드 EVO OLED65C5FNA",
  "삼성 Neo QLED 4K",
  "비스포크 냉장고",
  "LG 트롬 워시타워",
  "공기청정기",
];

const POPUP_MODAL1_KEY = "homePopupHideUntil1";
const POPUP_MODAL2_KEY = "homePopupHideUntil2";
const POPUP_MODAL3_KEY = "homePopupHideUntil3";

// 슬라이드 이미지
const HERO_SLIDES = [
  "/product_img/slide_01.jpg",
  "/product_img/slide_02.jpg",
  "/product_img/slide_03.jpg",
  "/product_img/slide_04.jpg",
];

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const compareItems = useSelector((state) => state.compare.items);

  const [products, setProducts] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(new Set());

  // 검색
  const [searchKeyword, setSearchKeyword] = useState("");
  const [homePlaceholder, setHomePlaceholder] = useState(SEARCH_PLACEHOLDER);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // 모달
  const [isModal1Open, setIsModal1Open] = useState(false);
  const [isModal2Open, setIsModal2Open] = useState(false);
  const [isModal3Open, setIsModal3Open] = useState(false);

  // 슬라이드
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    fetchProducts();

    const todayStr = new Date().toISOString().slice(0, 10);
    const hide1 = localStorage.getItem(POPUP_MODAL1_KEY);
    const hide2 = localStorage.getItem(POPUP_MODAL2_KEY);
    const hide3 = localStorage.getItem(POPUP_MODAL3_KEY);

    if (hide1 === todayStr && hide2 === todayStr && hide3 === todayStr) {
      return;
    }

    const timer = setTimeout(() => {
      if (hide1 !== todayStr) setIsModal1Open(true);
      else if (hide2 !== todayStr) setIsModal2Open(true);
      else if (hide3 !== todayStr) setIsModal3Open(true);
    }, 700);

    return () => clearTimeout(timer);
  }, []);

  // 자동 슬라이드
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 2000); // 속도 그대로 유지

    return () => clearInterval(timer);
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAllProductsForUser();
      if (response.success && response.products) {
        const allProducts = response.products;
        
        // 각 상품의 찜 개수 가져오기
        const productsWithFavorites = await Promise.all(
          allProducts.map(async (product) => {
            try {
              const favResponse = await fetch(
                `http://localhost:8080/api/favorites/count/product/${product.id}`
              );
              const favData = await favResponse.json();
              return {
                ...product,
                favoriteCount: favData.success ? favData.count : 0
              };
            } catch (error) {
              console.error(`찜 개수 조회 실패 (상품 ID: ${product.id}):`, error);
              return { ...product, favoriteCount: 0 };
            }
          })
        );
        
        console.log('찜 개수가 포함된 상품 목록:', productsWithFavorites);
        
        // 찜하기 수로 정렬하여 인기 상품 4개 선택
        const sortedByFavorites = [...productsWithFavorites].sort(
          (a, b) => b.favoriteCount - a.favoriteCount
        );
        
        console.log('찜하기 순으로 정렬된 상품:', sortedByFavorites.map(p => ({
          name: p.name,
          favoriteCount: p.favoriteCount
        })));
        
        setPopularProducts(sortedByFavorites.slice(0, 4));
        
        // 추천 상품: 전체 상품 중 처음 4개
        setProducts(allProducts.slice(0, 4));
      }
    } catch (error) {
      console.error("상품 조회 오류:", error);
      setProducts([]);
      setPopularProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // 찜 목록 로드
useEffect(() => {
  const loadFavorites = async () => {
    const token = localStorage.getItem('accessToken');
    
    // 로그인하지 않은 경우 찜 목록 비우기
    if (!token) {
      setFavorites(new Set());
      return;
    }
    
    try {
      const response = await favoriteAPI.getList();
      if (response.success) {
        const favoriteIds = new Set(response.data.map(fav => fav.productId));
        setFavorites(favoriteIds);
      }
    } catch (error) {
      console.error('찜 목록 로드 실패:', error);
      // 에러 시에도 찜 목록 초기화
      setFavorites(new Set());
    }
  };
  
  loadFavorites();
}, []); // 의존성 배열에 아무것도 없으면 마운트 시에만 실행됨

  const formatPrice = (price) => {
    if (!price) return "0";
    return price.toLocaleString();
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "/images/no-image.png";

    if (imagePath.startsWith("uploads/") || imagePath.startsWith("/uploads/")) {
      return `http://localhost:8080${
        imagePath.startsWith("/") ? "" : "/"
      }${imagePath}`;
    }

    if (!imagePath.includes("/") && !imagePath.startsWith("http")) {
      return `/product_img/${imagePath}.jpg`;
    }

    return imagePath;
  };

  const handleCompareToggle = (e, product) => {
    e.preventDefault();
    e.stopPropagation();

    const isInCompare = compareItems.some((item) => item.id === product.id);

    if (isInCompare) {
      dispatch(removeFromCompare(product.id));
    } else {
      if (compareItems.length >= 4) {
        alert("최대 4개 상품까지 비교할 수 있습니다.");
        return;
      }
      const compareProduct = {
        id: product.id,
        name: product.name,
        price: product.price,
        salePrice: product.salePrice,
        category: product.category,
        brand: product.brand,
        stock: product.stock,
        image: product.thumbnailImage,
      };
      dispatch(addToCompare(compareProduct));
    }
  };

  const handleFavoriteToggle = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    
    try {
      const response = await favoriteAPI.toggle(productId);
      if (response.success) {
        const newFavorites = new Set(favorites);
        if (response.isFavorite) {
          newFavorites.add(productId);
        } else {
          newFavorites.delete(productId);
        }
        setFavorites(newFavorites);
      }
    } catch (error) {
      console.error('찜하기 실패:', error);
      alert('찜하기 처리 중 오류가 발생했습니다.');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchKeyword.trim();
    if (!trimmed) return;

    navigate(`/products?keyword=${encodeURIComponent(trimmed)}`);
  };

  const handleClickPopular = (word) => {
    setSearchKeyword(word);
    navigate(`/products?keyword=${encodeURIComponent(word)}`);
  };

  // 모달 닫기
  const handleCloseModal1 = () => {
    setIsModal1Open(false);
    const todayStr = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(POPUP_MODAL2_KEY) !== todayStr)
      setIsModal2Open(true);
  };

  const handleCloseModal2 = () => {
    setIsModal2Open(false);
    const todayStr = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(POPUP_MODAL3_KEY) !== todayStr)
      setIsModal3Open(true);
  };

  const handleCloseModal3 = () => {
    setIsModal3Open(false);
  };

  // 모달 하루 숨기기
  const handleHideTodayModal1 = () => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(POPUP_MODAL1_KEY, today);
    handleCloseModal1();
  };

  const handleHideTodayModal2 = () => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(POPUP_MODAL2_KEY, today);
    handleCloseModal2();
  };

  const handleHideTodayModal3 = () => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(POPUP_MODAL3_KEY, today);
    handleCloseModal3();
  };

  const handleDotClick = (index) => {
    setCurrentSlide(index);
  };

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="home-container">
      {/* ===== 홈 검색 ===== */}
      <section className="home-search-section">
        <div className="home-search-inner">
          <form className="home-search-form" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              className="home-search-input"
              placeholder={homePlaceholder}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onFocus={() => {
                setHomePlaceholder("");
                setIsSearchFocused(true);
              }}
              onBlur={() => {
                setHomePlaceholder(SEARCH_PLACEHOLDER);
                setIsSearchFocused(false);
              }}
            />
            <button type="submit" className="home-search-button">
              검색
            </button>
          </form>

          {/* 인기 검색어 */}
          {isSearchFocused && !searchKeyword.trim() && (
            <div className="home-popular-search">
              <span className="home-popular-label">인기 검색어</span>
              <ul className="home-popular-list">
                {POPULAR_KEYWORDS.map((word, idx) => (
                  <li key={word} className="home-popular-item">
                    <button
                      type="button"
                      className="home-popular-btn"
                      onMouseDown={() => handleClickPopular(word)}
                    >
                      <span className="home-popular-rank">{idx + 1}.</span>
                      <span className="home-popular-text">{word}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* ===== 메인 슬라이드 (화살표 제거 버전) ===== */}
      <section className="hero-section">
        <div className="hero-slider">
          {HERO_SLIDES.map((src, idx) => (
            <div
              key={src}
              className={`hero-slide ${idx === currentSlide ? "active" : ""}`}
            >
              <img src={src} alt={`배너 ${idx + 1}`} />
            </div>
          ))}

          {/* 도트 네비게이션만 표시 */}
          <div className="hero-dots">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`hero-dot ${idx === currentSlide ? "active" : ""}`}
                onClick={() => handleDotClick(idx)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== 인기 상품 ===== */}
      <section className="product-section">
        <h2 className="section-title">인기 상품</h2>

        {popularProducts.length === 0 ? (
          <div className="loading">등록된 상품이 없습니다.</div>
        ) : (
          <>
            <div className="product-grid-four">
              {popularProducts.map((product, index) => {
                const isInCompare = compareItems.some(
                  (item) => item.id === product.id
                );

                return (
                  <Link
                    to={`/products/${product.id}`}
                    key={product.id}
                    className={`product-card ${(product.stock === 0 || product.stock === null) ? 'out-of-stock' : ''}`}
                  >
                    <div className="product-image">
                      <img
                        src={getImageUrl(product.thumbnailImage)}
                        alt={product.name}
                        onError={(e) => {
                          e.target.src = "/images/item.png";
                        }}
                      />

                      {/* 품절 표시 */}
                      {(product.stock === 0 || product.stock === null) && (
                        <div className="sold-out-overlay">
                          <div className="sold-out-badge">
                            <span>SOLD OUT</span>
                          </div>
                        </div>
                      )}

                      {/* 순위 배지 */}
                      <div className={`rank-badge rank-${index + 1}`}>
                        {index === 0 && <span className="crown">👑</span>}
                        {index + 1}위
                      </div>

                      {/* 찜하기 버튼 */}
                      <button
                        className={`favorite-btn ${favorites.has(product.id) ? "active" : ""}`}
                        onClick={(e) => handleFavoriteToggle(e, product.id)}
                        title={favorites.has(product.id) ? "찜 취소" : "찜하기"}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill={favorites.has(product.id) ? "currentColor" : "none"}
                          stroke="currentColor"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                    </div>

                    <div className="product-info">
                      <h3 className="product-name">{product.name}</h3>

                      <div className="product-prices">
                        {product.salePrice && product.salePrice < product.price ? (
                          <>
                            <span className="original-price">
                              {formatPrice(product.price)}원
                            </span>
                            <div className="price-row">
                              <span className="sale-price">
                                {formatPrice(product.salePrice)}원
                              </span>
                              <div className="discount-rate">
                                {Math.round(
                                  ((product.price - product.salePrice) / product.price) * 100
                                )}
                                % 할인
                              </div>
                            </div>
                          </>
                        ) : (
                          <span className="sale-price">
                            {formatPrice(product.price)}원
                          </span>
                        )}
                      </div>

                      <button
                        className={`compare-btn-bottom ${isInCompare ? "active" : ""}`}
                        onClick={(e) => handleCompareToggle(e, product)}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="10" />
                          {isInCompare ? (
                            <path d="M9 12l2 2 4-4" />
                          ) : (
                            <path d="M12 8v8M8 12h8" />
                          )}
                        </svg>
                        <span>{isInCompare ? "비교중" : "비교하기"}</span>
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* ===== 추천 상품 ===== */}
      <section className="product-section">
        <h2 className="section-title">추천 상품</h2>

        {products.length === 0 ? (
          <div className="loading">등록된 상품이 없습니다.</div>
        ) : (
          <>
            <div className="product-grid-four">
              {products.map((product) => {
                const isInCompare = compareItems.some(
                  (item) => item.id === product.id
                );

                return (
                  <Link
                    to={`/products/${product.id}`}
                    key={product.id}
                    className={`product-card ${(product.stock === 0 || product.stock === null) ? 'out-of-stock' : ''}`}
                  >
                    <div className="product-image">
                      <img
                        src={getImageUrl(product.thumbnailImage)}
                        alt={product.name}
                        onError={(e) => {
                          e.target.src = "/images/item.png";
                        }}
                      />

                      {/* 품절 표시 */}
                      {(product.stock === 0 || product.stock === null) && (
                        <div className="sold-out-overlay">
                          <div className="sold-out-badge">
                            <span>SOLD OUT</span>
                          </div>
                        </div>
                      )}
  
                        {/* 찜하기 버튼 추가 */}
                        <button
                            className={`favorite-btn ${favorites.has(product.id) ? "active" : ""}`}
                            onClick={(e) => handleFavoriteToggle(e, product.id)}
                            title={favorites.has(product.id) ? "찜 취소" : "찜하기"}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill={favorites.has(product.id) ? "currentColor" : "none"}
                              stroke="currentColor"
                            >
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                          </button>

                      </div>

                    <div className="product-info">
                      <h3 className="product-name">{product.name}</h3>

                      <div className="product-prices">
                        {product.salePrice &&
                        product.salePrice < product.price ? (
                          <>
                            <span className="original-price">
                              {formatPrice(product.price)}원
                            </span>

                            <div className="price-row">
                              <span className="sale-price">
                                {formatPrice(product.salePrice)}원
                              </span>
                              <div className="discount-rate">
                                {Math.round(
                                  ((product.price - product.salePrice) /
                                    product.price) *
                                    100
                                )}
                                % 할인
                              </div>
                            </div>
                          </>
                        ) : (
                          <span className="sale-price">
                            {formatPrice(product.price)}원
                          </span>
                        )}
                      </div>

                      <button
                        className={`compare-btn-bottom ${
                          isInCompare ? "active" : ""
                        }`}
                        onClick={(e) => handleCompareToggle(e, product)}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="10" />
                          {isInCompare ? (
                            <path d="M9 12l2 2 4-4" />
                          ) : (
                            <path d="M12 8v8M8 12h8" />
                          )}
                        </svg>
                        <span>{isInCompare ? "비교중" : "비교하기"}</span>
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="section-footer">
              <Link to="/products" className="btn-more">
                전체 상품 보기
              </Link>
            </div>
          </>
        )}
      </section>

      {/* 1. 모달 1 */}
      {isModal1Open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">첫 번째 팝업 혜택</h4>
              <button
                className="modal-close-btn"
                onClick={handleCloseModal1}
                aria-label="닫기"
              >
                ×
              </button>
            </div>
            <div className="modal-divider" />
            
            <div className="modal-body">
              <div className="modal-main-title">
                <span className="modal-emoji">🎁</span>
                <span className="modal-main-text">첫 번째 특별 혜택!</span>
              </div>
              <p className="modal-sub-text">
                신 상품 10% 할인 쿠폰을 드립니다!
              </p>
              <button className="modal-main-btn" onClick={handleCloseModal1}>
                다음 혜택 보기
              </button>
            </div>
            
            <div className="modal-footer">
              <button className="modal-sub-btn" onClick={handleHideTodayModal1}>
                오늘 하루 보지 않기
              </button>
              <button className="modal-sub-btn" onClick={handleCloseModal1}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. 모달 2 */}
      {isModal2Open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">두 번째 팝업 혜택</h4>
              <button
                className="modal-close-btn"
                onClick={handleCloseModal2}
                aria-label="닫기"
              >
                ×
              </button>
            </div>
            <div className="modal-divider" />
            
            <div className="modal-body">
              <div className="modal-main-title">
                <span className="modal-emoji">💰</span>
                <span className="modal-main-text">가입하면 추가 5,000원 적립!</span>
              </div>
              <p className="modal-sub-text">
                오늘의 큰뜻 상품을 놓치지 마세요.
              </p>
              <button className="modal-main-btn" onClick={handleCloseModal2}>
                다음 공지 보기
              </button>
            </div>
            
            <div className="modal-footer">
              <button className="modal-sub-btn" onClick={handleHideTodayModal2}>
                오늘 하루 보지 않기
              </button>
              <button className="modal-sub-btn" onClick={handleCloseModal2}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. 모달 3 */}
      {isModal3Open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">세 번째 팝업 혜택</h4>
              <button
                className="modal-close-btn"
                onClick={handleCloseModal3}
                aria-label="닫기"
              >
                ×
              </button>
            </div>
            <div className="modal-divider" />
            
            <div className="modal-body">
              <div className="modal-main-title">
                <span className="modal-emoji">🛍️</span>
                <span className="modal-main-text">신규 입점 브랜드!</span>
              </div>
              <p className="modal-sub-text">
                오늘의 추천 상품 목록을 확인하세요.
              </p>
              <button className="modal-main-btn" onClick={handleCloseModal3}>
                메인 페이지로 돌아가기
              </button>
            </div>
            
            <div className="modal-footer">
              <button className="modal-sub-btn" onClick={handleHideTodayModal3}>
                오늘 하루 보지 않기
              </button>
              <button className="modal-sub-btn" onClick={handleCloseModal3}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;

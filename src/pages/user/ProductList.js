import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCompare,
  removeFromCompare,
} from "../../store/slices/compareSlice";
import { favoriteAPI } from "../../api/favoriteApi";
import "./ProductList.css";

const SEARCH_PLACEHOLDER =
  "상품명 또는 카테고리를 검색해 보세요 (예: TV, 냉장고)";

const ProductList = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const compareItems = useSelector((state) => state.compare.items);
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get("keyword");

  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // 페이지 상단 검색 input 값
  const [searchInput, setSearchInput] = useState(keyword || "");
  const [listPlaceholder, setListPlaceholder] = useState(SEARCH_PLACEHOLDER);

  // 찜 상태 관리
  const [favorites, setFavorites] = useState(new Set());

  useEffect(() => {
    setCurrentPage(0);
    fetchProducts();
  }, [category, keyword]);

  useEffect(() => {
    // URL keyword 변경 시 input 값도 동기화
    setSearchInput(keyword || "");
  }, [keyword]);

  useEffect(() => {
    if (allProducts.length > 0) {
      paginateProducts();
    }
  }, [currentPage, allProducts]);

  // 찜 목록 로드
  useEffect(() => {
    const loadFavorites = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setFavorites(new Set());
        return;
      }

      try {
        const response = await favoriteAPI.getList();
        if (response.success) {
          const favoriteIds = new Set(
            response.data.map((fav) => fav.productId)
          );
          setFavorites(favoriteIds);
        }
      } catch (error) {
        console.error("찜 목록 로드 실패:", error);
        setFavorites(new Set());
      }
    };

    loadFavorites();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `http://localhost:8080/user/product/api/all`;

      if (category) {
        url = `http://localhost:8080/user/product/api/category/${encodeURIComponent(
          category
        )}`;
      } else if (keyword) {
        url = `http://localhost:8080/user/product/api/search?keyword=${encodeURIComponent(
          keyword
        )}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        const fetchedProducts = data.products || [];
        setAllProducts(fetchedProducts);
        setTotalElements(fetchedProducts.length);

        const itemsPerPage = 12;
        setTotalPages(Math.ceil(fetchedProducts.length / itemsPerPage));

        const paginatedProducts = fetchedProducts.slice(0, itemsPerPage);
        setProducts(paginatedProducts);
      } else {
        console.error("상품 로드 실패:", data.message);
        setAllProducts([]);
        setProducts([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (error) {
      console.error("상품 로드 오류:", error);
      setAllProducts([]);
      setProducts([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const paginateProducts = () => {
    const itemsPerPage = 12;
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = allProducts.slice(startIndex, endIndex);
    setProducts(paginatedProducts);
  };

  const formatPrice = (price) => {
    return price?.toLocaleString() || "0";
  };

  const getImageUrl = (imagePath) => {
    console.log("원본 imagePath:", imagePath);

    if (!imagePath) return "/images/no-image.png";

    // uploads/ 경로면 백엔드 서버에서 가져오기
    if (imagePath.startsWith("uploads/") || imagePath.startsWith("/uploads/")) {
      return `http://localhost:8080${
        imagePath.startsWith("/") ? "" : "/"
      }${imagePath}`;
    }

    // 짧은 이름이면 public/product_img/ 폴더에서 가져오기
    if (!imagePath.includes("/") && !imagePath.startsWith("http")) {
      return `/product_img/${imagePath}.jpg`;
    }

    return imagePath;
  };

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleCompareToggle = (e, product) => {
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

  const getPageTitle = () => {
    if (category) {
      return `${category} 카테고리`;
    } else if (keyword) {
      return `'${keyword}' 검색 결과`;
    }
    return "전체 상품";
  };

  // 찜하기 토글
  const handleFavoriteToggle = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요합니다.");
      navigate("/login");
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
      console.error("찜하기 실패:", error);
      alert("찜하기 처리 중 오류가 발생했습니다.");
    }
  };

  // 상단 검색창 제출
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (!trimmed) {
      // 공백이면 전체 상품 페이지로 이동할지, 그대로 둘지 선택 가능
      return;
    }
    navigate(`/products?keyword=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="product-list-page">
      <div className="product-list-container">
        <div className="product-list-header">
          <div className="product-list-header-top">
            <div>
              <h1 className="product-list-title">{getPageTitle()}</h1>
              <p className="product-list-count">총 {totalElements}개의 상품</p>
            </div>

            {/* 상단 검색창 */}
            <form className="product-search-form" onSubmit={handleSearchSubmit}>
              <input
                type="text"
                className="product-search-input"
                placeholder={listPlaceholder}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => setListPlaceholder("")}
                onBlur={() => setListPlaceholder(SEARCH_PLACEHOLDER)}
              />
              <button type="submit" className="product-search-button">
                검색
              </button>
            </form>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <p>상품을 불러오는 중...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-container">
            <p>상품이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="product-grid">
              {products.map((product) => {
                const isInCompare = compareItems.some(
                  (item) => item.id === product.id
                );

                return (
                  <div
                    key={product.id}
                    className="product-card"
                    onClick={() => handleProductClick(product.id)}
                  >
                    <div className="product-image-wrapper">
                      <img
                        src={getImageUrl(product.thumbnailImage)}
                        alt={product.name}
                        className={product.stock === 0 ? "out-of-stock" : ""}
                        onError={(e) => {
                          e.target.src = "/images/placeholder.png";
                          e.target.onerror = null;
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
                      
                      {/* 찜하기 버튼 */}
                      <button
                        className={`favorite-btn ${
                          favorites.has(product.id) ? "active" : ""
                        }`}
                        onClick={(e) => handleFavoriteToggle(e, product.id)}
                        title={favorites.has(product.id) ? "찜 취소" : "찜하기"}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill={
                            favorites.has(product.id) ? "currentColor" : "none"
                          }
                          stroke="currentColor"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                    </div>
                    <div className="product-info">
                      <h3 className="product-name">{product.name}</h3>
                      <div className="product-category">{product.category}</div>

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
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  onClick={() => handlePageChange(0)}
                  disabled={currentPage === 0}
                >
                  처음
                </button>
                <button
                  className="page-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  이전
                </button>

                {Array.from({ length: totalPages }, (_, i) => i)
                  .filter((page) => {
                    return (
                      page === 0 ||
                      page === totalPages - 1 ||
                      (page >= currentPage - 2 && page <= currentPage + 2)
                    );
                  })
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="page-ellipsis">...</span>
                      )}
                      <button
                        className={`page-btn ${
                          currentPage === page ? "active" : ""
                        }`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page + 1}
                      </button>
                    </React.Fragment>
                  ))}

                <button
                  className="page-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                >
                  다음
                </button>
                <button
                  className="page-btn"
                  onClick={() => handlePageChange(totalPages - 1)}
                  disabled={currentPage === totalPages - 1}
                >
                  마지막
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductList;

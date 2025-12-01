import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCompare,
  removeFromCompare,
} from "../../store/slices/compareSlice";
import { favoriteAPI } from "../../api/favoriteApi";
import "./ProductCard.css";

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const compareItems = useSelector((state) => state.compare.items);
  const isInCompare = compareItems.some((item) => item.id === product.id);
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  // 컴포넌트 마운트 시 찜 상태 확인
useEffect(() => {
  checkFavoriteStatus();
}, [product.id]);

const checkFavoriteStatus = async () => {
  const token = localStorage.getItem('accessToken');
  
  // 로그인하지 않은 경우
  if (!token) {
    setIsFavorite(false);
    return;
  }
  
  try {
    const response = await favoriteAPI.check(product.id);
    if (response.success) {
      setIsFavorite(response.isFavorite);
    }
  } catch (error) {
    console.error('찜 상태 확인 실패:', error);
    if (error.response?.status === 401) {
      setIsFavorite(false);
    }
  }
};

  // 재고 확인
  const isOutOfStock = product.stock === 0 || product.stock === null;

  const handleClick = () => {
    // 품절인 경우에도 상세 페이지로 이동 가능
    navigate(`/products/${product.id}`);
  };

  const handleCompareToggle = (e) => {
    e.stopPropagation();

    if (isInCompare) {
      dispatch(removeFromCompare(product.id));
    } else {
      if (compareItems.length >= 4) {
        alert("최대 4개 상품까지 비교할 수 있습니다.");
        return;
      }
      dispatch(addToCompare(product));
    }
  };

  const handleFavoriteToggle = async (e) => {
    e.stopPropagation();

    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    if (loading) return;

    setLoading(true);
    try {
      const response = await favoriteAPI.toggle(product.id);
      if (response.success) {
        setIsFavorite(response.isFavorite);
      }
    } catch (error) {
      console.error('찜하기 실패:', error);
      alert('찜하기 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`} onClick={handleClick}>
      <div className="product-image-wrapper">
        <img
          src={`http://localhost:8080${product.image}`}
          alt={product.name}
          className="product-image"
        />
        
        {/* 품절 표시 */}
        {isOutOfStock && (
          <div className="sold-out-overlay">
            <div className="sold-out-badge">
              <span>SOLD OUT</span>
            </div>
          </div>
        )}
        
        {/* 찜하기 버튼 */}
        <button
          className={`favorite-btn ${isFavorite ? "active" : ""}`}
          onClick={handleFavoriteToggle}
          disabled={loading}
          title={isFavorite ? "찜 취소" : "찜하기"}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill={isFavorite ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
        
        {/* 비교 버튼 */}
        <button
          className={`compare-btn ${isInCompare ? "active" : ""}`}
          onClick={handleCompareToggle}
          title={isInCompare ? "비교 취소" : "비교하기"}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
          </svg>
        </button>
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-price">{product.price?.toLocaleString()}원</p>
      </div>
    </div>
  );
};

export default ProductCard;
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
  
  const productId = product.id || product.productId;
  const isInCompare = compareItems.some((item) => item.id === productId);

  // 찜 상태 관리
  const [isFavorite, setIsFavorite] = useState(false);

  // 초기 찜 상태 확인
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        const response = await favoriteAPI.check(productId);
        if (response.success) {
          setIsFavorite(response.isFavorite);
        }
      } catch (error) {
        console.error("찜 상태 확인 오류:", error);
      }
    };

    if (productId) {
      checkFavoriteStatus();
    }
  }, [productId]);

  const handleClick = () => {
    navigate(`/products/${productId}`);
  };

  const handleCompareToggle = (e) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지

    if (isInCompare) {
      dispatch(removeFromCompare(productId));
    } else {
      if (compareItems.length >= 4) {
        alert("최대 4개 상품까지 비교할 수 있습니다.");
        return;
      }
      // 비교하기에 저장할 데이터 정규화
      const compareProduct = {
        ...product,
        id: productId,
        image: product.thumbnailImage || product.image || product.mainImg
      };
      dispatch(addToCompare(compareProduct));
    }
  };

  const handleFavoriteToggle = async (e) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지

    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    try {
      const response = await favoriteAPI.toggle(productId);
      if (response.success) {
        setIsFavorite(response.isFavorite);
      }
    } catch (error) {
      console.error("찜하기 오류:", error);
      alert("찜하기 처리 중 오류가 발생했습니다.");
    }
  };

  const getImageUrl = (imagePath) => {
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

  // 이미지 필드 우선순위: thumbnailImage > image > mainImg
  const imageSource = product.thumbnailImage || product.image || product.mainImg;

  return (
    <div className="product-card" onClick={handleClick}>
      <div className="product-image-wrapper">
        <img
          src={getImageUrl(imageSource)}
          alt={product.name || product.productName}
          className="product-image"
          onError={(e) => {
            e.target.src = "/images/placeholder.png";
            e.target.onerror = null;
          }}
        />

        {/* 찜하기 버튼 */}
        <button
          className={`favorite-btn-card ${isFavorite ? "active" : ""}`}
          onClick={handleFavoriteToggle}
          title={isFavorite ? "찜 취소" : "찜하기"}
        >
          <svg
            viewBox="0 0 24 24"
            fill={isFavorite ? "currentColor" : "none"}
            stroke="currentColor"
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
        <h3 className="product-name">{product.name || product.productName}</h3>
        <p className="product-price">{(product.price || product.salePrice)?.toLocaleString()}원</p>
      </div>
    </div>
  );
};

export default ProductCard;

import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCompare,
  removeFromCompare,
} from "../../store/slices/compareSlice";
import "./ProductCard.css";

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const compareItems = useSelector((state) => state.compare.items);
  const isInCompare = compareItems.some((item) => item.id === product.id);

  const handleClick = () => {
    navigate(`/products/${product.id}`);
  };

  const handleCompareToggle = (e) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지

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

  return (
    <div className="product-card" onClick={handleClick}>
      <div className="product-image-wrapper">
        <img
          src={`http://localhost:8080${product.image}`}
          alt={product.name}
          className="product-image"
        />
        {/* 비교 버튼 추가 */}
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

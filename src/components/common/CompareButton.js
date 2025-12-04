import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCompare,
  removeFromCompare,
} from "../../store/slices/compareSlice";
import "./CompareButton.css";

const CompareButton = ({ product }) => {
  const dispatch = useDispatch();
  const compareItems = useSelector((state) => state.compare.items);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const isInCompare = compareItems.some((item) => item.id === product.id);

  // 로그인하지 않았으면 버튼 숨김
  if (!isLoggedIn) {
    return null;
  }

  const handleCompareToggle = (e) => {
    e.preventDefault();
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

  return (
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
  );
};

export default CompareButton;

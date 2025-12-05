import React, { useState } from "react";
import { useSelector } from "react-redux";
import CompareModal from "../compare/CompareModal";
import "./CompareFloatingButton.css";

const CompareFloatingButton = () => {
  // CompareFloatingButton: 화면 하단에 고정된 플로팅 버튼
  const compareItems = useSelector((state) => state.compare.items);
  // Redux에서 비교 상품 목록 가져오기
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  // 로그인 상태 확인
  const [isModalOpen, setIsModalOpen] = useState(false);
  // isModalOpen: 비교 모달 열림 상태
  // 초기값: false (닫힘)

  // 비로그인 상태이거나 상품이 없으면 버튼 숨김
  if (!isAuthenticated || compareItems.length === 0) return null;
  // compareItems.length === 0: 비교 상품이 없으면
  // return null: 아무것도 렌더링하지 않음
  // 버튼 숨김

  const handleClick = () => {
    setIsModalOpen(true);
    // 모달 열기
  };

  const handleClose = () => {
    setIsModalOpen(false);
    // 모달 닫기
  };

  return (
    <>
      <div className="compare-floating-btn" onClick={handleClick}>
        {/* compare-floating-btn: 플로팅 버튼 */}
        {/* onClick: 클릭 시 모달 열기 */}
        <div className="compare-icon">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
          </svg>
        </div>
        <div className="compare-count">{compareItems.length}</div>
        {/* 비교 상품 개수 표시 */}
        {/* 예: compareItems.length = 2 → "2" */}
        <div className="compare-text">상품비교</div>
        {/* 버튼 텍스트 */}
      </div>

      <CompareModal isOpen={isModalOpen} onClose={handleClose} />
      {/* CompareModal: 비교 모달 컴포넌트 */}
      {/* isOpen: 모달 열림 상태 */}
      {/* onClose: 모달 닫기 함수 */}
    </>
  );
};

export default CompareFloatingButton;

import React from 'react';
import { useParams } from 'react-router-dom';

const ReviewDetail = () => {
  const { id } = useParams();
  
  return (
    <div className="review-detail-container">
      <h2>리뷰 상세</h2>
      <p>리뷰 ID: {id}</p>
      <p>리뷰 상세 페이지입니다. (개발 중)</p>
    </div>
  );
};

export default ReviewDetail;

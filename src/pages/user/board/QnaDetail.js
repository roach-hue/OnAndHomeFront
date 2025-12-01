import React from 'react';
import { useParams } from 'react-router-dom';

const QnaDetail = () => {
  const { id } = useParams();
  
  return (
    <div className="qna-detail-container">
      <h2>Q&A 상세</h2>
      <p>Q&A ID: {id}</p>
      <p>Q&A 상세 페이지입니다. (개발 중)</p>
    </div>
  );
};

export default QnaDetail;

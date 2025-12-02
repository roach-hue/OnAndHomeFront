import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import axios from "axios";
import "./QnaList.css";

const QnaList = () => {
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

  const [qnaList, setQnaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchQnaList();
  }, []);

  const fetchQnaList = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/qna`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      console.log("Q&A 목록 응답:", response.data);

      if (response.data && Array.isArray(response.data)) {
        setQnaList(response.data);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        setQnaList(response.data.data);
      } else {
        setQnaList([]);
      }
    } catch (error) {
      console.error("Q&A 목록 조회 실패:", error);
      alert("Q&A 목록을 불러오는데 실패했습니다.");
      setQnaList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchQnaList();
  };

  const handleRowClick = (qnaId) => {
    navigate(`/admin/qna/${qnaId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";

    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch {
      return dateString;
    }
  };

  // 검색어 필터링
  const filteredQnaList = qnaList.filter((qna) => {
    if (!searchKeyword.trim()) return true;

    const keyword = searchKeyword.toLowerCase();
    return (
      qna.title?.toLowerCase().includes(keyword) ||
      qna.question?.toLowerCase().includes(keyword) ||
      qna.writer?.toLowerCase().includes(keyword) ||
      qna.productName?.toLowerCase().includes(keyword)
    );
  });

  // 페이지네이션
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredQnaList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredQnaList.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="admin-qna-list">
      <AdminSidebar />

      <div className="qna-list-main">
        <div className="page-header">
          <h1>Q&A 관리</h1>

          <div className="search-box">
            <input
              type="text"
              placeholder="제목 또는 작성자를 입력하세요"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <button onClick={handleSearch} className="search-btn">
              🔍
            </button>
          </div>
        </div>

        {/* Q&A 목록 테이블 */}
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: "80px" }}>번호</th>
                <th style={{ width: "200px" }}>상품명</th>
                <th>제목</th>
                <th style={{ width: "120px" }}>작성자</th>
                <th style={{ width: "150px" }}>작성일자</th>
                <th style={{ width: "100px" }}>답변상태</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data">
                    Q&A가 없습니다.
                  </td>
                </tr>
              ) : (
                currentItems.map((qna, index) => (
                  <tr
                    key={qna.id}
                    onClick={() => handleRowClick(qna.id)}
                    className="clickable-row"
                  >
                    <td>
                      {filteredQnaList.length - (indexOfFirstItem + index)}
                    </td>
                    <td className="text-left">{qna.productName || "-"}</td>
                    <td className="text-left">
                      {qna.isPrivate && (
                        <span className="private-icon" title="비밀글">
                          🔒
                        </span>
                      )}
                      {qna.title || qna.question}
                    </td>
                    <td>{qna.writer || "-"}</td>
                    <td>{formatDate(qna.createdAt)}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          qna.replies && qna.replies.length > 0
                            ? "answered"
                            : "pending"
                        }`}
                      >
                        {qna.replies && qna.replies.length > 0
                          ? "답변완료"
                          : "미답변"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="page-button"
            >
              이전
            </button>

            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => handlePageChange(index + 1)}
                className={`page-button ${
                  currentPage === index + 1 ? "active" : ""
                }`}
              >
                {index + 1}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="page-button"
            >
              다음
            </button>
          </div>
        )}

        {/* 통계 정보 */}
        <div className="qna-stats">
          <p>전체 Q&A: {filteredQnaList.length}개</p>
          <p>
            미답변:{" "}
            {
              filteredQnaList.filter(
                (q) => !q.replies || q.replies.length === 0
              ).length
            }
            개 / 답변완료:{" "}
            {
              filteredQnaList.filter((q) => q.replies && q.replies.length > 0)
                .length
            }
            개
          </p>
        </div>
      </div>
    </div>
  );
};

export default QnaList;

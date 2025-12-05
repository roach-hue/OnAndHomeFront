import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import apiClient from "../../api/axiosConfig";
import "./UserList.css";

const DeletedUserList = () => {
  const navigate = useNavigate();

  // 탈퇴 회원 목록 상태
  const [users, setUsers] = useState([]);

  // 로딩 상태 (API 요청 중)
  const [loading, setLoading] = useState(false);

  // 검색어
  const [searchTerm, setSearchTerm] = useState("");

  // 페이징 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 컴포넌트 첫 렌더링 시 탈퇴 회원 목록 불러오기
  useEffect(() => {
    fetchDeletedUsers();
  }, []);

  // 탈퇴 회원 목록 조회 (검색 포함)
  const fetchDeletedUsers = async () => {
    setLoading(true);
    try {
      // 검색 파라미터 구성
      const params = new URLSearchParams();
      if (searchTerm && searchTerm.trim()) {
        params.append("kw", searchTerm.trim());
      }

      const url = `/api/admin/users/deleted${
        params.toString() ? "?" + params.toString() : ""
      }`;

      const response = await apiClient.get(url);

      // API 결과를 화면용 데이터로 변환
      if (response.data && Array.isArray(response.data)) {
        const mappedUsers = response.data.map((user, index) => ({
          ...user,
          no: (currentPage - 1) * itemsPerPage + index + 1, // 목록 번호
        }));

        setUsers(mappedUsers);
      } else {
        setUsers([]);
      }
    } catch (error) {
      // 오류 메시지 처리
      console.error("탈퇴 회원 목록 조회 오류:", error);
      if (error.response) {
        if (error.response.status === 401) {
          alert("인증이 만료되었습니다. 다시 로그인해주세요.");
        } else if (error.response.status === 403) {
          // 403 오류는 백엔드 API가 없거나 권한 설정 문제
          console.warn(
            "403 오류: 백엔드 API 권한 확인 필요 (/api/admin/users/deleted)"
          );
          // 빈 배열로 처리하고 에러 메시지 표시 안함
        } else {
          alert("탈퇴 회원 목록을 불러오는데 실패했습니다.");
        }
      } else {
        alert("서버에 연결할 수 없습니다.");
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // 검색 실행
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDeletedUsers();
  };

  // 페이지 변경
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 날짜 포맷 YYYY-MM-DD
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch {
      return dateString;
    }
  };

  // 전화번호 포맷
  const formatPhone = (phone) => {
    if (!phone) return "-";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(
        7
      )}`;
    } else if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(
        6
      )}`;
    }
    return phone;
  };

  // 성별 포맷
  const formatGender = (gender) => {
    if (!gender) return "-";
    if (gender.toUpperCase() === "MALE" || gender === "남자" || gender === "M")
      return "남자";
    if (
      gender.toUpperCase() === "FEMALE" ||
      gender === "여자" ||
      gender === "F"
    )
      return "여자";
    return gender;
  };

  // 페이지네이션 계산
  const totalPages = Math.max(1, Math.ceil(users.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = users.slice(startIndex, endIndex);

  return (
    <div className="admin-user-list">
      <AdminSidebar />

      <div className="user-list-main">
        <div className="page-header">
          <h1>탈퇴 회원 목록</h1>

          {/* 검색 입력창 */}
          <div className="search-box">
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="이름 또는 아이디를 입력하세요"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="search-btn">
                🔍
              </button>
            </form>
          </div>
        </div>

        {/* 로딩 화면 */}
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner">로딩 중...</div>
          </div>
        )}

        {/* 회원 테이블 */}
        <div className="user-table-container">
          <table className="user-table">
            <thead>
              <tr>
                <th style={{ width: "80px" }}>No</th>
                <th>이름</th>
                <th>ID</th>
                <th>성별</th>
                <th>연락처</th>
                <th>생년월일</th>
                <th>가입일자</th>
                <th>탈퇴일자</th>
              </tr>
            </thead>

            <tbody>
              {currentUsers.length > 0 ? (
                currentUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.no}</td>
                    <td>{user.username || "-"}</td>
                    <td>{user.userId || user.email || "-"}</td>
                    <td>{formatGender(user.gender)}</td>
                    <td>{formatPhone(user.phone)}</td>
                    <td>{formatDate(user.birthDate)}</td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>{formatDate(user.deletedAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="no-data">
                    {loading ? "로딩 중..." : "탈퇴한 회원이 없습니다."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div
          className="table-footer"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px 30px",
            background: "white",
            borderTop: "1px solid #e0e0e0",
            borderRadius: "0 0 8px 8px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            marginTop: "-8px",
          }}
        >
          <div className="pagination">
            <button
              className="page-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
            >
              이전
            </button>
            <span className="page-info">
              {currentPage} / {totalPages}
            </span>
            <button
              className="page-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeletedUserList;

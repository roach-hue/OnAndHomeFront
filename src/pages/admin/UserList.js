import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import "./UserList.css";

const UserList = () => {
  const navigate = useNavigate();

  // 회원 목록 상태
  const [users, setUsers] = useState([]);

  // 로딩 상태 (API 요청 중)
  const [loading, setLoading] = useState(false);

  // 전체 선택 체크박스 상태
  const [selectAll, setSelectAll] = useState(false);

  // 검색어
  const [searchTerm, setSearchTerm] = useState("");

  // 페이징 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // API 기본 URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

  // 컴포넌트 첫 렌더링 시 회원 목록 불러오기
  useEffect(() => {
    fetchUsers();
  }, []);

  // 회원 목록 조회 (검색 포함)
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // 검색 파라미터 구성
      const params = new URLSearchParams();
      if (searchTerm && searchTerm.trim()) {
        params.append("kw", searchTerm.trim());
      }

      const url = `${API_BASE_URL}/api/admin/users${
        params.toString() ? "?" + params.toString() : ""
      }`;

      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      // API 결과를 화면용 데이터로 변환
      if (response.data && Array.isArray(response.data)) {
        const mappedUsers = response.data.map((user, index) => ({
          ...user,
          checked: false, // 개별 선택 체크박스 기본값
          no: (currentPage - 1) * itemsPerPage + index + 1, // 목록 번호
        }));

        setUsers(mappedUsers);
      } else {
        setUsers([]);
      }
    } catch (error) {
      // 오류 메시지 처리
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          alert("인증 오류: 다시 로그인해주세요.");
        } else {
          alert("회원 목록을 불러오는데 실패했습니다.");
        }
      } else {
        alert("서버에 연결할 수 없습니다.");
      }
      setUsers([]);
    } finally {
      setLoading(false);
      setSelectAll(false);
    }
  };

  // 전체 선택 체크박스 클릭 시 모든 회원 선택/해제
  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    setUsers(users.map((user) => ({ ...user, checked })));
  };

  // 개별 회원 선택
  const handleSelectUser = (userId) => {
    const updatedUsers = users.map((user) =>
      user.id === userId ? { ...user, checked: !user.checked } : user
    );

    setUsers(updatedUsers);

    // 모든 항목이 선택되면 selectAll 체크 활성화
    const allChecked = updatedUsers.every((user) => user.checked);
    setSelectAll(allChecked);
  };

  // 검색 실행
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  // 선택된 회원 삭제 (다중 삭제)
  const handleDeleteSelected = async () => {
    const selectedUsers = users.filter((user) => user.checked);

    if (selectedUsers.length === 0) {
      alert("삭제할 회원을 선택해주세요.");
      return;
    }

    if (
      !window.confirm(
        `선택한 ${selectedUsers.length}명의 회원을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      const userIds = selectedUsers.map((user) => user.id);

      const response = await axios.post(
        `${API_BASE_URL}/api/admin/users/delete`,
        { ids: userIds },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (response.data && response.data.success) {
        alert(response.data.message);
        await fetchUsers(); // 목록 새로고침
      } else {
        alert(response.data.message || "회원 삭제에 실패했습니다.");
      }
    } catch (error) {
      if (error.response?.status === 403) {
        alert("회원 삭제 권한이 없습니다.");
      } else if (error.response?.status === 404) {
        alert("일부 회원을 찾을 수 없습니다.");
        fetchUsers();
      } else {
        alert("회원 삭제 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
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

  // 성별 포맷 (KOR/ENG/M/F/Male/Female 모두 처리)
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
          <h1>User List</h1>

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
                {/* 전체 선택 체크박스 */}
                <th style={{ width: "50px" }}>
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    disabled={currentUsers.length === 0}
                  />
                </th>
                <th style={{ width: "80px" }}>No</th>
                <th>이름</th>
                <th>ID</th>
                <th>성별</th>
                <th>연락처</th>
                <th>생년월일</th>
                <th>가입일자</th>
              </tr>
            </thead>

            <tbody>
              {currentUsers.length > 0 ? (
                currentUsers.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => navigate(`/admin/users/${user.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* 개별 선택 체크박스 */}
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={user.checked || false}
                        onChange={() => handleSelectUser(user.id)}
                      />
                    </td>
                    <td>{user.no}</td>
                    <td>{user.username || "-"}</td>
                    <td>{user.userId || user.email || "-"}</td>
                    <td>{formatGender(user.gender)}</td>
                    <td>{formatPhone(user.phone)}</td>
                    <td>{formatDate(user.birthDate)}</td>
                    <td>{formatDate(user.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="no-data">
                    {loading ? "로딩 중..." : "등록된 회원이 없습니다."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 삭제 버튼 + 페이지네이션 */}
        <div
          className="table-footer"
          style={{
            display: "flex !important",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px 30px",
            background: "white",
            borderTop: "1px solid #e0e0e0",
            borderRadius: "0 0 8px 8px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            marginTop: "-8px",
            position: "relative",
          }}
        >
          {/* 선택 회원 삭제 */}
          <button
            className="user-list-delete-btn"
            style={{
              padding: "10px 30px",
              background: "#ff4444",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s",
              position: "absolute",
              left: "30px",
            }}
            onClick={handleDeleteSelected}
          >
            삭제
          </button>

          {/* 페이지네이션 */}
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

export default UserList;

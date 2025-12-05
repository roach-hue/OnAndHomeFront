import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import axios from "axios";
import "./UserDetail.css";

const UserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // 수정 폼 상태
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    phone: "",
    address: "",
    detailAddress: "",
    gender: "",
    birthDate: "",
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

  // Daum 주소 API 스크립트 로드
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // 주소 검색 팝업
  const handleAddressSearch = () => {
    new window.daum.Postcode({
      oncomplete: function (data) {
        let fullAddress = data.address;
        let extraAddress = "";

        if (data.addressType === "R") {
          if (data.bname !== "") {
            extraAddress += data.bname;
          }
          if (data.buildingName !== "") {
            extraAddress +=
              extraAddress !== ""
                ? ", " + data.buildingName
                : data.buildingName;
          }
          fullAddress += extraAddress !== "" ? " (" + extraAddress + ")" : "";
        }

        setEditForm((prev) => ({
          ...prev,
          address: fullAddress,
        }));
      },
    }).open();
  };

  useEffect(() => {
    fetchUserDetail();
  }, [userId]);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (response.data) {
        setUserInfo(response.data);

        // 주소 분리
        const fullAddress = response.data.address || "";
        const addressParts = fullAddress.split("|");

        setEditForm({
          username: response.data.username || "",
          email: response.data.email || "",
          phone: response.data.phone || "",
          address: addressParts[0] || "",
          detailAddress: addressParts[1] || "",
          gender: response.data.gender || "",
          birthDate: response.data.birthDate || "",
        });
      }
    } catch (err) {
      console.error("회원 상세 정보 조회 오류:", err);
      setError("회원 상세 정보 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      const fullAddress = userInfo.address || "";
      const addressParts = fullAddress.split("|");

      setEditForm({
        username: userInfo.username || "",
        email: userInfo.email || "",
        phone: userInfo.phone || "",
        address: addressParts[0] || "",
        detailAddress: addressParts[1] || "",
        gender: userInfo.gender || "",
        birthDate: userInfo.birthDate || "",
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveInfo = async () => {
    if (!window.confirm("회원 정보를 수정하시겠습니까?")) {
      return;
    }

    try {
      // 주소와 상세주소를 합침
      const fullAddress = editForm.detailAddress
        ? `${editForm.address}|${editForm.detailAddress}`
        : editForm.address;

      const updateData = {
        username: editForm.username,
        email: editForm.email,
        phone: editForm.phone,
        gender: editForm.gender,
        birthDate: editForm.birthDate,
        address: fullAddress,
      };

      console.log("수정 정보:", updateData);

      const response = await axios.post(
        `${API_BASE_URL}/api/admin/users/${userId}/update`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("수정 완료:", response.data);

      if (response.data.success) {
        alert("회원 정보가 수정되었습니다.");
        setIsEditing(false);
        fetchUserDetail(); // 최신 정보 다시 조회
      } else {
        alert(response.data.message || "회원 정보 수정에 실패했습니다.");
      }
    } catch (err) {
      console.error("회원 정보 수정 오류:", err);
      console.error("수정 실패 이유:", err.response);
      alert(err.response?.data?.message || "회원 정보 수정에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("정말 이 회원을 탈퇴 처리하시겠습니까?")) {
      return;
    }

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/admin/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (response.data && response.data.success) {
        alert("회원 탈퇴 처리가 완료되었습니다.");
        navigate("/admin/users");
      } else {
        alert(response.data.message || "회원 탈퇴 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("회원 탈퇴 처리 중 오류가 발생했습니다.", error);
      alert("회원 탈퇴 처리 중 오류가 발생했습니다.");
    }
  };

  const formatGender = (gender) => {
    if (!gender) return "-";
    if (gender === "M" || gender === "MALE" || gender === "남자") return "남성";
    if (gender === "F" || gender === "FEMALE" || gender === "여자")
      return "여성";
    if (gender === "O") return "기타";
    return gender;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("ko-KR");
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="admin-user-detail">
        <AdminSidebar />
        <div className="user-detail-main">
          <div className="loading">로딩 중입니다...</div>
        </div>
      </div>
    );
  }

  if (error || !userInfo) {
    return (
      <div className="admin-user-detail">
        <AdminSidebar />
        <div className="user-detail-main">
          <div className="error">
            {error || "회원 상세 정보 조회에 실패했습니다."}
          </div>
          <button className="btn-back" onClick={() => navigate("/admin/users")}>
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-user-detail">
      <AdminSidebar />

      <div className="user-detail-main">
        <div className="user-detail-header">
          <h1>회원 상세 정보</h1>
          <div className="header-buttons">
            <button
              className={`btn-edit ${isEditing ? "editing" : ""}`}
              onClick={handleEditToggle}
            >
              {isEditing ? "취소" : "수정"}
            </button>
            <button className="btn-delete" onClick={handleDelete}>
              탈퇴
            </button>
            <button
              className="btn-back"
              onClick={() => navigate("/admin/users")}
            >
              목록으로
            </button>
          </div>
        </div>

        <div className="user-detail-content">
          <div className="user-detail-card">
            <div className="detail-section">
              <h2>회원 상세 정보</h2>

              <div className="detail-row">
                <label>아이디</label>
                <div className="detail-value">{userInfo.userId || "-"}</div>
              </div>

              <div className="detail-row">
                <label>이름</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="username"
                    value={editForm.username}
                    onChange={handleInputChange}
                    className="detail-input"
                  />
                ) : (
                  <div className="detail-value">{userInfo.username || "-"}</div>
                )}
              </div>

              <div className="detail-row">
                <label>이메일</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleInputChange}
                    className="detail-input"
                  />
                ) : (
                  <div className="detail-value">{userInfo.email || "-"}</div>
                )}
              </div>

              <div className="detail-row">
                <label>전화번호</label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={editForm.phone}
                    onChange={handleInputChange}
                    className="detail-input"
                    placeholder="010-1234-5678"
                  />
                ) : (
                  <div className="detail-value">{userInfo.phone || "-"}</div>
                )}
              </div>

              <div className="detail-row">
                <label>성별</label>
                {isEditing ? (
                  <select
                    name="gender"
                    value={editForm.gender}
                    onChange={handleInputChange}
                    className="detail-input"
                  >
                    <option value="">선택</option>
                    <option value="M">남성</option>
                    <option value="F">여성</option>
                    <option value="O">기타</option>
                  </select>
                ) : (
                  <div className="detail-value">
                    {formatGender(userInfo.gender)}
                  </div>
                )}
              </div>

              <div className="detail-row">
                <label>생년월일</label>
                {isEditing ? (
                  <input
                    type="date"
                    name="birthDate"
                    value={editForm.birthDate}
                    onChange={handleInputChange}
                    className="detail-input"
                  />
                ) : (
                  <div className="detail-value">
                    {userInfo.birthDate || "-"}
                  </div>
                )}
              </div>

              <div className="detail-row">
                <label>주소</label>
                {isEditing ? (
                  <div className="address-container">
                    <div className="address-input-wrapper">
                      <input
                        type="text"
                        name="address"
                        value={editForm.address}
                        className="detail-input address-input"
                        placeholder="주소를 검색하세요"
                        onClick={handleAddressSearch}
                        readOnly
                        style={{ cursor: "pointer" }}
                      />
                      <button
                        type="button"
                        className="btn-address-search"
                        onClick={handleAddressSearch}
                      >
                        주소 검색
                      </button>
                    </div>
                    <input
                      type="text"
                      name="detailAddress"
                      value={editForm.detailAddress}
                      onChange={handleInputChange}
                      className="detail-input detail-address-input"
                      placeholder="상세 주소를 입력하세요 (예: 101동 202호)"
                    />
                  </div>
                ) : (
                  <div className="detail-value">
                    {userInfo.address
                      ? userInfo.address.replace("|", " ")
                      : "-"}
                  </div>
                )}
              </div>

              <div className="detail-row">
                <label>가입일</label>
                <div className="detail-value">
                  {formatDate(userInfo.createdAt)}
                </div>
              </div>

              {isEditing && (
                <div className="edit-actions">
                  <button className="btn-save" onClick={handleSaveInfo}>
                    정보 수정
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 회원 통계 정보 */}
          <div className="user-stats-card">
            <h3>회원 활동 정보</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-icon">📦</div>
                <div className="stat-label">총 주문</div>
                <div className="stat-value">{userInfo.orderCount || 0}건</div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">💰</div>
                <div className="stat-label">총 구매금액</div>
                <div className="stat-value">
                  {(userInfo.totalPurchase || 0).toLocaleString()}원
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">⭐</div>
                <div className="stat-label">리뷰 작성</div>
                <div className="stat-value">{userInfo.reviewCount || 0}건</div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">❓</div>
                <div className="stat-label">문의 작성</div>
                <div className="stat-value">{userInfo.qnaCount || 0}건</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;

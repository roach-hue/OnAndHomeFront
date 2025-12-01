import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import "./QnaDetail.css";

const QnaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

  const [qna, setQna] = useState(null);
  const [loading, setLoading] = useState(true);

  // 답변 등록용
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 답변 수정용
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editReplyContent, setEditReplyContent] = useState("");

  useEffect(() => {
    fetchQnaDetail();
  }, [id]);

  const fetchQnaDetail = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/qna/${id}`);
      const data = response.data.data || response.data;
      setQna(data);
    } catch {
      alert("Q&A 정보 조회 실패");
      navigate("/admin/qna");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // 답변 등록
  // -------------------------
  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return alert("답변을 입력하세요.");

    if (!window.confirm("답변을 등록하시겠습니까?")) return;

    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/admin/qna/${id}/reply`,
        {
          content: replyContent,
          responder: "Admin",
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (res.data.success) {
        alert("답변 등록 완료");
        setReplyContent("");
        fetchQnaDetail();
      }
    } catch {
      alert("답변 등록 중 오류 발생");
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------
  // 답변 수정 시작
  // -------------------------
  const handleEditReply = (reply) => {
    setEditingReplyId(reply.id);
    setEditReplyContent(reply.content);
  };

  // -------------------------
  // 답변 수정 저장
  // -------------------------
  const handleSaveReply = async (replyId) => {
    if (!editReplyContent.trim()) {
      alert("답변 내용을 입력하세요.");
      return;
    }

    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/admin/qna/reply/${replyId}`,
        { content: editReplyContent },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (res.data.success) {
        alert("답변 수정 완료");
        setEditingReplyId(null);
        fetchQnaDetail();
      }
    } catch (e) {
      alert("답변 수정 실패");
    }
  };

  // -------------------------
  // 답변 수정 취소
  // -------------------------
  const handleCancelReply = () => {
    setEditingReplyId(null);
    setEditReplyContent("");
  };

  // -------------------------
  // 답변 삭제
  // -------------------------
  const handleDeleteReply = async (replyId) => {
    if (!window.confirm("답변을 삭제하시겠습니까?")) return;

    try {
      const res = await axios.delete(
        `${API_BASE_URL}/api/admin/qna/reply/${replyId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (res.data.success) {
        alert("삭제 성공");
        fetchQnaDetail();
      }
    } catch {
      alert("삭제 실패");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";

    try {
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(date.getDate()).padStart(2, "0")} ${String(
        date.getHours()
      ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    } catch {
      return dateString;
    }
  };

  const handleGoToProduct = () => {
    if (qna?.productId) {
      window.open(`/products/${qna.productId}`, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="admin-qna-detail">
        <AdminSidebar />
        <div className="qna-detail-main">
          <div className="loading">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-qna-detail">
      <AdminSidebar />
      <div className="qna-detail-main">
        {/* 헤더 */}
        <div className="page-header">
          <h1>Q&A 상세</h1>
          <button
            className="back-button"
            onClick={() => navigate("/admin/qna")}
          >
            목록으로
          </button>
        </div>

        {/* Q&A 본문 카드 */}
        <div className="qna-detail-card">
          <table className="detail-table">
            <tbody>
              <tr>
                <th>번호</th>
                <td>{qna.id}</td>
              </tr>
              <tr>
                <th>상품명</th>
                <td>
                  {qna.productName ? (
                    <span className="product-link" onClick={handleGoToProduct}>
                      {qna.productName} <span className="link-icon">🔗</span>
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
              <tr>
                <th>작성일자</th>
                <td>{formatDate(qna.createdAt)}</td>
              </tr>
              <tr>
                <th>작성자</th>
                <td>{qna.writer}</td>
              </tr>
              <tr>
                <th>제목</th>
                <td>
                  {qna.isPrivate && (
                    <span className="private-icon" title="비밀글">
                      🔒{" "}
                    </span>
                  )}
                  {qna.title}
                </td>
              </tr>
              <tr>
                <th>질문 내용</th>
                <td className="content-cell">
                  <div className="content-box">{qna.question}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 답변 목록 */}
        {qna.replies?.length > 0 && (
          <div className="replies-section">
            <h3>답변 목록</h3>

            {qna.replies.map((reply) => (
              <div className="reply-card" key={reply.id}>
                <div className="reply-header">
                  <span className="reply-author">
                    {reply.responder || "Admin"}
                  </span>
                  <span className="reply-date">
                    {formatDate(reply.createdAt)}
                  </span>
                </div>

                {/* 수정 모드 */}
                {editingReplyId === reply.id ? (
                  <>
                    <textarea
                      className="reply-edit-textarea"
                      value={editReplyContent}
                      onChange={(e) => setEditReplyContent(e.target.value)}
                      rows={4}
                    />

                    <div className="reply-actions">
                      <button
                        className="cancel-button"
                        onClick={handleCancelReply}
                      >
                        취소
                      </button>
                      <button
                        className="save-button"
                        onClick={() => handleSaveReply(reply.id)}
                      >
                        저장
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="reply-content">{reply.content}</div>

                    <div className="reply-actions">
                      <button
                        className="edit-button"
                        onClick={() => handleEditReply(reply)}
                      >
                        수정
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => handleDeleteReply(reply.id)}
                      >
                        삭제
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 답변 등록 */}
        <div className="reply-form-section">
          <h3>답변 등록</h3>
          <div className="reply-form">
            <textarea
              placeholder="답변을 입력하세요"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows="6"
              className="reply-textarea"
            />
            <div className="form-actions">
              <button
                className="cancel-button"
                onClick={() => navigate("/admin/qna")}
              >
                목록
              </button>
              <button
                className="submit-button"
                disabled={submitting}
                onClick={handleSubmitReply}
              >
                {submitting ? "등록 중..." : "답변등록"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QnaDetail;

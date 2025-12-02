import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import "./QnaItem.css";

const QnaItem = ({ qna, onEdit, onDelete }) => {
  const { user } = useSelector((state) => state.user);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(qna.title || "상품 문의");
  const [editedQuestion, setEditedQuestion] = useState(qna.question);
  const [editedIsPrivate, setEditedIsPrivate] = useState(
    qna.isPrivate || false
  );

  // 디버깅 로그
  useEffect(() => {
    console.log("=== QnaItem 디버깅 ===");
    console.log("QnA 전체 데이터:", qna);
    console.log("isPrivate 값:", qna.isPrivate);
    console.log("isPrivate 타입:", typeof qna.isPrivate);
    console.log("로그인 사용자:", user);
    console.log("QnA 작성자:", qna.writer);
    console.log("사용자 ID:", user?.userId);
    console.log("사용자 이름:", user?.username);
    console.log("사용자 role:", user?.role);
  }, [qna, user]);

  // 현재 로그인한 사용자가 작성자인지 확인
  const isAuthor =
    user && (qna.writer === user.userId || qna.writer === user.username);

  // 관리자인지 확인
  const isAdmin =
    user && (user.role === 0 || user.role === "0" || Number(user.role) === 0);

  // 비밀글인지 확인
  const isPrivatePost = qna.isPrivate === true;

  // 비밀글 열람 권한 체크
  const canView = !isPrivatePost || isAuthor || isAdmin;

  console.log("isAuthor:", isAuthor);
  console.log("isAdmin:", isAdmin);
  console.log("isPrivatePost:", isPrivatePost);
  console.log("canView:", canView);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedTitle(qna.title || "상품 문의");
    setEditedQuestion(qna.question);
    setEditedIsPrivate(qna.isPrivate || false);
  };

  const handleSaveEdit = async () => {
    if (!editedQuestion.trim()) {
      alert("문의 내용을 입력해주세요.");
      return;
    }

    try {
      await onEdit(qna.id, {
        title: editedTitle,
        question: editedQuestion,
        isPrivate: editedIsPrivate,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("QnA 수정 오류:", error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("정말 이 문의를 삭제하시겠습니까?")) {
      try {
        await onDelete(qna.id);
      } catch (error) {
        console.error("QnA 삭제 오류:", error);
      }
    }
  };

  return (
    <div className="qna-item-wrapper">
      <div className="qna-item">
        {isEditing ? (
          <div className="qna-edit-form">
            <input
              type="text"
              className="qna-edit-title"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              placeholder="제목을 입력하세요"
            />
            <textarea
              className="qna-edit-textarea"
              value={editedQuestion}
              onChange={(e) => setEditedQuestion(e.target.value)}
              placeholder="문의 내용을 입력하세요"
            />
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={editedIsPrivate}
                onChange={(e) => setEditedIsPrivate(e.target.checked)}
              />
              <span>비밀글로 작성</span>
            </label>
            <div className="qna-edit-actions">
              <button onClick={handleSaveEdit} className="btn-save">
                저장
              </button>
              <button onClick={handleCancelEdit} className="btn-cancel">
                취소
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="qna-header">
              <span className="qna-badge">Q</span>
              {isPrivatePost && (
                <span
                  className="private-badge"
                  style={{ fontSize: "18px", marginLeft: "8px" }}
                >
                  🔒
                </span>
              )}
              <span className="qna-title">{qna.title || "상품 문의"}</span>
              <div className="qna-info">
                <span className="qna-author">{qna.writer || "익명"}</span>
                {qna.createdAt && (
                  <span className="qna-date">
                    {new Date(qna.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {canView ? (
              <>
                <div className="qna-question">{qna.question}</div>
                {isAuthor && (
                  <div className="qna-actions">
                    <button onClick={handleEdit} className="btn-edit">
                      수정
                    </button>
                    <button onClick={handleDelete} className="btn-delete">
                      삭제
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="private-message">
                🔒 비밀글입니다. 작성자만 확인할 수 있습니다.
              </div>
            )}
          </>
        )}
      </div>

      {/* 답변 표시 */}
      {qna.replies && qna.replies.length > 0 && !isEditing && canView && (
        <div className="qna-replies">
          {qna.replies.map((reply, index) => (
            <div key={index} className="qna-reply">
              <span className="reply-badge">A</span>
              <div className="reply-content">
                <div className="reply-text">{reply.content}</div>
                <div className="reply-info">
                  <span className="reply-author">
                    {reply.responder || "관리자"}
                  </span>
                  {reply.createdAt && (
                    <span className="reply-date">
                      {new Date(reply.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QnaItem;

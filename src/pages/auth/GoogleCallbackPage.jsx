import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loginSuccess } from "../../store/slices/authSlice";

const GoogleCallbackPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("구글 로그인 처리 중...");

  // StrictMode 대비: 두 번 실행 방지용
  const isCalled = useRef(false);

  useEffect(() => {
    if (isCalled.current) return;
    isCalled.current = true;

    const handleGoogleCallback = async () => {
      const code = searchParams.get("code");

      if (!code) {
        setMessage("구글 로그인에 실패했습니다.");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:8080/api/auth/google/callback?code=${code}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (data.success) {
          // 구글 로그인 성공 시 토큰 저장
          const googleAccessToken = "google_" + data.user.userId;

          dispatch(
            loginSuccess({
              accessToken: googleAccessToken,
              user: data.user,
            })
          );

          sessionStorage.setItem("accessToken", googleAccessToken);
          sessionStorage.setItem("user", JSON.stringify(data.user));

          setMessage("로그인 성공! 메인 페이지로 이동합니다...");
          setTimeout(() => navigate("/"), 1000);
        } else {
          setMessage(data.message || "구글 로그인에 실패했습니다.");
          setTimeout(() => navigate("/login"), 2000);
        }
      } catch (error) {
        console.error("구글 로그인 처리 중 오류:", error);
        setMessage("구글 로그인 처리 중 오류가 발생했습니다.");
        setTimeout(() => navigate("/login"), 2000);
      }
    };

    handleGoogleCallback();
  }, [searchParams, navigate, dispatch]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "40px",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          style={{
            width: "50px",
            height: "50px",
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #4285F4",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px",
          }}
        ></div>
        <h2 style={{ marginBottom: "10px", color: "#333" }}>{message}</h2>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default GoogleCallbackPage;

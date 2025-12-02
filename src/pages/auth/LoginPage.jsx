import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../../api";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import {
  loginFailure,
  loginStart,
  loginSuccess,
} from "../../store/slices/authSlice";
import "./LoginPage.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // 로그아웃 메시지 확인
  const queryParams = new URLSearchParams(location.search);
  const isLogout = queryParams.get("logout") === "true";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // 에러 메시지 초기화
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "이메일을 입력해주세요.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "올바른 이메일 형식이 아닙니다.";
    }

    if (!formData.password) {
      newErrors.password = "비밀번호를 입력해주세요.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      dispatch(loginStart());

      const response = await authApi.login({
        email: formData.email,
        password: formData.password,
      });

      if (response.success) {
        dispatch(
          loginSuccess({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
          })
        );

        alert("로그인되었습니다.");

        // 이전 페이지로 이동하거나 홈으로
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      } else {
        dispatch(loginFailure(response.message || "로그인에 실패했습니다."));
        setErrors({ submit: response.message || "로그인에 실패했습니다." });
      }
    } catch (error) {
      console.error("로그인 오류:", error);
      const errorMessage =
        error.response?.data?.message || "로그인 중 오류가 발생했습니다.";
      dispatch(loginFailure(errorMessage));
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <Link to="/" className="logo">
            <img src="/images/logo.png" alt="On&Home" />
          </Link>
          <h1>로그인</h1>
          {isLogout && (
            <div className="logout-message">로그아웃 되었습니다.</div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="이메일을 입력하세요"
            label="이메일"
            error={errors.email}
            required
          />

          <Input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="비밀번호를 입력하세요"
            label="비밀번호"
            error={errors.password}
            required
          />

          {errors.submit && (
            <div className="error-message">{errors.submit}</div>
          )}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={isLoading}
          >
            {isLoading ? "로그인 중..." : "로그인"}
          </Button>
        </form>

        <div className="social-login">
          <div className="divider">
            <span>또는</span>
          </div>

          {/* 카카오 로그인 버튼 */}
          <button
            className="kakao-login-btn"
            onClick={async () => {
              try {
                // 백엔드에게 "카카오 로그인 URL" 요청 보내기
                // → 백엔드는 카카오 인증 URL을 만들어서 반환함
                const response = await fetch(
                  "http://localhost:8080/api/auth/kakao/login-url"
                );

                // JSON 형태로 응답 변환 (loginUrl 포함)
                const data = await response.json();

                // ★ 매우 중요 ★
                // 백엔드에서 받은 카카오 로그인 URL로 페이지 이동
                // → 이때부터 카카오 로그인 화면으로 넘어감
                window.location.href = data.loginUrl;
              } catch (error) {
                // API 요청 자체가 실패한 경우
                console.error("카카오 로그인 URL 가져오기 실패:", error);
                alert("카카오 로그인을 시작할 수 없습니다.");
              }
            }}
          >
            {/* 카카오 로고 이미지 */}
            <img src="/images/kakao-logo.png" alt="카카오" />
            {/* 버튼 텍스트 */}
            카카오로 시작하기
          </button>

          {/* 네이버 로그인 버튼 */}
          <button
            className="naver-login-btn"
            onClick={async () => {
              try {
                const response = await fetch(
                  "http://localhost:8080/api/auth/naver/login-url"
                );
                const data = await response.json();

                // state 값을 세션 스토리지에 저장 (CSRF 검증용)
                sessionStorage.setItem("naverState", data.state);

                // 네이버 로그인 페이지로 이동
                window.location.href = data.loginUrl;
              } catch (error) {
                console.error("네이버 로그인 URL 가져오기 실패:", error);
                alert("네이버 로그인을 시작할 수 없습니다.");
              }
            }}
          >
            네이버로 시작하기
          </button>
        </div>

        <div className="login-footer">
          <p>
            아직 회원이 아니신가요? <Link to="/signup">회원가입</Link>
          </p>
          <div className="login-links">
            <Link to="/find-email">이메일 찾기</Link>
            <span>|</span>
            <Link to="/find-password">비밀번호 찾기</Link>
          </div>
        </div>

        <div className="back-to-home">
          <Link to="/">← 홈으로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

{
  /*
  카카오 로그인 오약 설명
  1. 버튼 클릭 시 백엔드로 /auth/kakao/login-url 요청을 보냄
  2. 백엔드는 카카오 로그인 페이지 URL을 만들어서 응답
  3. 프론트는 window.location.href로 그 URL로 이동시킴
  4. 그때부터 카카오 인증 화면으로 들어가며, 로그인 후 callback으로 돌아옴
  5. 오류가 나면 경고창을 띄워서 로그인 시작 실패를 알려줌줌
  */
}

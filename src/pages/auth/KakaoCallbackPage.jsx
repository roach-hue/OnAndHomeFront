import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loginSuccess } from "../../store/slices/authSlice";

const KakaoCallbackPage = () => {
  const navigate = useNavigate(); // 페이지 이동을 위한 훅
  const dispatch = useDispatch(); // Redux 액션 실행 훅
  const [searchParams] = useSearchParams(); // URL의 쿼리 파라미터(code) 읽기
  const [message, setMessage] = useState("카카오 로그인 처리 중..."); // 화면 출력 메시지

  // React.StrictMode 때문에 useEffect가 2번 실행되는 문제를 막기 위한 방어 로직
  const isCalled = useRef(false); // 컴포넌트 전체에서 유지되는 변수

  useEffect(() => {
    // 이미 호출됐으면 그대로 return
    if (isCalled.current) return;
    isCalled.current = true; // 첫 호출 체크

    const handleKakaoCallback = async () => {
      // URL에서 code 값 가져오기 (카카오가 제공하는 인증 코드)
      const code = searchParams.get("code");

      // code가 없으면 실패 처리
      if (!code) {
        setMessage("카카오 로그인에 실패했습니다.");
        setTimeout(() => navigate("/login"), 2000); // 2초 후 로그인 페이지로 이동
        return;
      }

      try {
        // 백엔드로 카카오 로그인 콜백 요청 보내기
        const response = await fetch(
          `http://localhost:8080/api/auth/kakao/callback?code=${code}`,
          {
            method: "GET",
            credentials: "include", // 세션 쿠키 사용 허용
          }
        );

        // JSON 형태로 변환
        const data = await response.json();

        // 로그인 성공한 경우
        if (data.success) {
          // ★ 여기서 카카오 사용자용 accessToken을 직접 생성해서 사용
          const kakaoAccessToken = "kakao_" + data.user.userId;

          // Redux 로그인 성공 처리 → 전역 상태 저장
          dispatch(
            loginSuccess({
              accessToken: kakaoAccessToken, // 카카오 로그인용 임시 액세스 토큰
              user: data.user, // 사용자 정보 저장
            })
          );

          // 브라우저에 세션 유지
          sessionStorage.setItem("accessToken", kakaoAccessToken);
          sessionStorage.setItem("user", JSON.stringify(data.user));

          // 유저에게 보여줄 메시지 변경
          setMessage("로그인 성공! 메인 페이지로 이동합니다...");

          // 1초 뒤 메인 페이지로 이동
          setTimeout(() => navigate("/"), 1000);
        } else {
          // success=false인 경우 → 에러 메시지 출력
          setMessage(data.message || "카카오 로그인에 실패했습니다.");
          setTimeout(() => navigate("/login"), 2000);
        }
      } catch (error) {
        // fetch 요청 자체가 실패한 경우 (서버 오류, 네트워크 오류 등)
        console.error("카카오 로그인 처리 중 오류:", error);
        setMessage("카카오 로그인 처리 중 오류가 발생했습니다.");
        setTimeout(() => navigate("/login"), 2000);
      }
    };

    // 콜백 함수 실행
    handleKakaoCallback();
  }, [searchParams, navigate, dispatch]); // 변경되면 다시 실행되는 의존성 목록

  return (
    // 화면 전체를 가운데 정렬하는 박스
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      {/* 로딩 UI 박스 */}
      <div
        style={{
          textAlign: "center",
          padding: "40px",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* 로딩 스피너 (CSS 애니메이션) */}
        <div
          style={{
            width: "50px",
            height: "50px",
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #FEE500", // 카카오 색
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px",
          }}
        ></div>

        {/* 현재 상태 메시지 출력 */}
        <h2 style={{ marginBottom: "10px", color: "#333" }}>{message}</h2>

        {/* 로딩 애니메이션 keyframe 정의 */}
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

export default KakaoCallbackPage;

{
  /*
  요약
  1. URL에서 code를 가져와서 백엔드에 로그인 처리를 요청하는 페이지
  2. StrictMode로 useEffect 두 번 실행되는 문제를 useRef로 방지
  3. 백엔드에서 로그인 성공하면 Redux와 sessionStorage에 유저 정보를 저장
  4. "kakao_유저아이디" 형태로 액세스 토큰을 별도로 만든 뒤 저장
  5. 로딩 스피너와 메시지를 통해 로그인 상태를 사용자에게 보여줌
  */
}

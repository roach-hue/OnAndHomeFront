import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { login } from "../../store/slices/userSlice";

const NaverCallbackPage = () => {
  // 네이버 로그인 콜백을 처리하는 컴포넌트
  const navigate = useNavigate();
  // 페이지 이동을 위한 함수
  const dispatch = useDispatch();
  // Redux 액션을 보내기 위한 함수
  const location = useLocation();
  // Redux 액션을 보내기 위한 함수

  console.log("=== NaverCallbackPage 렌더링 ===");
  console.log("현재 URL:", window.location.href);
  console.log("location:", location);

  useEffect(() => {
    // useEffect: 컴포넌트가 렌더링된 후 실행되는 함수
    // 네트워크 요청, 데이터 가져오기 등의 사이드 이펙트를 처리
    console.log("=== NaverCallbackPage useEffect 실행 ===");

    const handleNaverCallback = async () => {
      // 네이버 콜백을 처리하는 비동기 함수 정의
      // async: 이 함수 안에서 await를 사용할 수 있음
      const urlParams = new URLSearchParams(window.location.search);
      // URLSearchParams: URL의 쿼리 스트링을 파싱하는 객체
      // window.location.search: 현재 URL의 쿼리 스트링 부분
      // 예: "?code=aBcDeFgHiJkLmNoPqRsTuVwXyZ&state=3f5a7b2e..."
      const code = urlParams.get("code");
      // urlParams.get("code"): "code" 파라미터의 값을 가져옴
      // 예: "aBcDeFgHiJkLmNoPqRsTuVwXyZ"
      // 이 code는 네이버가 발급한 인증 코드
      const state = urlParams.get("state");
      // "state" 파라미터의 값을 가져옴
      // 예: "3f5a7b2e-9c1d-4e6f-8a3b-0d2c4f1e9a7b"
      // 네이버가 우리가 보낸 state를 그대로 돌려준 것
      const savedState = sessionStorage.getItem("naverState");
      // 이전에 sessionStorage에 저장했던 state 값을 가져옴
      // STEP 3에서 저장했던 값

      console.log("code:", code);
      console.log("state:", state);
      console.log("savedState:", savedState);

      // 검증
      if (!code || !state) {
        // code 또는 state가 없으면 (null, undefined, 빈 문자열)
        console.error("code 또는 state가 없습니다!");
        alert("네이버 로그인 실패: 인증 코드가 없습니다.");
        // 사용자에게 에러 알림
        navigate("/login");
        // 로그인 페이지로 이동
        return;
        // 함수 종료 (더 이상 진행하지 않음)
      }

      if (state !== savedState) {
        // URL에서 받은 state와 저장했던 state가 다르면
        // → 중간에 공격자가 요청을 조작했을 가능성
        console.error("state 불일치!");
        alert("네이버 로그인 실패: state 검증 실패");
        // 사용자에게 보안 문제 알림
        navigate("/login");
        // 로그인 페이지로 이동
        return;
        // 함수 종료
      }

      try {
        console.log("백엔드 API 호출 시작...");

        // 3. 백엔드로 code와 state 전달
        const backendUrl = `http://localhost:8080/api/auth/naver/callback?code=${code}&state=${state}`;
        // 백엔드 콜백 엔드포인트 URL 생성
        // 템플릿 리터럴(``)을 사용하여 변수를 URL에 삽입
        // 예: http://localhost:8080/api/auth/naver/callback?code=aBcDe...&state=3f5a7...
        console.log("호출 URL:", backendUrl);

        const response = await fetch(backendUrl, {
          // fetch(): HTTP 요청을 보냄
          // await: 응답이 올 때까지 기다림
          method: "GET",
          // HTTP GET 메서드 사용
          credentials: "include",
          // credentials: "include" - 쿠키를 요청에 포함
          // 백엔드에서 세션을 사용하기 때문에 쿠키 전송 필요
        });

        console.log("응답 상태:", response.status);

        if (!response.ok) {
          // response.ok: 상태 코드가 200-299 범위면 true
          // !response.ok: 에러 상태 코드면 true
          throw new Error(`HTTP ${response.status}`);
          // 에러를 발생시켜 catch 블록으로 이동
        }

        const data = await response.json();
        // 응답 본문을 JSON으로 파싱
        // await: 파싱이 완료될 때까지 기다림
        // data 객체에는 백엔드에서 보낸 로그인 정보가 들어있음
        console.log("응답 데이터:", data);

        // 4. 로그인 성공 처리
        if (data.success && data.accessToken) {
          // data.success가 true이고 accessToken이 있으면
          // → 로그인 성공
          console.log("=== 네이버 로그인 성공 ===");
          console.log("accessToken:", data.accessToken);
          // JWT 액세스 토큰 출력
          console.log("user:", data.user);
          // 사용자 정보 객체 출력

          // Redux store 업데이트
          dispatch(
            login({
              accessToken: data.accessToken,
              // JWT 액세스 토큰
              refreshToken: data.refreshToken,
              // JWT 리프레시 토큰
              user: data.user,
              // 사용자 정보 객체
            })
          );

          console.log("Redux dispatch 완료");

          // state 값 삭제
          sessionStorage.removeItem("naverState");
          // sessionStorage에서 state 값 삭제
          // 더 이상 필요없으므로 제거
          // 보안상 중요한 정보는 사용 후 삭제하는 것이 좋음

          // 메인 페이지로 바로 이동
          window.location.href = "/";
          // 메인 페이지로 리다이렉트
          // window.location.href 사용 시 페이지 새로고침 발생
          // → Redux 상태가 유지되도록 하기 위함
        } else {
          // success가 false이거나 accessToken이 없으면
          // → 로그인 실패
          console.error("로그인 실패:", data.message);
          alert("네이버 로그인 실패: " + (data.message || "알 수 없는 오류"));
          navigate("/login");
        }
      } catch (error) {
        console.error("네이버 로그인 처리 중 오류:", error);
        alert("네이버 로그인 처리 중 오류: " + error.message);
        navigate("/login");
      }
    };

    handleNaverCallback();
    // 정의한 함수를 즉시 실행
  }, [navigate, dispatch]);

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
            borderTop: "4px solid #03C75A",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px",
          }}
        ></div>
        <h2 style={{ marginBottom: "10px", color: "#333" }}>
          네이버 로그인 처리 중...
        </h2>
        <p style={{ color: "#666", fontSize: "14px" }}>잠시만 기다려주세요.</p>

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

export default NaverCallbackPage;

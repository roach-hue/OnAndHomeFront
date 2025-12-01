import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from '../../store/slices/userSlice';

/**
 * GoogleCallback - 구글 OAuth 로그인 콜백 처리 페이지
 * 
 * 역할: 구글 인증 후 리다이렉트되는 페이지에서 인증 코드를 백엔드로 전송하고
 *       JWT 토큰을 받아 로그인 처리
 * 
 * 전체 흐름:
 * 1. 사용자가 Login.js에서 "구글 로그인" 버튼 클릭
 * 2. 구글 OAuth 로그인 페이지로 이동
 * 3. 사용자가 구글 계정으로 로그인 및 동의
 * 4. 구글이 이 페이지로 리다이렉트 (URL에 code 파라미터 포함)
 * 5. 이 컴포넌트가 code를 백엔드로 전송
 * 6. 백엔드가 구글에서 사용자 정보 가져오고 JWT 토큰 생성
 * 7. JWT 토큰과 사용자 정보를 localStorage와 Redux에 저장
 * 8. 메인 페이지로 이동
 * 
 * URL 예시: http://localhost:3000/oauth/google/callback?code=4/0AeanBKoXyZ...
 */
const GoogleCallback = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams(); // URL 쿼리 파라미터 추출
  const [message, setMessage] = useState('구글 로그인 처리 중...');

  /**
   * useEffect - 컴포넌트 마운트 시 구글 로그인 콜백 처리
   * 
   * 실행 시점: 페이지 로드 시 (최초 1회)
   * 의존성: searchParams, navigate, dispatch
   */
  useEffect(() => {
    /**
     * handleGoogleCallback() - 구글 로그인 콜백 처리 함수
     * 
     * 처리 과정:
     * 1. URL에서 인증 코드(code) 추출
     * 2. 백엔드 API로 code 전송 (GET /api/auth/google/callback?code=xxx)
     * 3. 백엔드 처리:
     *    - 구글에 액세스 토큰 요청 (GoogleAuthService.getAccessToken)
     *    - 액세스 토큰으로 사용자 정보 조회 (GoogleAuthService.getUserInfo)
     *    - 사용자 정보로 회원가입 또는 로그인 처리 (GoogleAuthService.processGoogleLogin)
     *    - JWT 토큰 생성 (accessToken: 60분, refreshToken: 7일)
     * 4. JWT 토큰과 사용자 정보를 localStorage에 저장
     * 5. Redux store에 로그인 상태 저장
     * 6. 메인 페이지로 이동
     * 
     * 데이터 흐름:
     * [구글] 인증 코드 → [프론트엔드] 이 페이지
     * → [백엔드] GoogleAuthController.googleCallback()
     * → GoogleAuthService (구글 API 호출 + DB 처리)
     * → JWT 토큰 생성
     * → [프론트엔드] localStorage + Redux 저장 → 메인 페이지
     */
    const handleGoogleCallback = async () => {
      // 1. URL에서 인증 코드 추출
      // 예: http://localhost:3000/oauth/google/callback?code=4/0AeanBKo...
      const code = searchParams.get('code');
      
      // 2. 인증 코드가 없으면 에러 처리
      // (구글 로그인 취소 또는 오류 발생 시)
      if (!code) {
        setMessage('구글 로그인에 실패했습니다.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      try {
        // 3. 백엔드로 인증 코드 전송
        // GET http://localhost:8080/api/auth/google/callback?code=4/0AeanBKo...
        // 
        // 백엔드 처리 (GoogleAuthController.googleCallback()):
        // - GoogleAuthService.getAccessToken(code)
        //   → POST https://oauth2.googleapis.com/token
        //   → 구글로부터 액세스 토큰 받기
        // 
        // - GoogleAuthService.getUserInfo(accessToken)
        //   → GET https://www.googleapis.com/oauth2/v2/userinfo
        //   → 구글로부터 사용자 정보 받기 (id, name, email)
        // 
        // - GoogleAuthService.processGoogleLogin(googleUserInfo)
        //   → DB에서 provider="GOOGLE", providerId=구글ID 조회
        //   → 기존 사용자: 로그인 처리
        //   → 신규 사용자: User 엔티티 생성 및 저장 (role=1)
        // 
        // - JWTUtil.generateToken()
        //   → Access Token (60분) + Refresh Token (7일) 생성
        const response = await fetch(
          `http://localhost:8080/api/auth/google/callback?code=${code}`,
          {
            method: 'GET',
            credentials: 'include', // 세션 쿠키 포함 (CORS 설정 필요)
          }
        );

        // 4. 응답 받기
        // {
        //   "success": true,
        //   "message": "구글 로그인 성공",
        //   "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
        //   "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
        //   "user": {
        //     "id": 1,
        //     "userId": "google_123456789",
        //     "username": "홍길동",
        //     "email": "user@gmail.com",
        //     "role": 1
        //   }
        // }
        const data = await response.json();

        if (data.success) {
          // 5. JWT 토큰을 localStorage에 저장 (기존 로그인과 동일)
          // 이렇게 저장하면 페이지 새로고침 시에도 로그인 상태 유지
          if (data.accessToken) {
            localStorage.setItem('accessToken', data.accessToken);
          }
          if (data.refreshToken) {
            localStorage.setItem('refreshToken', data.refreshToken);
          }
          if (data.user) {
            localStorage.setItem('userInfo', JSON.stringify(data.user));
          }
          
          // 6. Redux 스토어에 사용자 정보 저장 (기존 로그인과 동일한 형식)
          // userSlice.js의 login 액션 실행
          // - state.isAuthenticated = true
          // - state.user = data.user
          // - state.accessToken = data.accessToken
          dispatch(login({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            user: data.user,
          }));

          // 7. 메인 페이지로 이동
          setMessage('로그인 성공! 메인 페이지로 이동합니다...');
          setTimeout(() => navigate('/'), 1000);
        } else {
          // 8. 로그인 실패 시 (백엔드에서 success: false 반환)
          setMessage(data.message || '구글 로그인에 실패했습니다.');
          setTimeout(() => navigate('/login'), 2000);
        }
      } catch (error) {
        // 9. 예외 처리 (네트워크 오류, 서버 오류 등)
        console.error('구글 로그인 처리 중 오류:', error);
        setMessage('구글 로그인 처리 중 오류가 발생했습니다.');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleGoogleCallback();
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="on-main-wrap">
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        textAlign: 'center'
      }}>
        <div>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #4285F4',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h2 style={{ marginBottom: '10px', color: '#333' }}>{message}</h2>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
};

export default GoogleCallback;

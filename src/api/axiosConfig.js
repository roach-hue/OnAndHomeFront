// Axios 라이브러리 import - HTTP 요청을 쉽게 보낼 수 있게 해주는 라이브러리
import axios from 'axios';

/**
 * API 기본 URL 설정
 *
 * 환경별 URL:
 * - 개발 환경: process.env.REACT_APP_API_URL (.env 파일에서 설정)
 * - 기본값: http://localhost:8080 (백엔드 Spring Boot 서버)
 */
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

/**
 * Axios 인스턴스 생성
 *
 * 모든 API 요청은 이 인스턴스를 통해 전송됨
 * authApi.js, productApi.js 등 모든 API 파일에서 이 인스턴스 사용
 *
 * 설정:
 * - baseURL: 모든 요청의 기본 URL (http://localhost:8080)
 * - headers: 기본 헤더 설정 (Content-Type: application/json)
 * - withCredentials: CORS 인증 정보 포함 여부 (현재는 false, 쿠키 미사용)
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,              // 기본 URL 설정
  headers: {
    'Content-Type': 'application/json', // JSON 형식으로 데이터 전송
  },
  withCredentials: false,             // 쿠키 전송 안 함 (JWT는 헤더 사용)
});

/**
 * 요청 인터셉터 - 모든 API 요청 전에 실행됨
 *
 * 역할:
 * 1. localStorage에서 Access Token 가져오기
 * 2. Authorization 헤더에 "Bearer {token}" 형식으로 추가
 * 3. 백엔드의 JWTCheckFilter로 전송
 *
 * 실행 시점:
 * - apiClient.get(), apiClient.post() 등 모든 요청 직전
 * - 예: authApi.login() 호출 → 인터셉터 실행 → 실제 HTTP 요청
 *
 * 제외 대상:
 * - /api/user/login, /api/user/register 등 (토큰 없이 접근 가능)
 * - 이런 경로들은 백엔드 JWTCheckFilter.shouldNotFilter()에서 제외됨
 */
apiClient.interceptors.request.use(
  (config) => {
    // localStorage에서 Access Token 가져오기
    // utils/auth.js의 getAccessToken() 함수와 동일한 동작
    const accessToken = localStorage.getItem('accessToken');

    // Access Token이 있으면 Authorization 헤더에 추가
    if (accessToken) {
      // "Bearer eyJhbGci..." 형식으로 설정
      // 백엔드 JWTCheckFilter.doFilterInternal()에서 이 헤더를 파싱함
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // 수정된 config를 반환하여 실제 요청 진행
    return config;
  },
  (error) => {
    // 요청 설정 중 에러 발생 시 (거의 발생하지 않음)
    return Promise.reject(error);
  }
);

/**
 * 응답 인터셉터 - 모든 API 응답을 받은 후 실행됨
 *
 * 역할:
 * 1. 성공 응답 (200번대): 그대로 전달
 * 2. 401 Unauthorized 에러: JWT 토큰 만료 → 자동 갱신 시도
 * 3. 토큰 갱신 성공: 원래 요청을 새 토큰으로 재시도
 * 4. 토큰 갱신 실패: 로그인 페이지로 리다이렉트
 *
 * 실행 시점:
 * - 백엔드에서 응답이 오면 컴포넌트에 전달되기 전에 실행
 * - 401 에러 발생 시 사용자가 모르게 자동으로 토큰 갱신 처리
 */
apiClient.interceptors.response.use(
  (response) => {
    // 성공 응답 (200, 201 등)은 그대로 반환
    // 컴포넌트에서 response.data로 접근 가능
    return response;
  },
  async (error) => {
    // 원래 요청 정보 저장 (나중에 재시도할 때 사용)
    const originalRequest = error.config;

    /**
     * 401 Unauthorized 에러 처리 (JWT 토큰 만료)
     *
     * 조건:
     * 1. HTTP 상태 코드가 401 (Unauthorized)
     * 2. 아직 재시도하지 않은 요청 (!originalRequest._retry)
     *
     * 백엔드에서 401이 발생하는 경우:
     * - JWTCheckFilter에서 토큰 검증 실패
     * - CustomJWTException("Expired") 발생
     */
    if (error.response?.status === 401 && !originalRequest._retry) {
      // 재시도 플래그 설정 (무한 루프 방지)
      // 같은 요청을 두 번 이상 재시도하지 않음
      originalRequest._retry = true;

      try {
        // localStorage에서 Refresh Token 가져오기
        const refreshToken = localStorage.getItem('refreshToken');
        
        // Refresh Token이 없으면 로그인 필요
        if (!refreshToken) {
          // 모든 토큰 및 사용자 정보 삭제
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("userInfo");

          // 로그인 관련 페이지가 아닌 경우에만 로그인 페이지로 리다이렉트
          // (이미 로그인 페이지에 있으면 리다이렉트하지 않음)
          if (
            !window.location.pathname.includes("/login") &&
            !window.location.pathname.includes("/signup") &&
            !window.location.pathname.includes("/reset-password") &&
            !window.location.pathname.includes("/auth/kakao")
          ) {
            window.location.href = "/login";
          }

          // 에러를 그대로 throw하여 호출한 곳에서 처리하게 함
          return Promise.reject(error);
        }

        /**
         * 토큰 갱신 요청
         *
         * 백엔드: POST /api/user/refresh
         * 컨트롤러: MemberController.refresh()
         *
         * 주의:
         * - apiClient가 아닌 axios 직접 사용 (무한 루프 방지)
         * - 이 요청도 인터셉터를 거치면 무한 루프 발생 가능
         */
        const response = await axios.post(
          `${API_BASE_URL}/api/user/refresh`,
          null, // POST body는 비어있음 (Refresh Token은 헤더로 전송)
          {
            headers: {
              "Content-Type": "application/json",
              // Authorization 헤더에 Refresh Token 포함
              // 백엔드에서 이 토큰을 검증하고 새 Access Token 발급
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );

        // 백엔드 응답에서 새 토큰들 추출
        // response.data: {accessToken: "new_token", refreshToken: "new_refresh_token"}
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          response.data;

        // 새 Access Token을 localStorage에 저장
        if (newAccessToken) {
          localStorage.setItem("accessToken", newAccessToken);
        }

        // 새 Refresh Token이 있으면 저장 (선택 사항, 백엔드 구현에 따라 다름)
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        // 원래 실패했던 요청의 Authorization 헤더를 새 토큰으로 교체
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // 원래 요청을 새 토큰으로 재시도
        // 예: GET /api/user/profile이 실패했다면 새 토큰으로 다시 요청
        // 사용자는 이 과정을 모르고 정상적으로 데이터를 받게 됨
        return apiClient(originalRequest);

      } catch (refreshError) {
        /**
         * Refresh Token으로 갱신 실패
         *
         * 원인:
         * 1. Refresh Token도 만료됨
         * 2. Refresh Token이 유효하지 않음
         * 3. 네트워크 에러
         *
         * 결과: 완전히 로그아웃 처리
         */

        // 모든 인증 정보 삭제
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userInfo");

        // 로그인 관련 페이지가 아닌 경우에만 로그인 페이지로 리다이렉트
        if (
          !window.location.pathname.includes("/login") &&
          !window.location.pathname.includes("/signup") &&
          !window.location.pathname.includes("/reset-password") &&
          !window.location.pathname.includes("/auth/kakao")
        ) {
          window.location.href = "/login";
        }

        // 에러를 throw하여 호출한 곳에서 처리하게 함
        return Promise.reject(refreshError);
      }
    }

    // 401이 아닌 다른 에러 (400, 403, 404, 500 등)는 그대로 전달
    // 컴포넌트의 catch 블록에서 처리
    return Promise.reject(error);
  }
);

// apiClient 인스턴스를 export하여 다른 파일에서 사용
// authApi.js, productApi.js 등에서 import하여 사용
// 예: import apiClient from './axiosConfig'; apiClient.get('/api/products');
export default apiClient;

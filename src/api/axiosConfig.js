import axios from 'axios';

// API 기본 URL 설정
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// 요청 인터셉터 - JWT 토큰을 자동으로 헤더에 추가
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 토큰 만료 시 자동 갱신
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 에러이고 재시도하지 않은 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          // 리프레시 토큰이 없으면 로그인 페이지로
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("userInfo");

          // 이미 로그인/회원가입/비밀번호 재설정 페이지에 있으면 이동 안 함
          if (
            !window.location.pathname.includes("/login") &&
            !window.location.pathname.includes("/signup") &&
            !window.location.pathname.includes("/reset-password") &&
            !window.location.pathname.includes("/auth/kakao")
          ) {
            window.location.href = "/login";
          }

          return Promise.reject(error);
        }

        // 토큰 갱신 요청
        const response = await axios.post(
          `${API_BASE_URL}/api/user/refresh`,
          null,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          response.data;

        // 새 토큰 저장
        if (newAccessToken) {
          localStorage.setItem("accessToken", newAccessToken);
        }
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        // 원래 요청 헤더에 새 토큰 넣어서 재요청
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // 리프레시 토큰도 만료됨 → 로그인 필요
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userInfo");

        // 이미 로그인 페이지에 있으면 리다이렉트하지 않음
        if (
          !window.location.pathname.includes("/login") &&
          !window.location.pathname.includes("/signup") &&
          !window.location.pathname.includes("/reset-password") &&
          !window.location.pathname.includes("/auth/kakao")
        ) {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

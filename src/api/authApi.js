// Axios 인스턴스 가져오기 (API 요청 시 자동으로 JWT 토큰을 헤더에 추가)
// 파일 위치: src/api/axiosConfig.js
import apiClient from './axiosConfig';

/**
 * 인증 관련 API 함수 모음
 * 
 * 백엔드 엔드포인트:
 * - 로그인: POST /api/user/login (MemberController.loginPost)
 * - 회원가입: POST /api/user/register (MemberController.register)
 * - 토큰 갱신: POST /api/user/refresh (MemberController.refresh)
 * - 세션 정보: GET /api/user/session-info (MemberController.getSessionInfo)
 * 
 * 모든 API 호출은 axiosConfig.js의 인터셉터를 거쳐 처리됨:
 * - 요청 인터셉터: Authorization 헤더에 Access Token 자동 추가
 * - 응답 인터셉터: 401 에러 시 자동으로 토큰 갱신 시도
 */
const authApi = {
  /**
   * 로그인 API
   * 
   * 호출 위치: Login.jsx의 handleSubmit() 함수
   * 백엔드: MemberController.loginPost()
   * 
   * 처리 과정:
   * 1. 클라이언트: 로그인 폼에서 userId, pwd 입력
   * 2. → POST /api/user/login {userId, pwd}
   * 3. 백엔드: DB에서 사용자 정보 조회 및 비밀번호 검증
   * 4. 백엔드: JWTUtil.generateToken()으로 Access Token, Refresh Token 생성
   * 5. ← 응답: {accessToken, refreshToken, userInfo}
   * 6. 클라이언트: authSlice.loginSuccess() 디스패치 → localStorage에 토큰 저장
   * 
   * @param credentials - {userId: 로그인ID, pwd: 비밀번호}
   * @returns Promise<{accessToken: string, refreshToken: string, ...}>
   */
  login: async (credentials) => {
    // POST 요청: axiosConfig.js의 baseURL + '/api/user/login'
    // credentials는 자동으로 JSON.stringify되어 요청 body에 포함됨
    const response = await apiClient.post('/api/user/login', credentials);
    
    // response.data: {accessToken: "eyJhbGci...", refreshToken: "eyJhbGci...", ...}
    // 이 데이터가 Login.jsx로 반환되어 Redux에 저장됨
    return response.data;
  },

  /**
   * 회원가입 API
   * 
   * 호출 위치: Signup.jsx의 handleSubmit() 함수
   * 백엔드: MemberController.register()
   * 
   * 처리 과정:
   * 1. 클라이언트: 회원가입 폼에서 사용자 정보 입력
   * 2. → POST /api/user/register {userId, pwd, username, email, phone, ...}
   * 3. 백엔드: DB에 새 사용자 정보 INSERT
   * 4. 백엔드: 자동 로그인 처리 (JWT 토큰 생성)
   * 5. ← 응답: {accessToken, refreshToken, userInfo}
   * 6. 클라이언트: 자동으로 로그인 처리 (선택 사항)
   * 
   * @param userData - {userId, pwd, username, email, phone, address, ...}
   * @returns Promise<{success: boolean, message: string, ...}>
   */
  signup: async (userData) => {
    // POST 요청: /api/user/register
    const response = await apiClient.post('/api/user/register', userData);
    return response.data;
  },

  /**
   * 로그아웃 (클라이언트 측 처리)
   * 
   * 호출 위치: Header.jsx의 handleLogout() 함수
   * 
   * 참고: JWT는 Stateless하므로 백엔드에서 별도 로그아웃 처리 불필요
   *       클라이언트에서 토큰만 삭제하면 됨
   * 
   * 처리 과정:
   * 1. localStorage에서 accessToken, refreshToken, userInfo 삭제
   * 2. Redux 상태 초기화 (authSlice.logout)
   * 3. 로그인 페이지로 리다이렉트
   */
  logout: () => {
    // localStorage에서 모든 토큰 및 사용자 정보 삭제
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');
    
    // Promise 성공으로 반환 (비동기 함수 형태 유지)
    return Promise.resolve({ success: true });
  },

  /**
   * JWT 토큰 갱신 API
   * 
   * 호출 위치: axiosConfig.js의 응답 인터셉터 (401 에러 시 자동 호출)
   * 백엔드: MemberController.refresh()
   * 
   * 처리 과정:
   * 1. Access Token 만료로 API 요청 실패 (401 Unauthorized)
   * 2. → 응답 인터셉터에서 자동으로 /api/user/refresh 호출
   * 3. → POST /api/user/refresh {refreshToken}
   * 4. 백엔드: Refresh Token 검증
   * 5. 백엔드: JWTUtil.generateToken()으로 새 Access Token 생성
   * 6. ← 응답: {accessToken, refreshToken (선택)}
   * 7. 클라이언트: localStorage에 새 Access Token 저장
   * 8. 클라이언트: 원래 실패했던 API 요청을 새 토큰으로 재시도
   * 
   * @param refreshToken - localStorage에 저장된 Refresh Token
   * @returns Promise<{accessToken: string, refreshToken?: string}>
   */
  refresh: async (refreshToken) => {
    // POST 요청: /api/user/refresh
    // 주의: 이 요청은 인터셉터를 거치지 않도록 설정 필요 (무한 루프 방지)
    const response = await apiClient.post('/api/user/refresh', { refreshToken });
    
    // 새로 발급받은 Access Token 반환
    // axiosConfig.js에서 이 토큰을 localStorage에 저장하고 원래 요청 재시도
    return response.data;
  },

  /**
   * 현재 세션 정보 조회 API
   * 
   * 호출 위치: 페이지 새로고침 시 또는 토큰 검증이 필요한 경우
   * 백엔드: MemberController.getSessionInfo()
   * 
   * 참고: JWT 방식에서는 서버 세션이 없으므로 실제로는 토큰 검증만 수행
   *       백엔드에서 JWT를 파싱하여 사용자 정보 반환
   * 
   * @returns Promise<{userId: string, role: string, ...}>
   */
  getSessionInfo: async () => {
    // GET 요청: /api/user/session-info
    // axiosConfig.js의 요청 인터셉터에서 Authorization 헤더에 Access Token 자동 추가
    const response = await apiClient.get('/api/user/session-info');
    return response.data;
  },

  /**
   * 사용자 ID(로그인 ID)로 사용자 정보 조회
   * 
   * 호출 위치: 사용자 프로필 페이지, 관리자 페이지 등
   * 백엔드: MemberController.getUserByUserId()
   * 
   * @param userId - 로그인 ID (예: "user123", "admin@example.com")
   * @returns Promise<{id, userId, username, email, ...}>
   */
  getUserByUserId: async (userId) => {
    // GET 요청: /api/user/username/{userId}
    // Authorization 헤더에 Access Token 포함 (인증 필요)
    const response = await apiClient.get(`/api/user/username/${userId}`);
    return response.data;
  },

  /**
   * 사용자 고유 ID(DB Primary Key)로 사용자 정보 조회
   * 
   * 호출 위치: 사용자 상세 정보가 필요한 경우
   * 백엔드: MemberController.getUserById()
   * 
   * @param id - 사용자 고유 ID (DB의 PK, 숫자)
   * @returns Promise<{id, userId, username, email, ...}>
   */
  getUserById: async (id) => {
    // GET 요청: /api/user/{id}
    // Authorization 헤더에 Access Token 포함 (인증 필요)
    const response = await apiClient.get(`/api/user/${id}`);
    return response.data;
  },
};

// authApi 객체를 export하여 다른 컴포넌트에서 import하여 사용
// 예: import authApi from './api/authApi'; authApi.login({userId, pwd});
export default authApi;

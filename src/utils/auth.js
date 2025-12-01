/**
 * JWT 토큰 관련 유틸리티 함수 모음
 * 
 * 주요 기능:
 * 1. localStorage에 JWT 토큰 저장/조회/삭제
 * 2. JWT 토큰 유효성 검증 (만료 시간 체크)
 * 3. JWT Payload에서 사용자 정보 추출
 * 
 * 사용 위치:
 * - authSlice.js: 로그인/로그아웃 시 토큰 관리
 * - authApi.js: API 요청 시 토큰 첨부 및 갱신
 * - App.jsx: 앱 시작 시 로그인 상태 복원
 */

/**
 * JWT 토큰을 localStorage에 저장
 * 
 * 호출 위치: authSlice.js의 loginSuccess 액션
 * 
 * @param accessToken - Access Token (유효기간 짧음, 일반적으로 60분)
 *                      백엔드 JWTUtil.generateToken()에서 생성됨
 * @param refreshToken - Refresh Token (유효기간 김, 일반적으로 7일)
 *                       Access Token 갱신에 사용됨
 */
export const setTokens = (accessToken, refreshToken) => {
  // Access Token 저장 (있는 경우에만)
  // API 요청 시 Authorization 헤더에 포함됨
  if (accessToken) {
    localStorage.setItem('accessToken', accessToken);
  }
  
  // Refresh Token 저장 (있는 경우에만)
  // Access Token 만료 시 새 토큰 발급받는 데 사용됨
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
};

/**
 * localStorage에서 Access Token 조회
 * 
 * 호출 위치:
 * - authApi.js: API 요청 시 Authorization 헤더에 첨부
 * - isLoggedIn(): 로그인 상태 확인
 * 
 * @returns Access Token 문자열 또는 null
 *          형식: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOi..."
 */
export const getAccessToken = () => {
  // localStorage에서 'accessToken' 키로 저장된 값을 가져옴
  // 백엔드의 JWTCheckFilter에서 이 토큰을 검증함
  return localStorage.getItem('accessToken');
};

/**
 * localStorage에서 Refresh Token 조회
 * 
 * 호출 위치:
 * - authApi.js: Access Token 만료 시 갱신 요청
 * 
 * @returns Refresh Token 문자열 또는 null
 */
export const getRefreshToken = () => {
  // localStorage에서 'refreshToken' 키로 저장된 값을 가져옴
  // 백엔드의 /api/user/refresh 엔드포인트로 전송되어 새 Access Token 발급받음
  return localStorage.getItem('refreshToken');
};

/**
 * localStorage에서 모든 토큰 및 사용자 정보 삭제
 * 
 * 호출 위치:
 * - authSlice.js의 logout 액션
 * - authApi.js: Refresh Token도 만료된 경우 자동 로그아웃
 * 
 * 결과: 사용자가 완전히 로그아웃 상태가 됨
 */
export const removeTokens = () => {
  localStorage.removeItem('accessToken');  // Access Token 삭제
  localStorage.removeItem('refreshToken'); // Refresh Token 삭제
  localStorage.removeItem('userInfo');     // 사용자 정보 삭제 (authSlice.js에서 저장한 것)
};

/**
 * JWT 토큰의 유효성을 검사 (만료 여부 체크)
 * 
 * 호출 위치: isLoggedIn() 함수
 * 
 * 검증 과정:
 * 1. 토큰 형식 확인 (Header.Payload.Signature 구조)
 * 2. Payload를 Base64 디코딩
 * 3. exp(만료 시간) 필드 확인
 * 4. 현재 시간과 비교
 * 
 * @param token - 검증할 JWT 토큰 문자열
 * @returns true: 유효한 토큰, false: 유효하지 않은 토큰
 */
export const isTokenValid = (token) => {
  // 토큰이 없으면 유효하지 않음
  if (!token) return false;
  
  try {
    // JWT는 3개 부분으로 구성 (header.payload.signature)
    // 예: "eyJhbGci...".ey"J1c2VySWQi...".SflKxwRJSMeKKF2QT4..."
    const parts = token.split('.');
    
    // 정상적인 JWT는 반드시 3개 부분이어야 함
    if (parts.length !== 3) return false;
    
    // Payload 부분(parts[1])을 Base64 디코딩하여 JSON으로 파싱
    // atob(): Base64 문자열을 디코딩하는 브라우저 내장 함수
    // Payload 예시: {userId: "user123", role: "ROLE_USER", exp: 1234567890}
    const payload = JSON.parse(atob(parts[1]));
    
    // exp(Expiration Time) 필드가 있는지 확인
    // exp는 Unix Timestamp (1970년 1월 1일 이후 경과 시간, 초 단위)
    if (payload.exp) {
      const expirationTime = payload.exp * 1000; // 초를 밀리초로 변환 (JavaScript는 밀리초 사용)
      
      // 현재 시간이 만료 시간보다 이전이면 유효, 이후면 만료
      // Date.now(): 현재 시간을 밀리초로 반환
      return Date.now() < expirationTime;
    }
    
    // exp 필드가 없으면 일단 유효한 것으로 간주 (백엔드에서 exp는 항상 포함시켜야 함)
    return true;
  } catch (error) {
    // 토큰 파싱 실패 (Base64 디코딩 실패, JSON 파싱 실패 등)
    console.error('토큰 검증 실패:', error);
    return false;
  }
};

/**
 * JWT 토큰의 Payload에서 사용자 정보 추출
 * 
 * 호출 위치:
 * - authSlice.js의 loginSuccess: 로그인 성공 시 사용자 정보 추출
 * - App.jsx: 페이지 새로고침 시 사용자 정보 복원
 * 
 * @param token - JWT 토큰 문자열
 * @returns 사용자 정보 객체 {userId, email, role} 또는 null
 */
export const getUserFromToken = (token) => {
  // 토큰이 없으면 null 반환
  if (!token) return null;
  
  try {
    // JWT를 '.'으로 분리 (Header.Payload.Signature)
    const parts = token.split('.');
    
    // 정상적인 JWT 구조인지 확인
    if (parts.length !== 3) return null;
    
    // Payload 부분을 Base64 디코딩 후 JSON 파싱
    // atob(): Base64 → 일반 문자열
    // JSON.parse(): JSON 문자열 → JavaScript 객체
    const payload = JSON.parse(atob(parts[1]));
    
    // 백엔드에서 JWT에 포함시킨 사용자 정보 추출
    // JWTUtil.generateToken()에서 valueMap에 담아 보낸 정보들
    return {
      userId: payload.userId, // 로그인 ID (이메일 등)
      email: payload.sub,     // 이메일 (JWT 표준 클레임 'sub'에 저장)
      role: payload.role,     // 권한 (ROLE_USER 또는 ROLE_ADMIN)
    };
  } catch (error) {
    // Payload 파싱 실패
    console.error('토큰 파싱 실패:', error);
    return null;
  }
};

/**
 * 현재 로그인 상태 확인
 * 
 * 호출 위치:
 * - App.jsx: 앱 시작 시 로그인 상태 확인
 * - PrivateRoute: 인증이 필요한 페이지 접근 시 로그인 여부 체크
 * 
 * @returns true: 로그인 상태, false: 로그아웃 상태
 */
export const isLoggedIn = () => {
  // localStorage에서 Access Token 가져오기
  const token = getAccessToken();
  
  // 토큰이 있고, 유효한 경우에만 true 반환
  // isTokenValid(): 토큰 형식 확인 및 만료 시간 체크
  return token && isTokenValid(token);
};

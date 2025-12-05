// Redux Toolkit의 createSlice - Redux 상태 관리를 간편하게 만들어주는 함수
import { createSlice } from '@reduxjs/toolkit';
// JWT 토큰을 localStorage에 저장/삭제/파싱하는 유틸리티 함수들
// 파일 위치: src/utils/auth.js
import { setTokens, removeTokens, getUserFromToken } from '../../utils/auth';

/**
 * Redux 인증 상태의 초기값
 * 앱 시작 시 또는 로그아웃 시 이 값으로 리셋됨
 */
const initialState = {
  user: null,        // 로그인한 사용자 정보 {userId, role, id 등}
  isLoggedIn: false, // 로그인 여부 (true/false)
  isAdmin: false,    // 관리자 여부 (true/false)
  loading: false,    // 로그인 진행 중 여부 (로딩 스피너 표시용)
  error: null,       // 로그인 실패 시 에러 메시지
};

/**
 * Redux Slice 생성 - 인증 관련 상태와 액션들을 하나로 묶음
 * 
 * 사용 위치:
 * - Login.jsx: loginSuccess, loginFailure 디스패치
 * - App.jsx: setUser로 localStorage에서 사용자 정보 복원
 * - 모든 컴포넌트: useSelector로 isLoggedIn, isAdmin 상태 확인
 */
const authSlice = createSlice({
  name: 'auth', // 액션 타입의 prefix (auth/loginSuccess, auth/logout 등)
  initialState, // 위에서 정의한 초기 상태
  reducers: {
    /**
     * 로그인 시작 액션
     * 디스패치 위치: Login.jsx의 handleSubmit() 함수 시작 부분
     * 
     * 역할: 로딩 상태를 true로 설정하여 로딩 스피너 표시
     */
    loginStart: (state) => {
      state.loading = true;  // 로딩 시작
      state.error = null;    // 이전 에러 메시지 초기화
    },
    
    /**
     * 로그인 성공 액션
     * 디스패치 위치: Login.jsx의 handleSubmit() - API 호출 성공 후
     * 
     * 역할:
     * 1. JWT 토큰을 localStorage에 저장 (setTokens 호출)
     * 2. Access Token을 파싱하여 사용자 정보 추출 (getUserFromToken 호출)
     * 3. Redux 상태에 사용자 정보 저장
     * 4. isLoggedIn, isAdmin 플래그 설정
     * 
     * @param action.payload - {accessToken: "eyJhbGci...", refreshToken: "eyJhbGci..."}
     */
    loginSuccess: (state, action) => {
      // payload에서 Access Token과 Refresh Token 추출
      const { accessToken, refreshToken } = action.payload;
      
      // utils/auth.js의 setTokens() 호출
      // → localStorage.setItem('accessToken', accessToken)
      // → localStorage.setItem('refreshToken', refreshToken)
      setTokens(accessToken, refreshToken);
      
      // Access Token의 Payload를 디코딩하여 사용자 정보 추출
      // getUserFromToken()은 jwt-decode 라이브러리 사용
      // 반환값: {userId: "user123", role: "ROLE_USER", id: 1, exp: 1234567890}
      const userInfo = getUserFromToken(accessToken);
      
      // Redux 상태 업데이트
      state.user = userInfo;                          // 사용자 정보 저장
      state.isLoggedIn = true;                        // 로그인 상태로 변경
      state.isAdmin = userInfo?.role === 'ROLE_ADMIN'; // 관리자 여부 체크
      state.loading = false;                          // 로딩 종료
      state.error = null;                             // 에러 초기화
      
      // localStorage에도 사용자 정보 저장 (새로고침 시 복원용)
      // App.jsx에서 localStorage의 userInfo를 읽어 Redux 상태 복원
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
    },
    
    /**
     * 로그인 실패 액션
     * 디스패치 위치: Login.jsx의 handleSubmit() - API 호출 실패 시 (catch 블록)
     * 
     * 역할: 에러 메시지를 상태에 저장하여 화면에 표시
     * 
     * @param action.payload - 에러 메시지 문자열 (예: "아이디 또는 비밀번호가 틀렸습니다")
     */
    loginFailure: (state, action) => {
      state.loading = false;        // 로딩 종료
      state.error = action.payload; // 에러 메시지 저장 (화면에 표시됨)
    },
    
    /**
     * 로그아웃 액션
     * 디스패치 위치: 
     * - Header.jsx의 handleLogout() 함수
     * - authApi.js의 API 인터셉터 (401 에러 시 자동 로그아웃)
     * 
     * 역할:
     * 1. localStorage에서 토큰 삭제 (removeTokens 호출)
     * 2. Redux 상태를 초기값으로 리셋
     * 3. 로그인 페이지로 리다이렉트 (컴포넌트에서 처리)
     */
    logout: (state, action) => {
      // utils/auth.js의 removeTokens() 호출
      // → localStorage.removeItem('accessToken')
      // → localStorage.removeItem('refreshToken')
      // → localStorage.removeItem('userInfo')
      removeTokens();
      
      // Redux 상태를 초기값으로 리셋
      state.user = null;        // 사용자 정보 삭제
      state.isLoggedIn = false; // 로그아웃 상태로 변경
      state.isAdmin = false;    // 관리자 권한 해제
      state.loading = false;    // 로딩 초기화
      state.error = null;       // 에러 초기화
    },
    
    /**
     * 사용자 정보 설정 액션
     * 디스패치 위치: 
     * - App.jsx의 useEffect - localStorage에서 사용자 정보 복원 시
     * - authApi.js - Access Token 갱신 후 새 사용자 정보로 업데이트
     * 
     * 역할: Redux 상태의 사용자 정보를 외부에서 직접 설정
     * 
     * @param action.payload - 사용자 정보 객체 또는 null
     */
    setUser: (state, action) => {
      state.user = action.payload;                          // 사용자 정보 설정
      state.isLoggedIn = !!action.payload;                  // null이 아니면 로그인 상태
      state.isAdmin = action.payload?.role === 'ROLE_ADMIN'; // 관리자 여부 체크
    },
    
    /**
     * 에러 메시지 초기화 액션
     * 디스패치 위치: Login.jsx - 에러 메시지 표시 후 일정 시간 뒤
     * 
     * 역할: 에러 메시지를 화면에서 제거
     */
    clearError: (state) => {
      state.error = null; // 에러 메시지 초기화
    },
  },
});

// 액션 생성자 함수들을 export (컴포넌트에서 dispatch(loginSuccess(...)) 형태로 사용)
export const {
  loginStart,    // 로그인 시작
  loginSuccess,  // 로그인 성공
  loginFailure,  // 로그인 실패
  logout,        // 로그아웃
  setUser,       // 사용자 정보 설정
  clearError,    // 에러 초기화
} = authSlice.actions;

// Redux store에 등록할 reducer export
// store/index.js에서 configureStore에 auth: authSlice.reducer로 등록됨
export default authSlice.reducer;

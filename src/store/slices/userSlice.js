import { createSlice } from '@reduxjs/toolkit';
import { removeTokens, getCurrentUserInfo } from '../../utils/authUtils';

const initialState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
      removeTokens();
      localStorage.removeItem('userInfo');
    },
    updateUserInfo: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    initializeAuth: (state) => {
      const accessToken = localStorage.getItem('accessToken');
      const userInfoStr = localStorage.getItem('userInfo');
      
      if (accessToken && userInfoStr) {
        try {
          const userInfo = JSON.parse(userInfoStr);
          state.isAuthenticated = true;
          state.user = userInfo;
          console.log('인증 상태 초기화 완료:', userInfo);
        } catch (error) {
          console.error('사용자 정보 파싱 오류:', error);
          state.isAuthenticated = false;
          state.user = null;
        }
      } else {
        state.isAuthenticated = false;
        state.user = null;
      }
    },
    login: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.error = null;
      // 토큰 저장
      if (action.payload.accessToken) {
        localStorage.setItem('accessToken', action.payload.accessToken);
      }
      if (action.payload.refreshToken) {
        localStorage.setItem('refreshToken', action.payload.refreshToken);
      }
      // 사용자 정보 저장
      localStorage.setItem('userInfo', JSON.stringify(action.payload.user));
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUserInfo,
  clearError,
  initializeAuth,
  login,
} = userSlice.actions;

export default userSlice.reducer;

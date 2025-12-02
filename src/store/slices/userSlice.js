import { createSlice } from "@reduxjs/toolkit";
import { removeTokens } from "../../utils/authUtils";

const initialState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },

    loginSuccess: (state, action) => {
      console.log("=== loginSuccess 호출 ===");
      console.log("payload:", action.payload);

      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;

      // localStorage에 사용자 정보 저장
      localStorage.setItem("userInfo", JSON.stringify(action.payload));

      console.log("loginSuccess 완료");
    },

    loginFailure: (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload;
    },

    logout: (state) => {
      console.log("=== logout 호출 ===");

      state.isAuthenticated = false;
      state.user = null;
      state.error = null;

      // localStorage 클리어
      removeTokens();
      localStorage.removeItem("userInfo");

      console.log("logout 완료");
    },

    updateUserInfo: (state, action) => {
      state.user = { ...state.user, ...action.payload };

      // localStorage 업데이트
      localStorage.setItem("userInfo", JSON.stringify(state.user));
    },

    clearError: (state) => {
      state.error = null;
    },

    initializeAuth: (state) => {
      console.log("=== initializeAuth 호출 ===");

      const accessToken = localStorage.getItem("accessToken");
      const userInfoStr = localStorage.getItem("userInfo");

      console.log("accessToken:", accessToken ? "존재" : "없음");
      console.log("userInfo:", userInfoStr ? "존재" : "없음");

      if (accessToken && userInfoStr) {
        try {
          const userInfo = JSON.parse(userInfoStr);
          state.isAuthenticated = true;
          state.user = userInfo;

          console.log("인증 상태 복원 완료:", userInfo);
        } catch (error) {
          console.error("사용자 정보 파싱 오류:", error);
          state.isAuthenticated = false;
          state.user = null;

          // 잘못된 데이터 제거
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("userInfo");
        }
      } else {
        console.log("저장된 인증 정보 없음");
        state.isAuthenticated = false;
        state.user = null;
      }
    },

    // 소셜 로그인용 액션 (카카오, 네이버)
    login: (state, action) => {
      console.log("=== login 액션 호출 ===");
      console.log("payload:", action.payload);

      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.error = null;

      // 토큰 저장
      if (action.payload.accessToken) {
        localStorage.setItem("accessToken", action.payload.accessToken);
        console.log("accessToken 저장:", action.payload.accessToken);
      }

      if (action.payload.refreshToken) {
        localStorage.setItem("refreshToken", action.payload.refreshToken);
        console.log("refreshToken 저장");
      }

      // 사용자 정보 저장
      localStorage.setItem("userInfo", JSON.stringify(action.payload.user));
      console.log("userInfo 저장:", action.payload.user);

      console.log("login 액션 완료");
      console.log("현재 localStorage:", {
        accessToken: localStorage.getItem("accessToken"),
        userInfo: localStorage.getItem("userInfo"),
      });
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

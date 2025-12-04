/**
 * Redux Store 설정 파일
 *
 * ========================================
 * 📌 파일 개요
 * ========================================
 * - 파일 위치: src/store/index.js
 * - 역할: Redux 전역 상태 관리 스토어 생성 및 설정
 * - 라이브러리: Redux Toolkit (RTK)
 *
 * ========================================
 * 📌 Redux 용어 정리
 * ========================================
 * - Store: 애플리케이션의 전역 상태를 저장하는 단일 객체
 * - Reducer: 액션에 따라 상태를 변경하는 순수 함수
 * - Slice: Redux Toolkit에서 리듀서 + 액션을 묶은 단위
 * - Action: 상태 변경을 요청하는 객체 { type, payload }
 * - Dispatch: 액션을 스토어에 전달하는 함수
 *
 * ========================================
 * 📌 왜 Redux를 사용하는가?
 * ========================================
 * 1. 전역 상태 관리: 컴포넌트 간 props drilling 없이 상태 공유
 * 2. 예측 가능한 상태: 단방향 데이터 흐름으로 디버깅 용이
 * 3. 상태 지속성: 새로고침 시에도 상태 유지 가능 (persist 연동 시)
 * 4. 개발자 도구: Redux DevTools로 상태 변화 추적 가능
 *
 * ========================================
 * 📌 등록된 Slice 목록
 * ========================================
 * | Slice명      | 역할                           |
 * |-------------|-------------------------------|
 * | user        | 로그인 사용자 정보, 인증 상태     |
 * | cart        | 장바구니 아이템, 총 금액         |
 * | product     | 상품 목록, 필터, 검색 결과       |
 * | compare     | 상품 비교 목록                  |
 * | notification| 알림 메시지, 토스트             |
 */

import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import cartReducer from "./slices/cartSlice";
import productReducer from "./slices/productSlice";
import authReducer from "./slices/authSlice";
import compareReducer from "./slices/compareSlice";
import notificationReducer from "./slices/notificationSlice";

/**
 * Redux Store 생성
 *
 * configureStore: Redux Toolkit의 스토어 생성 함수
 * - 자동으로 Redux DevTools 연동
 * - 자동으로 redux-thunk 미들웨어 추가
 * - 개발 모드에서 상태 변이(mutation) 감지
 */
const store = configureStore({
  /**
   * 리듀서 등록
   * 각 slice의 리듀서를 키-값 형태로 등록
   * 상태 접근: state.user, state.cart 등
   */
  reducer: {
    user: userReducer,           // 사용자 인증 상태
    auth: authReducer,           // 인증 관리 상태
    cart: cartReducer,           // 장바구니 상태
    product: productReducer,     // 상품 관련 상태
    compare: compareReducer,     // 상품 비교 상태
    notification: notificationReducer,  // 알림 상태
  },

  /**
   * 미들웨어 설정
   * serializableCheck: false - 직렬화 불가능한 값 허용
   * (Date 객체, 함수 등을 상태에 저장할 때 경고 무시)
   */
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;

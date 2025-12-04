import { createSlice } from "@reduxjs/toolkit";

const compareSlice = createSlice({
  // createSlice: Redux slice 생성
  // slice: Redux 상태의 일부분을 관리하는 단위
  name: "compare",
  // name: slice의 이름
  // 액션 타입의 접두사로 사용됨
  // 예: compare/addToCompare
  initialState: {
    items: [],
  },
  // initialState: 초기 상태
  // items: 비교 상품 배열 (최대 4개)
  //
  // 초기 상태 예:
  // {
  //   items: []
  // }
  //
  // 상품 추가 후:
  // {
  //   items: [
  //     { id: 423, name: "TV 1", price: 500000, ... },
  //     { id: 431, name: "TV 2", price: 600000, ... }
  //   ]
  // }
  reducers: {
    // reducers: 상태를 변경하는 함수들
    // 각 reducer는 자동으로 액션으로 변환됨
    addToCompare: (state, action) => {
      // addToCompare: 비교 상품 추가 액션
      // state: 현재 Redux 상태
      // action: 디스패치된 액션 객체
      //   - action.payload: 추가할 상품 정보
      if (state.items.length < 4) {
        // state.items.length < 4: 최대 4개 제한
        // 4개 미만일 때만 추가 가능
        const exists = state.items.find(
          (item) => item.id === action.payload.id
        );
        // state.items.find(): 배열에서 조건에 맞는 첫 번째 요소 찾기
        // (item) => item.id === action.payload.id: 같은 ID가 있는지 확인
        //
        // 예:
        // state.items = [{ id: 423, ... }]
        // action.payload = { id: 423, ... }
        // → exists = { id: 423, ... } (이미 존재)
        //
        // state.items = [{ id: 423, ... }]
        // action.payload = { id: 431, ... }
        // → exists = undefined (존재하지 않음)
        if (!exists) {
          // !exists: 중복되지 않은 경우에만 추가
          state.items.push(action.payload);
          // state.items.push(): 배열에 상품 추가
          // action.payload: 추가할 상품 객체
          //
          // Redux Toolkit은 Immer를 내장하므로
          // 직접 state를 변경해도 불변성 유지됨
          //
          // 추가 후 상태:
          // {
          //   items: [
          //     { id: 423, name: "TV 1", ... },
          //     { id: 431, name: "TV 2", ... }  ← 새로 추가
          //   ]
          // }
        }
      }
    },
    removeFromCompare: (state, action) => {
      // removeFromCompare: 비교 상품 제거 액션
      // action.payload: 제거할 상품의 ID
      state.items = state.items.filter((item) => item.id !== action.payload);
      // state.items.filter(): 조건에 맞는 요소만 남기기
      // (item) => item.id !== action.payload: ID가 다른 것만 유지
      //
      // 제거 전:
      // items = [
      //   { id: 423, ... },
      //   { id: 431, ... },
      //   { id: 469, ... }
      // ]
      //
      // action.payload = 431
      //
      // 제거 후:
      // items = [
      //   { id: 423, ... },
      //   { id: 469, ... }
      // ]
    },
    clearCompare: (state) => {
      // clearCompare: 모든 비교 상품 삭제
      state.items = [];
      // 빈 배열로 초기화
      // 모든 비교 상품 제거
    },
  },
  // extraReducers: 다른 slice의 액션에 반응
  extraReducers: (builder) => {
    builder.addCase('user/logout', (state) => {
      // logout 액션 발생 시 비교함 초기화
      state.items = [];
    });
  },
});

export const { addToCompare, removeFromCompare, clearCompare } =
  compareSlice.actions;
// compareSlice.actions: 자동 생성된 액션 함수들
// export: 다른 컴포넌트에서 사용할 수 있도록 내보내기
//
// 사용 예:
// dispatch(addToCompare({ id: 423, name: "TV 1", ... }))
// dispatch(removeFromCompare(423))
// dispatch(clearCompare())
export default compareSlice.reducer;
// compareSlice.reducer: 리듀서 함수
// Redux store에 등록할 리듀서

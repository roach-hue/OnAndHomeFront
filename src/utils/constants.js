/**
 * 상수 정의
 */

// API 기본 URL
export const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8080";

// 이미지 경로
export const IMAGE_BASE_URL = `${API_BASE_URL}/uploads`;
export const PRODUCT_IMAGE_URL = `${API_BASE_URL}/product_img`;

// 기본 이미지
export const DEFAULT_PRODUCT_IMAGE = "/product_img/placeholder.jpg";

// 페이지당 아이템 수
export const ITEMS_PER_PAGE = 12;
export const REVIEWS_PER_PAGE = 10;
export const QNA_PER_PAGE = 10;
export const NOTICES_PER_PAGE = 10;
export const ORDERS_PER_PAGE = 10;

// 카테고리 정의
export const CATEGORIES = [
  {
    parentName: "TV/오디오",
    children: ["TV", "오디오"],
  },
  {
    parentName: "주방가전",
    children: ["냉장고", "전자레인지", "식기세척기"],
  },
  {
    parentName: "생활가전",
    children: ["세탁기", "청소기"],
  },
  {
    parentName: "에어컨/공기청정기",
    children: ["에어컨", "공기청정기"],
  },
  {
    parentName: "기타",
    children: ["정수기", "안마의자", "PC"],
  },
];

// 주문 상태
export const ORDER_STATUS = {
  PENDING: "주문 대기",
  CONFIRMED: "주문 확인",
  PROCESSING: "처리 중",
  SHIPPED: "배송 중",
  DELIVERED: "배송 완료",
  CANCELLED: "주문 취소",
};

// 배송 상태
export const DELIVERY_STATUS = {
  PREPARING: "배송 준비",
  IN_TRANSIT: "배송 중",
  DELIVERED: "배송 완료",
};

// 사용자 역할
export const USER_ROLES = {
  USER: "ROLE_USER",
  ADMIN: "ROLE_ADMIN",
};

// 로컬 스토리지 키
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  USER_INFO: "userInfo",
  CART_ITEMS: "cartItems",
};

// 에러 메시지
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "네트워크 오류가 발생했습니다. 다시 시도해주세요.",
  LOGIN_REQUIRED: "로그인이 필요합니다.",
  UNAUTHORIZED: "권한이 없습니다.",
  SERVER_ERROR: "서버 오류가 발생했습니다.",
  INVALID_INPUT: "입력 정보를 확인해주세요.",
};

// 성공 메시지
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: "로그인되었습니다.",
  SIGNUP_SUCCESS: "회원가입이 완료되었습니다.",
  UPDATE_SUCCESS: "정보가 수정되었습니다.",
  DELETE_SUCCESS: "삭제되었습니다.",
  ADD_TO_CART_SUCCESS: "장바구니에 추가되었습니다.",
  ORDER_SUCCESS: "주문이 완료되었습니다.",
};

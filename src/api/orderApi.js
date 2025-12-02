import apiClient from "./axiosConfig";

/**
 * 주문 관련 API - Spring Boot 엔드포인트에 맞게 요청을 보냄
 */
const orderApi = {
  /**
   * 주문 생성
   * POST /api/orders/create
   */
  createOrder: async (orderData) => {
    const response = await apiClient.post("/api/orders/create", orderData);
    return response.data;
  },

  /**
   * 사용자의 모든 주문 조회
   * GET /api/orders/user/{userId}
   *
   * // 마이페이지의 "주문 내역" 리스트를 불러오는 API
   * // 숨김 처리되지 않은 주문만 서버에서 필터링하여 반환됨
   * // 최신 주문이 가장 위에 정렬된 상태로 전달된다
   */
  getUserOrders: async (userId) => {
    const response = await apiClient.get(`/api/orders/user/${userId}`);
    return response.data;
  },

  /**
   * 주문 상세 조회
   * GET /api/orders/{orderId}
   *
   * // 주문 내역에서 특정 주문을 클릭했을 때 상세 정보를 조회하는 API
   * // 주문 상품 목록, 배송 정보, 결제 상태, 결제 완료 시간까지 모두 포함된다
   * // 취소된 주문, 결제 대기 주문 등 모든 상태의 주문 상세가 확인 가능하다
   */
  getOrderDetail: async (orderId) => {
    const response = await apiClient.get(`/api/orders/${orderId}`);
    return response.data;
  },

  /**
   * 주문 결제 처리
   * POST /api/orders/{orderId}/pay
   */
  payOrder: async (orderId) => {
    const response = await apiClient.post(`/api/orders/${orderId}/pay`);
    return response.data;
  },

  /**
   * 주문 취소
   * POST /api/orders/{orderId}/cancel
   */
  cancelOrder: async (orderId) => {
    const response = await apiClient.post(`/api/orders/${orderId}/cancel`);
    return response.data;
  },
};

export default orderApi;

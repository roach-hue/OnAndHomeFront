import apiClient from "./axiosConfig";

/**
 * 리뷰 관련 API
 */
const reviewApi = {
  /**
   * 상품 리뷰 목록 조회
   */
  getProductReviews: async (productId, page = 0, size = 10) => {
    const response = await apiClient.get(`/api/reviews/product/${productId}`, {
      params: { page, size },
    });
    return response.data;
  },

  /**
   * 리뷰 작성
   */
  createReview: async (reviewData) => {
    const response = await apiClient.post("/api/reviews", reviewData);
    return response.data;
  },

  /**
   * 리뷰 수정
   */
  updateReview: async (reviewId, reviewData) => {
    const response = await apiClient.put(
      `/api/reviews/${reviewId}`,
      reviewData
    );
    return response.data;
  },

  /**
   * 리뷰 삭제
   */
  deleteReview: async (reviewId) => {
    const response = await apiClient.delete(`/api/reviews/${reviewId}`);
    return response.data;
  },

  /**
   * 내 리뷰 목록 조회
   */
  getMyReviews: async () => {
    const response = await apiClient.get("/api/reviews/my", {});
    return response.data;
  },

  /**
   * 최근 리뷰 조회
   */
  getRecentReviews: async (limit = 5) => {
    const response = await apiClient.get("/api/reviews/recent", {
      params: { limit },
    });
    return response.data;
  },
};

export default reviewApi;

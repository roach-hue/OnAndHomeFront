// src/api/reviewApi.js

import apiClient from "./axiosConfig";

const reviewApi = {
  /**
   * 리뷰 목록 조회
   */
  getProductReviews: async (productId, userId = null, page = 0, size = 10) => {
    const params = { page, size };
    if (userId) {
      params.userId = userId;
    }
    const response = await apiClient.get(`/api/reviews/product/${productId}`, {
      params,
    });
    return response.data?.data || [];
  },

  /**
   * 리뷰 작성 (이미지 여부에 따라 자동 분기)
   */
  createReview: async (reviewData) => {
    const isFormData = reviewData instanceof FormData;

    const url = isFormData
      ? "/api/reviews/with-images" // 이미지 포함 요청
      : "/api/reviews";            // 텍스트-only 기존 요청

    const config = isFormData
      ? { headers: { "Content-Type": "multipart/form-data" } }
      : {};

    const response = await apiClient.post(url, reviewData, config);
    return response.data;
  },

  /**
   * 리뷰 수정 (텍스트 + 이미지 삭제/추가)
   * @param {number} reviewId 
   * @param {object} data { content, rating, deleteImageIds: [], newImages: [] }
   */
  updateReview: async (reviewId, data) => {
    // FormData인지 일반 객체인지 확인
    if (data instanceof FormData) {
      // FormData로 직접 전송
      const response = await apiClient.put(
        `/api/reviews/${reviewId}/with-images`,
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    }
    
    // 일반 객체인 경우 FormData로 변환
    const formData = new FormData();

    // 텍스트 파트
    formData.append("content", data.content);
    formData.append("rating", data.rating);

    // 삭제할 이미지 id 리스트
    if (data.deleteImageIds && data.deleteImageIds.length > 0) {
      data.deleteImageIds.forEach((id) => {
        formData.append("deleteImageIds", id);
      });
    }

    // 새로 추가할 이미지들 (file 리스트)
    if (data.newImages && data.newImages.length > 0) {
      data.newImages.forEach((file) => {
        formData.append("images", file);
      });
    }

    // PUT 요청
    const response = await apiClient.put(
      `/api/reviews/${reviewId}/with-images`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
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

  /**
   * 좋아요 토글
   */
  toggleLike: async (reviewId, userId) => {
    const response = await apiClient.post(
      `/api/reviews/${reviewId}/like`,
      null,
      { params: { userId } }
    );
    return response.data;
  },
};

export default reviewApi;

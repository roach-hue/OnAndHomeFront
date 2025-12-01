import apiClient from './axiosConfig';

/**
 * Q&A 관련 API
 */
const qnaApi = {
  /**
   * Q&A 목록 조회
   */
  getQnaList: async (page = 0, size = 10) => {
    const response = await apiClient.get('/api/qna/list', {
      params: { page, size }
    });
    return response.data;
  },

  /**
   * 상품별 Q&A 목록 조회
   */
  getProductQnas: async (productId) => {
    const response = await apiClient.get(`/api/qna/product/${productId}`);
    return response.data;
  },

  /**
   * Q&A 상세 조회
   */
  getQnaDetail: async (qnaId) => {
    const response = await apiClient.get(`/api/qna/${qnaId}`);
    return response.data;
  },

  /**
   * Q&A 작성
   */
  createQna: async (qnaData) => {
    const response = await apiClient.post('/api/qna', qnaData);
    return response.data;
  },

  /**
   * Q&A 수정
   */
  updateQna: async (qnaId, qnaData) => {
    const response = await apiClient.put(`/api/qna/${qnaId}`, qnaData);
    return response.data;
  },

  /**
   * Q&A 삭제
   */
  deleteQna: async (qnaId) => {
    const response = await apiClient.delete(`/api/qna/${qnaId}`);
    return response.data;
  },

  /**
   * 내 Q&A 목록 조회
   */
  getMyQna: async (page = 0, size = 10) => {
    const response = await apiClient.get('/api/qna/my', {
      params: { page, size }
    });
    return response.data;
  },

  /**
   * 최근 Q&A 조회
   */
  getRecentQnas: async (limit = 5) => {
    const response = await apiClient.get('/api/qna/recent', {
      params: { limit }
    });
    return response.data;
  },
};

export default qnaApi;

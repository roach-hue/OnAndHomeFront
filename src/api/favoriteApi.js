// 찜하기 API
const BASE_URL = 'http://localhost:8080/api/favorites';

const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const favoriteAPI = {
  // 찜하기 토글 (추가/삭제)
  toggle: async (productId) => {
    try {
      const response = await fetch(`${BASE_URL}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ productId })
      });
      return await response.json();
    } catch (error) {
      console.error('찜하기 토글 오류:', error);
      throw error;
    }
  },

  // 찜 여부 확인
  check: async (productId) => {
    try {
      const response = await fetch(`${BASE_URL}/check/${productId}`, {
        headers: getAuthHeader()
      });
      return await response.json();
    } catch (error) {
      console.error('찜 여부 확인 오류:', error);
      return { success: true, isFavorite: false };
    }
  },

  // 찜 목록 조회
  getList: async () => {
    try {
      const response = await fetch(BASE_URL, {
        headers: getAuthHeader()
      });
      return await response.json();
    } catch (error) {
      console.error('찜 목록 조회 오류:', error);
      throw error;
    }
  },

  // 찜 개수 조회
  getCount: async () => {
    try {
      const response = await fetch(`${BASE_URL}/count`, {
        headers: getAuthHeader()
      });
      return await response.json();
    } catch (error) {
      console.error('찜 개수 조회 오류:', error);
      return { success: true, count: 0 };
    }
  }
};


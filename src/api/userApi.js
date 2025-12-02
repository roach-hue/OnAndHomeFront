import apiClient from "./axiosConfig";

/**
 * 사용자 관련 API 모음
 * - 관리자 페이지의 회원 관리 기능과 직접 연결됨
 */
const userApi = {
  // 현재 로그인한 사용자 정보 조회
  // 관리자 페이지에서 특정 회원 선택 시 상세 정보를 불러오는 흐름과 동일한 구조
  getUserInfo: async () => {
    const response = await apiClient.get("/api/user/info");
    return response.data;
  },

  // 사용자 정보 수정
  // 관리자 페이지에서 회원 정보를 변경할 때 사용하는 기능과 같은 구조
  updateUserInfo: async (userData) => {
    const response = await apiClient.put("/api/user/info", userData);
    return response.data;
  },

  // 비밀번호 변경
  // 관리자 페이지에서도 비밀번호 재설정 기능과 대응됨
  changePassword: async (passwordData) => {
    const response = await apiClient.put("/api/user/password", passwordData);
    return response.data;
  },

  // 회원 탈퇴(삭제)
  // 관리자에서 단일 삭제/다중 삭제와 동일한 흐름이며
  // 서버에서는 UserService.deleteUser()로 연결됨
  deleteAccount: async (verificationCode) => {
    const response = await apiClient.delete("/api/user/account", {
      // DELETE 요청은 body를 직접 넣을 수 없어서 data 속성으로 전달
      data: { verificationCode },
    });
    return response.data;
  },
};

export default userApi;

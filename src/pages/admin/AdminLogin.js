import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../store/slices/userSlice';
import axios from 'axios';
import './AdminLogin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // API Base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  /**
   * handleSubmit() - 관리자 로그인 처리
   *
   * 호출 위치: "로그인" 버튼 클릭 시 (/admin/login 페이지)
   *
   * 처리 흐름:
   * 1. axios.post() 로 일반 사용자 로그인 API 호출 (POST /api/user/login)
   * 2. JWT 토큰 및 사용자 정보 받기
   * 3. ★ 중요: user.role === 0 인지 검증 (관리자 권한 확인)
   * 4. role=0 이면 토큰 저장 + 관리자 대시보드로 이동
   * 5. role=1 이면 "관리자 권한이 없습니다" 에러
   *
   * 일반 사용자 로그인(Login.js)과의 차이점:
   *
   * 1. 일반 사용자 로그인 (Login.js):
   *    - 경로: /login
   *    - role 검증: 없음 (role=0, role=1 모두 로그인 가능)
   *    - 이동: 메인 페이지 ('/')
   *    - 특징: 관리자도 여기서 로그인하면 메인 페이지로 감
   *
   * 2. 관리자 로그인 (AdminLogin.js - 이 파일):
   *    - 경로: /admin/login
   *    - ★ role 검증: user.role === 0 체크 (관리자만 허용)
   *    - 이동: 관리자 대시보드 ('/admin/dashboard')
   *    - 특징: role=1 사용자는 로그인 거부 (에러 메시지)
   *
   * role 값 의미:
   * - role = 0: 관리자 (ROLE_ADMIN)
   * - role = 1: 일반 사용자 (ROLE_USER)
   *
   * 관리자 권한 부여 방법:
   * - 회원가입 시에는 모두 role=1로 설정됨 (UserController.register())
   * - 관리자 권한은 DB에서 직접 role을 0으로 변경해야 함
   * - SQL 예시: UPDATE user SET role = 0 WHERE user_id = 'admin@example.com';
   *
   * 데이터 흐름:
   * [프론트엔드] formData → axios.post() → [백엔드] UserController.login()
   * → UserService.login() (userId/password 검증)
   * → JWT 토큰 생성 + user 정보 반환
   * → [프론트엔드] user.role 체크
   * → role=0 이면: 토큰 저장 + 관리자 대시보드 이동
   * → role=1 이면: "관리자 권한이 없습니다" 에러
   */
  const handleSubmit = async (e) => {
    // 폼 기본 제출 동작 방지
    e.preventDefault();
    
    // 중복 요청 방지
    if (loading) return;

    // 로딩 상태로 전환
    setLoading(true);
    setError('');
    
    try {
      console.log('=== 관리자 로그인 시도 ===');
      console.log('아이디:', formData.username);
      
      /**
       * 1. 일반 사용자 로그인 API 호출
       *
       * 주의: 관리자 전용 API가 아니라 일반 로그인 API 사용
       * 이유: 로그인 처리 로직은 동일, 권한 검증만 프론트에서 처리
       *
       * axios.post()
       * - 요청: POST http://localhost:8080/api/user/login
       * - Body: {userId: "admin", password: "admin1234"}
       * - Header: Content-Type: application/json
       *
       * 백엔드 처리 (UserController.login()):
       * - userId로 사용자 조회
       * - password BCrypt 검증
       * - JWT 토큰 생성 (accessToken: 60분, refreshToken: 7일)
       * - 응답 반환: {success: true, accessToken, refreshToken, user}
       *   * user 객체에 role 필드 포함: 0(관리자) or 1(일반사용자)
       */
      const response = await axios.post(
        `${API_BASE_URL}/api/user/login`,
        {
          userId: formData.username,
          password: formData.password
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('로그인 응답:', response.data);

      // 2. 로그인 성공 처리
      if (response.data && response.data.accessToken) {
        const { accessToken, refreshToken, user } = response.data;
      // 테스트용 하드코딩된 로그인 체크
      if (formData.username === 'admin' && formData.password === 'admin123') {
        // 관리자 정보 저장
        const adminUser = {
          id: 1,
          username: 'admin',
          name: 'Admin',
          role: 0 // 0은 관리자
        };

        localStorage.setItem('adminToken', 'admin-token-123');
        localStorage.setItem('accessToken', 'admin-token-123');
        localStorage.setItem('userInfo', JSON.stringify(adminUser));
        /**
         * 3. ★ 관리자 권한 확인 (가장 중요!)
         *
         * user.role 값 확인:
         * - role === 0: 관리자 → 로그인 허용
         * - role === 1: 일반 사용자 → 로그인 거부 + 에러 메시지
         *
         * 이 체크가 없으면:
         * - 일반 사용자도 관리자 페이지에 접근 가능 (보안 문제!)
         */
        if (user.role !== 0) {
          // role이 0이 아니면 (즉, 일반 사용자면)
          setError('관리자 권한이 없습니다.');
          setLoading(false);
          return; // 함수 종료 (로그인 차단)
        }

        /**
         * 4. 토큰 및 사용자 정보 저장
         *
         * localStorage에 저장:
         * - accessToken: JWT 액세스 토큰 (인증용)
         * - refreshToken: JWT 리프레시 토큰 (토큰 갱신용)
         * - userInfo: 사용자 정보 JSON (직렬화해서 저장)
         *
         * 저장된 userInfo 예시:
         * {
         *   "id": 1,
         *   "userId": "admin",
         *   "username": "관리자",
         *   "email": "admin@example.com",
         *   "role": 0,  // ← 관리자
         *   ...
         * }
         */
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('userInfo', JSON.stringify(user));

        console.log('관리자 로그인 성공 - role:', user.role);

        /**
         * 5. Redux store 업데이트
         *
         * dispatch(loginSuccess(...))
         * - userSlice에 사용자 정보 및 토큰 저장
         * - 전역 상태 관리 (모든 컴포넌트에서 접근 가능)
         */
        dispatch(loginSuccess({
          user: adminUser,
          accessToken: 'admin-token-123'
        }));
        
        /**
         * 6. 관리자 대시보드로 이동
         *
         * navigate('/admin/dashboard')
         * - 관리자 메인 페이지로 이동
         * - 대시보드에서 통계, 주문 관리, 상품 관리 등 가능
         *
         * 일반 사용자 로그인과의 차이:
         * - Login.js: navigate('/') - 메인 페이지
         * - AdminLogin.js: navigate('/admin/dashboard') - 관리자 대시보드
         */
        navigate('/admin/dashboard');
      } else {
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('로그인 실패:', error);
      
      /**
       * 7. 에러 처리
       */
      if (error.response?.status === 401) {
        // 401 Unauthorized: 아이디 또는 비밀번호 불일치
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      } else if (error.response?.data?.message) {
        // 서버에서 반환한 에러 메시지
        setError(error.response.data.message);
      } else {
        // 기타 에러
        setError('로그인 중 오류가 발생했습니다.');
      }
    } finally {
      // 로딩 상태 해제 (성공/실패 모두)
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-box">
        <div className="login-header">
          <h1>On&Home</h1>
          <span className="logo-icon">🏠</span>
        </div>
        
        <h2>관리자 로그인</h2>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">아이디</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="관리자 아이디를 입력하세요"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="login-button">
            로그인
          </button>
        </form>
        
        <div className="login-footer">
          <p>관리자 전용 페이지입니다.</p>
          <p>권한이 없는 사용자는 접근할 수 없습니다.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

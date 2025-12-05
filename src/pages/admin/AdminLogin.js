import axios from 'axios';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginSuccess } from '../../store/slices/userSlice';
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
   * role 값 의미:
   * - role = 0: 관리자 (ROLE_ADMIN)
   * - role = 1: 일반 사용자 (ROLE_USER)
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
      
      // API 로그인 호출
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

      // 로그인 성공 처리
      if (response.data && response.data.accessToken) {
        const { accessToken, refreshToken, user } = response.data;

        // 관리자 권한 확인 (role === 0만 허용)
        if (user.role !== 0) {
          setError('관리자 권한이 없습니다.');
          setLoading(false);
          return;
        }

        // 토큰 및 사용자 정보 저장
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('adminToken', accessToken);
        localStorage.setItem('userInfo', JSON.stringify(user));

        console.log('관리자 로그인 성공 - role:', user.role);

        // Redux store 업데이트
        dispatch(loginSuccess({
          user: user,
          accessToken: accessToken
        }));
        
        // 관리자 대시보드로 이동
        navigate('/admin/dashboard');
      } else {
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('로그인 실패:', error);
      
      // 에러 처리
      if (error.response?.status === 401) {
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
<div className="admin-login-container">
  <div className="admin-login-box">
    <div className="login-header">
      <img src="/images/logo.png" alt="On&Home" className="login-logo" />
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
          
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
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

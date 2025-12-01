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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (loading) return;
    
    setLoading(true);
    setError('');
    
    try {
      console.log('=== 관리자 로그인 시도 ===');
      console.log('아이디:', formData.username);
      
      // 실제 API 호출
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
      
      if (response.data && response.data.accessToken) {
        const { accessToken, refreshToken, user } = response.data;
        
        // 관리자 권한 확인 (role === 0)
        if (user.role !== 0) {
          setError('관리자 권한이 없습니다.');
          setLoading(false);
          return;
        }
        
        // 토큰 저장
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('userInfo', JSON.stringify(user));
        
        console.log('관리자 로그인 성공 - role:', user.role);
        
        // Redux store 업데이트
        dispatch(loginSuccess({
          user,
          accessToken
        }));
        
        // 대시보드로 이동
        navigate('/admin/dashboard');
      } else {
        setError('로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('로그인 실패:', error);
      
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

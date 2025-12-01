import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
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
    
    try {
      // API 호출 (실제 구현 시 백엔드 API 사용)
      // const response = await fetch('/api/admin/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });
      
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
        
        // Redux store 업데이트
        dispatch(loginSuccess({
          user: adminUser,
          accessToken: 'admin-token-123'
        }));
        
        // 대시보드로 이동
        navigate('/admin/dashboard');
      } else {
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('로그인 실패:', error);
      setError('로그인 중 오류가 발생했습니다.');
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

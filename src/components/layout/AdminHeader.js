import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/userSlice';
import { authAPI } from '../../api';

const AdminHeader = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  
  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('로그아웃 오류:', error);
    } finally {
      dispatch(logout());
      // 홈페이지로 이동하면서 완전히 새로고침
      window.location.href = '/';
    }
  };
  
  return (
    <header className="admin-header">
      <div className="admin-header-content">
        <Link to="/admin" className="admin-logo">
          <img src="/images/logo.png" alt="OnAndHome Admin" />
          <span>관리자</span>
        </Link>
        
        <div className="admin-header-right">
          <span className="admin-user">{user?.userId} 관리자</span>
          <Link to="/" className="btn-home">홈으로</Link>
          <button onClick={handleLogout} className="btn-logout">로그아웃</button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './AdminSidebar.css';

const AdminSidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      id: 'dashboard',
      name: '대시보드',
      icon: '📊',
      path: '/admin/dashboard'
    },
    {
      id: 'members',
      name: '회원 관리',
      icon: '👥',
      path: '/admin/users'
    },
    {
      id: 'deleted-members',
      name: '탈퇴 회원',
      icon: '🚫',
      path: '/admin/users/deleted'
    },
    {
      id: 'products',
      name: '상품 관리',
      icon: '📦',
      path: '/admin/products'
    },
    {
      id: 'orders',
      name: '주문 관리',
      icon: '🛒',
      path: '/admin/orders'
    },
    {
      id: 'notices',
      name: '공지사항',
      icon: '📄',
      path: '/admin/notices'
    },
    {
      id: 'qna',
      name: 'Q&A',
      icon: '📝',
      path: '/admin/qna'
    },
    {
      id: 'reviews',
      name: '리뷰',
      icon: '⭐',
      path: '/admin/reviews'
    },
    {
      id: 'advertisements',
      name: '광고',
      icon: '📢',
      path: '/admin/advertisements'
    }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <Link to="/admin" className="logo">
          <span className="logo-text">On&Home</span>
          <span className="logo-icon">🏠</span>
        </Link>
      </div>

      <div className="sidebar-user">
        <span className="user-label">Admin</span>
      </div>

      <div className="breadcrumb">
        <Link to="/" className="logout-link">메인으로</Link>
      </div>

      <nav className="sidebar-nav">
        <ul className="menu-list">
          {menuItems.map(item => (
            <li key={item.id} className={isActive(item.path) ? 'active' : ''}>
              <Link to={item.path}>
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-text">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default AdminSidebar;

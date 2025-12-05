import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const AdminSidebar = () => {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname.startsWith(path) ? 'active' : '';
  };
  
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          <li className={isActive('/admin/dashboard')}>
            <Link to="/admin">
              <img src="/images/menu_dash.png" alt="" />
              <span>대시보드</span>
            </Link>
          </li>
          <li className={isActive('/admin/users') && !location.pathname.includes('/deleted')}>
            <Link to="/admin/users">
              <img src="/images/member.png" alt="" />
              <span>회원 관리</span>
            </Link>
          </li>
          <li className={location.pathname.includes('/admin/users/deleted') ? 'active' : ''}>
            <Link to="/admin/users/deleted">
              <img src="/images/member.png" alt="" />
              <span>탈퇴 회원</span>
            </Link>
          </li>
          <li className={isActive('/admin/products')}>
            <Link to="/admin/products">
              <img src="/images/item.png" alt="" />
              <span>상품 관리</span>
            </Link>
          </li>
          <li className={isActive('/admin/orders')}>
            <Link to="/admin/orders">
              <img src="/images/order.png" alt="" />
              <span>주문 관리</span>
            </Link>
          </li>
          <li className={isActive('/admin/notices')}>
            <Link to="/admin/notices">
              <img src="/images/board.png" alt="" />
              <span>공지사항</span>
            </Link>
          </li>
          <li className={isActive('/admin/qna')}>
            <Link to="/admin/qna">
              <img src="/images/board.png" alt="" />
              <span>Q&A</span>
            </Link>
          </li>
          <li className={isActive('/admin/reviews')}>
            <Link to="/admin/reviews">
              <img src="/images/board.png" alt="" />
              <span>리뷰</span>
            </Link>
          </li>
          <li className={isActive('/admin/advertisements')}>
            <Link to="/admin/advertisements">
              <img src="/images/board.png" alt="" />
              <span>광고</span>
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar;

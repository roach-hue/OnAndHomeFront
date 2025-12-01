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
          <li className={isActive('/admin/users')}>
            <Link to="/admin/users">
              <img src="/images/member.png" alt="" />
              <span>회원 관리</span>
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
          <li className={isActive('/admin/notice')}>
            <Link to="/admin/notice">
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
          <li className={isActive('/admin/review')}>
            <Link to="/admin/review">
              <img src="/images/board.png" alt="" />
              <span>리뷰</span>
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar;

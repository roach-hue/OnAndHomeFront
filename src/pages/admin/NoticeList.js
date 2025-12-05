import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import noticeApi from '../../api/noticeApi';
import './NoticeList.css';

const NoticeList = () => {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const data = await noticeApi.getAllNotices();
      // 날짜 기준 내림차순 정렬
      const sortedData = data.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setNotices(sortedData);
    } catch (error) {
      console.error('공지사항 로드 실패:', error);
      alert('공지사항을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const filteredNotices = notices.filter(notice =>
    notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (notice.writer && notice.writer.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNotices = filteredNotices.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredNotices.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleWriteClick = () => {
    navigate('/admin/notices/write');
  };

  const handleNoticeClick = (id) => {
    navigate(`/admin/notices/${id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        await noticeApi.deleteNotice(id);
        alert('삭제되었습니다.');
        fetchNotices(); // 목록 새로고침
      } catch (error) {
        console.error('삭제 실패:', error);
        alert('삭제에 실패했습니다.');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\. /g, '-').replace('.', '');
  };

  return (
    <div className="admin-notice-list">
      <AdminSidebar />
      
      <div className="notice-list-main">
        <div className="notice-container">
          <div className="notice-header">
            <h1>공지사항 관리</h1>
            <p className="notice-description">사용자에게 표시될 공지사항을 관리합니다</p>
          </div>

          <div className="notice-controls">
            <div className="search-box">
              <input
                type="text"
                placeholder="제목 또는 작성자로 검색"
                value={searchTerm}
                onChange={handleSearch}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
            <button className="btn-write" onClick={handleWriteClick}>
              <span className="btn-icon">✏️</span>
              공지사항 작성
            </button>
          </div>

          <div className="notice-stats">
            <span className="total-count">전체 {filteredNotices.length}건</span>
          </div>

          {loading ? (
            <div className="loading">로딩 중...</div>
          ) : (
            <>
              <div className="notice-table-wrapper">
                <table className="notice-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>번호</th>
                      <th style={{ width: 'auto' }}>제목</th>
                      <th style={{ width: '120px' }}>작성자</th>
                      <th style={{ width: '120px' }}>작성일</th>
                      <th style={{ width: '150px' }}>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentNotices.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="no-data">
                          등록된 공지사항이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      currentNotices.map((notice, index) => (
                        <tr key={notice.id}>
                          <td>{indexOfFirstItem + index + 1}</td>
                          <td className="title-cell">
                            <span
                              className="notice-title"
                              onClick={() => handleNoticeClick(notice.id)}
                            >
                              {notice.title}
                            </span>
                          </td>
                          <td>{notice.writer || '관리자'}</td>
                          <td>{formatDate(notice.createdAt)}</td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="btn-edit"
                                onClick={() => navigate(`/admin/notices/edit/${notice.id}`)}
                              >
                                수정
                              </button>
                              <button
                                className="btn-delete"
                                onClick={() => handleDelete(notice.id)}
                              >
                                삭제
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="page-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    이전
                  </button>
                  
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      className={`page-btn ${currentPage === index + 1 ? 'active' : ''}`}
                      onClick={() => handlePageChange(index + 1)}
                    >
                      {index + 1}
                    </button>
                  ))}
                  
                  <button
                    className="page-btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    다음
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoticeList;

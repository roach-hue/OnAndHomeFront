import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import axios from 'axios';
import './ProductList.css';

const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // API Base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

  const categories = ['all', 'TV/모니터', 'TV', '에어컨', '냉장고', '세탁기', '주방가전', '전자레인지', '오디오', '냉장고/세탁기', '식기세척기', '청소기', '공기청정기'];
  const statuses = ['all', '판매중', '품절', '판매중지'];

  useEffect(() => {
    fetchProducts();
  }, [filterCategory, filterStatus]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filterCategory !== 'all') {
        params.append('category', filterCategory);
      }
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      if (searchTerm && searchTerm.trim()) {
        params.append('kw', searchTerm.trim());
      }
      
      const url = `${API_BASE_URL}/api/admin/products${params.toString() ? '?' + params.toString() : ''}`;
      console.log('=== Fetching products ===');
      console.log('URL:', url);
      
      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        console.log('Number of products:', response.data.length);
        
        const mappedProducts = response.data.map((product) => ({
          ...product,
          checked: false,
          // 재고에 따른 상태 자동 설정
          status: product.stock === 0 ? '품절' : '판매중'
        }));
        
        console.log('Mapped products:', mappedProducts);
        setProducts(mappedProducts);
        console.log('Products state updated');
      } else {
        console.warn('Unexpected response format:', response.data);
        setProducts([]);
      }
    } catch (error) {
      console.error('=== 상품 목록 조회 실패 ===');
      console.error('Error object:', error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        alert('상품 목록을 불러오는데 실패했습니다.');
      } else if (error.request) {
        console.error('No response received');
        alert('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      } else {
        console.error('Error:', error.message);
      }
      
      setProducts([]);
    } finally {
      setLoading(false);
      setSelectAll(false);
    }
  };

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    setProducts(products.map(product => ({ ...product, checked })));
  };

  const handleSelectProduct = (productId) => {
    const updatedProducts = products.map(product => 
      product.id === productId ? { ...product, checked: !product.checked } : product
    );
    setProducts(updatedProducts);
    
    // selectAll 체크박스 상태 업데이트
    const allChecked = updatedProducts.every(product => product.checked);
    setSelectAll(allChecked);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleAddProduct = () => {
    navigate('/admin/products/create');
  };

  const handleEditProduct = (productId) => {
    navigate(`/admin/products/${productId}/edit`);
  };

  const handleDeleteSelected = async () => {
    const selectedProducts = products.filter(product => product.checked);
    
    if (selectedProducts.length === 0) {
      alert('삭제할 상품을 선택해주세요.');
      return;
    }
    
    if (!window.confirm(`선택한 ${selectedProducts.length}개의 상품을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    setLoading(true);
    
    try {
      const productIds = selectedProducts.map(product => product.id);
      
      console.log('Deleting products:', productIds);
      
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        alert('로그인이 필요합니다. 다시 로그인해주세요.');
        navigate('/admin/login');
        return;
      }
      
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/products/delete`,
        { ids: productIds },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('Delete response:', response.data);
      
      if (response.data && response.data.success) {
        alert(response.data.message || `${selectedProducts.length}개의 상품이 삭제되었습니다.`);
        
        // 목록 새로고침
        await fetchProducts();
        setSelectAll(false);
      } else {
        alert(response.data.message || '상품 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('상품 삭제 실패:', error);
      
      if (error.response?.status === 401) {
        alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        navigate('/admin/login');
      } else if (error.response?.status === 403) {
        alert('상품 삭제 권한이 없습니다.');
      } else if (error.response?.status === 404) {
        alert('일부 상품을 찾을 수 없습니다. 목록을 새로고침합니다.');
        fetchProducts();
      } else if (error.code === 'ERR_NETWORK') {
        alert('네트워크 오류가 발생했습니다. 서버가 실행 중인지 확인해주세요.');
      } else {
        alert('상품 삭제 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (productId, currentStatus) => {
    const newStatus = currentStatus === '판매중' ? '판매중지' : '판매중';
    
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        alert('로그인이 필요합니다.');
        navigate('/admin/login');
        return;
      }
      
      const response = await axios.patch(
        `${API_BASE_URL}/api/admin/products/${productId}/status`,
        { status: newStatus },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data && response.data.success) {
        // 로컬 상태 업데이트
        setProducts(products.map(product => 
          product.id === productId ? { ...product, status: newStatus } : product
        ));
        alert(`상품 상태가 '${newStatus}'(으)로 변경되었습니다.`);
      }
    } catch (error) {
      console.error('상태 변경 실패:', error);
      
      if (error.response?.status === 401) {
        alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        navigate('/admin/login');
      } else {
        alert('상태 변경에 실패했습니다.');
      }
    }
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case '판매중':
        return 'status-active';
      case '품절':
        return 'status-outofstock';
      case '판매중지':
        return 'status-inactive';
      default:
        return '';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return dateString;
    }
  };

  // 검색어 필터링
  const filteredProducts = searchTerm.trim() 
    ? products.filter(product => 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        product.productCode?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;

  return (
    <div className="admin-product-list">
      <AdminSidebar />
      
      <div className="product-list-main">
        <div className="page-header">
          <h1>Product List</h1>
          
          <div className="header-controls">
            <button className="add-btn" onClick={handleAddProduct}>
              + 상품 등록
            </button>
          </div>
        </div>

        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner">로딩 중...</div>
          </div>
        )}

        <div className="filter-section">
          <div className="filters">
            <select 
              className="filter-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? '전체 카테고리' : category}
                </option>
              ))}
            </select>
            
            <select 
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status === 'all' ? '전체 상태' : status}
                </option>
              ))}
            </select>
          </div>
          
          <div className="search-box">
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="상품명 또는 상품코드를 입력하세요"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="search-btn">🔍</button>
            </form>
          </div>
        </div>

        <div className="product-table-container">
          <table className="product-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    disabled={filteredProducts.length === 0}
                  />
                </th>
                <th>상품코드</th>
                <th>상품명</th>
                <th>카테고리</th>
                <th>판매가격</th>
                <th>재고</th>
                <th>상태</th>
                <th>등록일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={product.checked || false}
                        onChange={() => handleSelectProduct(product.id)}
                      />
                    </td>
                    <td className="product-code">{product.productCode || '-'}</td>
                    <td className="product-name">{product.name || '-'}</td>
                    <td>{product.category || '-'}</td>
                    <td className="price">
                      {product.price ? product.price.toLocaleString() + '원' : '-'}
                    </td>
                    <td className={`stock ${product.stock === 0 ? 'out-of-stock' : ''}`}>
                      {product.stock !== undefined ? product.stock + '개' : '-'}
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(product.status)}`}>
                        {product.status || '판매중'}
                      </span>
                    </td>
                    <td>{formatDate(product.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="edit-btn" 
                          onClick={() => handleEditProduct(product.id)}
                        >
                          수정
                        </button>
                        <button 
                          className="status-change-btn"
                          onClick={() => handleStatusChange(product.id, product.status)}
                        >
                          {product.status === '판매중' ? '중지' : '재개'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="no-data">
                    {loading ? '로딩 중...' : '등록된 상품이 없습니다.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <button 
            className="delete-btn" 
            onClick={handleDeleteSelected}
            disabled={loading || products.filter(p => p.checked).length === 0}
          >
            선택 삭제
          </button>
          
          <div className="product-summary">
            <span>총 {filteredProducts.length}개 상품</span>
            <span className="separator">|</span>
            <span>판매중: {filteredProducts.filter(p => p.status === '판매중').length}개</span>
            <span className="separator">|</span>
            <span>품절: {filteredProducts.filter(p => p.stock === 0 || p.status === '품절').length}개</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductList;

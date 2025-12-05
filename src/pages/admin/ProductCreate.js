import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import apiClient from '../../api/axiosConfig';
import './ProductForm.css';

const ProductCreate = () => {
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subCategory: '',
    productCode: '',
    manufacturer: '',
    country: '',
    price: '',
    salePrice: '',
    stock: '',
    thumbnailImage: null,
    detailImage: null,
    size: '',
    weight: '',
    power: '',
    material: '',
    additionalFeatures: '',
    productCode2: ''
  });

  const [loading, setLoading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [detailPreview, setDetailPreview] = useState(null);

  // 카테고리 데이터 state
  const [categories, setCategories] = useState([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  // 카테고리 데이터 가져오기
  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/api/admin/products/categories');
      setCategories(response.data);
      console.log('카테고리 데이터 로드 성공:', response.data);
    } catch (error) {
      console.error('카테고리 로드 실패:', error);
      
      if (error.response?.status === 401) {
        alert('로그인이 필요합니다.');
        navigate('/admin/login');
      } else {
        alert('카테고리 데이터를 불러오는데 실패했습니다.');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 대카테고리 선택 핸들러
  const handleMainCategoryChange = (e) => {
    const mainCategoryValue = e.target.value;
    setSelectedMainCategory(mainCategoryValue);
    setFormData(prev => ({
      ...prev,
      category: '' // 소카테고리 초기화
    }));
  };

  // 소카테고리 선택 핸들러
  const handleSubCategoryChange = (e) => {
    const subCategoryValue = e.target.value;
    setFormData(prev => ({
      ...prev,
      category: subCategoryValue
    }));
  };

  // 현재 선택된 대카테고리의 소카테고리 목록 가져오기
  const getCurrentSubCategories = () => {
    if (!selectedMainCategory) return [];
    const mainCat = categories.find(cat => cat.parentCategory === selectedMainCategory);
    return mainCat ? mainCat.subCategories : [];
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        [type]: file
      }));

      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'thumbnailImage') {
          setThumbnailPreview(reader.result);
        } else {
          setDetailPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = (type) => {
    setFormData(prev => ({
      ...prev,
      [type]: null
    }));
    if (type === 'thumbnailImage') {
      setThumbnailPreview(null);
    } else {
      setDetailPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.category || !formData.price) {
      alert('상품명, 카테고리, 정상가격은 필수 입력 항목입니다.');
      return;
    }

    // JWT 토큰 확인
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      alert('로그인이 필요합니다. 다시 로그인해주세요.');
      navigate('/admin/login');
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      
      submitData.append('name', formData.name);
      submitData.append('category', formData.category);
      submitData.append('productCode', formData.productCode || '');
      submitData.append('manufacturer', formData.manufacturer || '');
      submitData.append('country', formData.country || '');
      submitData.append('price', formData.price || 0);
      submitData.append('salePrice', formData.salePrice || formData.price);
      submitData.append('stock', formData.stock || 0);
      
      // 상세스펙을 문자열로 저장
      const specs = [
        formData.size && `크기: ${formData.size}`,
        formData.weight && `무게: ${formData.weight}`,
        formData.power && `전압: ${formData.power}`,
        formData.material && `재질: ${formData.material}`,
        formData.additionalFeatures && `추가상품: ${formData.additionalFeatures}`
      ].filter(Boolean).join(', ');
      
      submitData.append('description', specs);

      if (formData.thumbnailImage) {
        submitData.append('thumbnailImage', formData.thumbnailImage);
        console.log('Uploading thumbnail image');
      }
      if (formData.detailImage) {
        submitData.append('detailImage', formData.detailImage);
        console.log('Uploading detail image');
      }

      console.log('Submitting product data...');
      
      // FormData 내용 로깅
      for (let pair of submitData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      const response = await apiClient.post(
        '/api/admin/products',
        submitData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );

      console.log('Product created:', response.data);
      
      if (response.data && response.data.success) {
        alert('상품이 등록되었습니다.');
        navigate('/admin/products');
      } else {
        alert(response.data.message || '상품 등록에 실패했습니다.');
      }

    } catch (error) {
      console.error('상품 등록 실패:', error);
      
      if (error.response?.status === 401) {
        alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        navigate('/admin/login');
      } else if (error.response?.data?.message) {
        alert(`상품 등록 실패: ${error.response.data.message}`);
      } else {
        alert('상품 등록 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('작성 중인 내용이 삭제됩니다. 취소하시겠습니까?')) {
      navigate('/admin/products');
    }
  };

  return (
    <div className="admin-product-form">
      <AdminSidebar />
      
      <div className="product-form-main">
        <h1>Product Create</h1>

        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner">등록 중...</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <table className="form-table">
              <tbody>
                <tr>
                  <th>상품명</th>
                  <td>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="상품명을 입력하세요"
                      required
                    />
                  </td>
                </tr>
                <tr>
                  <th>카테고리</th>
                  <td>
                    <div className="category-select">
                      <select
                        value={selectedMainCategory}
                        onChange={handleMainCategoryChange}
                        required
                      >
                        <option value="">선택1</option>
                        {categories.map(cat => (
                          <option key={cat.parentCategory} value={cat.parentCategory}>
                            {cat.parentCategoryName}
                          </option>
                        ))}
                      </select>
                      <select
                        value={formData.category}
                        onChange={handleSubCategoryChange}
                        disabled={!selectedMainCategory}
                        required
                      >
                        <option value="">선택2</option>
                        {getCurrentSubCategories().map(subCat => (
                          <option key={subCat} value={subCat}>{subCat}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>제고수량</th>
                  <td>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      placeholder="재고 수량"
                      min="0"
                    />
                  </td>
                </tr>
                <tr>
                  <th>목록이미지</th>
                  <td>
                    <div className="file-upload-container">
                      <label className="file-upload-btn">
                        파일첨부
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'thumbnailImage')}
                          style={{ display: 'none' }}
                        />
                      </label>
                      {thumbnailPreview && (
                        <div className="file-preview">
                          <img src={thumbnailPreview} alt="Thumbnail" />
                          <button
                            type="button"
                            className="remove-file-btn"
                            onClick={() => handleRemoveFile('thumbnailImage')}
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>상세페이지</th>
                  <td>
                    <div className="file-upload-container">
                      <label className="file-upload-btn">
                        파일첨부
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'detailImage')}
                          style={{ display: 'none' }}
                        />
                      </label>
                      {detailPreview && (
                        <div className="file-preview">
                          <img src={detailPreview} alt="Detail" />
                          <button
                            type="button"
                            className="remove-file-btn"
                            onClick={() => handleRemoveFile('detailImage')}
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>제조사</th>
                  <td>
                    <input
                      type="text"
                      name="manufacturer"
                      value={formData.manufacturer}
                      onChange={handleInputChange}
                      placeholder="제조사"
                    />
                  </td>
                </tr>
                <tr>
                  <th>제조국</th>
                  <td>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      placeholder="제조국"
                    />
                  </td>
                </tr>
                <tr>
                  <th>정상가격</th>
                  <td>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="정상가격"
                      required
                      min="0"
                    />
                  </td>
                </tr>
                <tr>
                  <th>할인가격</th>
                  <td>
                    <input
                      type="number"
                      name="salePrice"
                      value={formData.salePrice}
                      onChange={handleInputChange}
                      placeholder="할인가격"
                      min="0"
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="form-buttons">
              <button type="button" className="cancel-btn" onClick={handleCancel}>
                목록
              </button>
              <button type="submit" className="submit-btn" disabled={loading}>
                등록
              </button>
            </div>
          </div>

          <div className="form-section">
            <h2>상세스펙</h2>
            <table className="form-table">
              <tbody>
                <tr>
                  <th>크기</th>
                  <td>
                    <input
                      type="text"
                      name="size"
                      value={formData.size}
                      onChange={handleInputChange}
                      placeholder="크기"
                    />
                  </td>
                </tr>
                <tr>
                  <th>무게</th>
                  <td>
                    <input
                      type="text"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      placeholder="무게"
                    />
                  </td>
                </tr>
                <tr>
                  <th>전압</th>
                  <td>
                    <input
                      type="text"
                      name="power"
                      value={formData.power}
                      onChange={handleInputChange}
                      placeholder="전압"
                    />
                  </td>
                </tr>
                <tr>
                  <th>재질</th>
                  <td>
                    <input
                      type="text"
                      name="material"
                      value={formData.material}
                      onChange={handleInputChange}
                      placeholder="재질"
                    />
                  </td>
                </tr>
                <tr>
                  <th>추가상품</th>
                  <td>
                    <input
                      type="text"
                      name="additionalFeatures"
                      value={formData.additionalFeatures}
                      onChange={handleInputChange}
                      placeholder="추가상품"
                    />
                  </td>
                </tr>
                <tr>
                  <th>제고수량</th>
                  <td>
                    <input
                      type="text"
                      name="productCode2"
                      value={formData.productCode2}
                      onChange={handleInputChange}
                      placeholder="상품코드"
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="form-buttons">
              <button type="button" className="cancel-btn" onClick={handleCancel}>
                목록
              </button>
              <button type="submit" className="submit-btn" disabled={loading}>
                등록
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductCreate;

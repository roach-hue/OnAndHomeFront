import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/userSlice';
import userApi from '../../api/userApi';
import './MyInfo.css';

const MyInfo = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [userInfo, setUserInfo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 수정 폼 상태
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    phone: '',
    address: '',
    detailAddress: '',
    gender: '',
    birthDate: ''
  });

  // 비밀번호 변경 모달 상태
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // 이메일 인증 상태 (비밀번호 변경용)
  const [passwordEmailVerification, setPasswordEmailVerification] = useState({
    codeSent: false,
    code: '',
    verified: false,
    timer: 0,
    timerInterval: null,
  });
  
  // 이메일 인증 상태 (회원 탈퇴용)
  const [deleteEmailVerification, setDeleteEmailVerification] = useState({
    codeSent: false,
    code: '',
    verified: false,
    timer: 0,
    timerInterval: null,
  });
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  /**
   * Daum 우편번호(주소 검색) API 스크립트 동적 로드
   *
   * 실행 시점: 컴포넌트가 마운트될 때 (최초 1회)
   *
   * 처리 흐름:
   * 1. script 태그 생성
   * 2. Daum CDN에서 postcode.v2.js 로드
   * 3. HTML의 <head>에 script 추가
   * 4. 컴포넌트 언마운트 시 script 제거 (메모리 정리)
   *
   * API 제공자: 카카오 (구 Daum)
   * CDN 주소: t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js
   *
   * 사용 목적:
   * - 한국 우편번호 및 도로명 주소 검색
   * - handleAddressSearch() 함수에서 window.daum.Postcode 객체 사용
   */
  useEffect(() => {
    // 1. script 엘리먼트 생성
    const script = document.createElement('script');

    // 2. Daum Postcode API CDN 주소 설정
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

    // 3. 비동기 로드 설정 (페이지 렌더링을 블로킹하지 않음)
    script.async = true;

    // 4. HTML <head>에 script 추가
    document.head.appendChild(script);

    /**
     * cleanup 함수 (컴포넌트 언마운트 시 실행)
     *
     * 역할: 메모리 누수 방지를 위해 추가한 script 태그 제거
     * 실행 시점: 사용자가 MyInfo 페이지를 떠날 때
     */
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []); // 빈 배열: 컴포넌트 마운트 시 1회만 실행

  /**
   * handleAddressSearch() - Daum 주소 검색 팝업 호출
   *
   * 호출 위치: "주소 검색" 버튼 클릭 시
   *
   * 처리 흐름:
   * 1. window.daum.Postcode 객체 생성 (위에서 로드한 API 사용)
   * 2. 주소 검색 팝업 창 열기
   * 3. 사용자가 주소 선택
   * 4. oncomplete 콜백 함수 실행 (data 객체 전달받음)
   * 5. 도로명 주소 + 부가 정보 합치기
   * 6. editForm.address 상태 업데이트
   *
   * data 객체 구조 (예시):
   * {
   *   address: "서울 강남구 테헤란로 123",        // 도로명 주소
   *   addressType: "R",                          // R(도로명) or J(지번)
   *   bname: "역삼동",                           // 법정동명
   *   buildingName: "테헤란빌딩",                  // 건물명
   *   zonecode: "06236"                          // 우편번호
   * }
   */
  const handleAddressSearch = () => {
    // 1. Daum Postcode 객체 생성 및 팝업 설정
    new window.daum.Postcode({
      /**
       * oncomplete: 주소 선택 완료 시 호출되는 콜백 함수
       *
       * @param {Object} data - 선택한 주소 정보를 담은 객체
       */
      oncomplete: function(data) {
        // 2. 기본 주소 (도로명 주소)
        let fullAddress = data.address;

        // 3. 부가 정보 (법정동, 건물명)
        let extraAddress = '';

        /**
         * 4. 도로명 주소일 경우 부가 정보 추가
         *
         * addressType:
         * - 'R': 도로명 주소 (Road address)
         * - 'J': 지번 주소 (Jibun address)
         */
        if (data.addressType === 'R') {
          // 4-1. 법정동명이 있으면 추가 (예: "역삼동")
          if (data.bname !== '') {
            extraAddress += data.bname;
          }

          // 4-2. 건물명이 있으면 추가 (예: "테헤란빌딩")
          if (data.buildingName !== '') {
            // 이미 법정동명이 있으면 쉼표로 구분, 없으면 바로 추가
            extraAddress += (extraAddress !== '' ? ', ' + data.buildingName : data.buildingName);
          }

          // 4-3. 부가 정보가 있으면 괄호로 감싸서 추가
          // 결과 예: "서울 강남구 테헤란로 123 (역삼동, 테헤란빌딩)"
          fullAddress += (extraAddress !== '' ? ' (' + extraAddress + ')' : '');
        }

        /**
         * 5. editForm 상태 업데이트
         *
         * 업데이트되는 필드: address
         * 예시 값: "서울 강남구 테헤란로 123 (역삼동, 테헤란빌딩)"
         *
         * 사용자는 이후 detailAddress 필드에 상세주소를 입력 (예: "101동 202호")
         */
        setEditForm(prev => ({
          ...prev,
          address: fullAddress  // 도로명 주소 + 부가정보
        }));
      }
    }).open(); // 팝업 창 열기
  };

  // 사용자 정보 조회
  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      const response = await userApi.getUserInfo();
      if (response.success) {
        setUserInfo(response.data);
        
        // 주소와 상세주소 분리
        const fullAddress = response.data.address || '';
        const addressParts = fullAddress.split('|');
        
        setEditForm({
          username: response.data.username || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          address: addressParts[0] || '',
          detailAddress: addressParts[1] || '',
          gender: response.data.gender || '',
          birthDate: response.data.birthDate || ''
        });
      }
    } catch (err) {
      console.error('사용자 정보 조회 실패:', err);
      setError('사용자 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 타이머 시작 (비밀번호 변경용)
  const startPasswordTimer = () => {
    if (passwordEmailVerification.timerInterval) {
      clearInterval(passwordEmailVerification.timerInterval);
    }
    
    setPasswordEmailVerification(prev => ({ ...prev, timer: 300 }));
    
    const interval = setInterval(() => {
      setPasswordEmailVerification(prev => {
        if (prev.timer <= 1) {
          clearInterval(interval);
          return { ...prev, timer: 0, timerInterval: null, codeSent: false };
        }
        return { ...prev, timer: prev.timer - 1 };
      });
    }, 1000);
    
    setPasswordEmailVerification(prev => ({ ...prev, timerInterval: interval }));
  };
  
  // 타이머 시작 (회원 탈퇴용)
  const startDeleteTimer = () => {
    if (deleteEmailVerification.timerInterval) {
      clearInterval(deleteEmailVerification.timerInterval);
    }
    
    setDeleteEmailVerification(prev => ({ ...prev, timer: 300 }));
    
    const interval = setInterval(() => {
      setDeleteEmailVerification(prev => {
        if (prev.timer <= 1) {
          clearInterval(interval);
          return { ...prev, timer: 0, timerInterval: null, codeSent: false };
        }
        return { ...prev, timer: prev.timer - 1 };
      });
    }, 1000);
    
    setDeleteEmailVerification(prev => ({ ...prev, timerInterval: interval }));
  };
  
  // 타이머 포맷팅
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // 비밀번호 변경 인증 코드 전송
  const handleSendPasswordCode = async () => {
    if (!userInfo.email) {
      alert('이메일 정보가 없습니다.');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:8080/api/email/send-password-reset-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userInfo.email }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPasswordEmailVerification(prev => ({
          ...prev,
          codeSent: true,
          verified: false,
        }));
        startPasswordTimer();
        alert('인증 코드가 이메일로 전송되었습니다.');
      } else {
        alert(data.message || '인증 코드 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('인증 코드 전송 오류:', error);
      alert('인증 코드 전송 중 오류가 발생했습니다.');
    }
  };
  
  // 비밀번호 변경 인증 코드 확인
  const handleVerifyPasswordCode = async () => {
    if (!passwordEmailVerification.code) {
      alert('인증 코드를 입력해주세요.');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:8080/api/email/verify-password-reset-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userInfo.email,
          code: passwordEmailVerification.code,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (passwordEmailVerification.timerInterval) {
          clearInterval(passwordEmailVerification.timerInterval);
        }
        setPasswordEmailVerification(prev => ({
          ...prev,
          verified: true,
          timer: 0,
          timerInterval: null,
        }));
        alert('인증이 완료되었습니다!');
      } else {
        alert(data.message || '인증 코드가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('인증 코드 확인 오류:', error);
      alert('인증 코드 확인 중 오류가 발생했습니다.');
    }
  };
  
  // 회원 탈퇴 인증 코드 전송
  const handleSendDeleteCode = async () => {
    if (!userInfo.email) {
      alert('이메일 정보가 없습니다.');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:8080/api/email/send-account-deletion-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userInfo.email }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDeleteEmailVerification(prev => ({
          ...prev,
          codeSent: true,
          verified: false,
        }));
        startDeleteTimer();
        alert('인증 코드가 이메일로 전송되었습니다.');
      } else {
        alert(data.message || '인증 코드 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('인증 코드 전송 오류:', error);
      alert('인증 코드 전송 중 오류가 발생했습니다.');
    }
  };
  
  // 회원 탈퇴 인증 코드 확인
  const handleVerifyDeleteCode = async () => {
    if (!deleteEmailVerification.code) {
      alert('인증 코드를 입력해주세요.');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:8080/api/email/verify-account-deletion-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userInfo.email,
          code: deleteEmailVerification.code,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (deleteEmailVerification.timerInterval) {
          clearInterval(deleteEmailVerification.timerInterval);
        }
        setDeleteEmailVerification(prev => ({
          ...prev,
          verified: true,
          timer: 0,
          timerInterval: null,
        }));
        alert('인증이 완료되었습니다!');
      } else {
        alert(data.message || '인증 코드가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('인증 코드 확인 오류:', error);
      alert('인증 코드 확인 중 오류가 발생했습니다.');
    }
  };
  
  // 모달 닫기 시 cleanup
  useEffect(() => {
    return () => {
      if (passwordEmailVerification.timerInterval) {
        clearInterval(passwordEmailVerification.timerInterval);
      }
      if (deleteEmailVerification.timerInterval) {
        clearInterval(deleteEmailVerification.timerInterval);
      }
    };
  }, []);

  // 수정 모드 전환
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      // 취소 시 원래 정보로 되돌림
      const fullAddress = userInfo.address || '';
      const addressParts = fullAddress.split('|');
      
      setEditForm({
        username: userInfo.username || '',
        email: userInfo.email || '',
        phone: userInfo.phone || '',
        address: addressParts[0] || '',
        detailAddress: addressParts[1] || '',
        gender: userInfo.gender || '',
        birthDate: userInfo.birthDate || ''
      });
    }
  };

  // 입력 변경 처리
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 정보 수정 저장
  const handleSaveInfo = async () => {
    try {
      // 주소와 상세주소를 합침 (| 구분자)
      const fullAddress = editForm.detailAddress 
        ? `${editForm.address}|${editForm.detailAddress}`
        : editForm.address;
      
      const updateData = {
        ...editForm,
        address: fullAddress
      };
      
      const response = await userApi.updateUserInfo(updateData);
      if (response.success) {
        alert('회원 정보가 수정되었습니다.');
        setUserInfo(response.data);
        setIsEditing(false);
      }
    } catch (err) {
      console.error('정보 수정 실패:', err);
      alert(err.response?.data?.message || '정보 수정에 실패했습니다.');
    }
  };

  // 비밀번호 변경
  const handlePasswordChange = async () => {
    // 이메일 인증 확인
    if (!passwordEmailVerification.verified) {
      alert('먼저 이메일 인증을 완료해주세요.');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (passwordForm.newPassword.length < 4) {
      alert('비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }

    try {
      const response = await userApi.changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
        verificationCode: passwordEmailVerification.code
      });
      
      if (response.success) {
        alert('비밀번호가 변경되었습니다.');
        setShowPasswordModal(false);
        setPasswordForm({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setPasswordEmailVerification({
          codeSent: false,
          code: '',
          verified: false,
          timer: 0,
          timerInterval: null,
        });
      }
    } catch (err) {
      console.error('비밀번호 변경 실패:', err);
      alert(err.response?.data?.message || '비밀번호 변경에 실패했습니다.');
    }
  };

  // 회원 탈퇴
  const handleDeleteAccount = async () => {
    // 이메일 인증 확인
    if (!deleteEmailVerification.verified) {
      alert('먼저 이메일 인증을 완료해주세요.');
      return;
    }
    
    if (window.confirm('정말로 회원 탈퇴하시겠습니까?\n탈퇴 시 모든 정보가 삭제되며 복구할 수 없습니다.')) {
      try {
        const response = await userApi.deleteAccount(deleteEmailVerification.code);
        if (response.success) {
          alert('회원 탈퇴가 완료되었습니다.');
          
          // Redux logout 액션 dispatch
          dispatch(logout());
          
          // 모든 로컬 스토리지 데이터 완전 삭제
          localStorage.clear();
          
          // 메인 페이지로 강제 이동
          window.location.href = '/';
        }
      } catch (err) {
        console.error('회원 탈퇴 실패:', err);
        alert(err.response?.data?.message || '회원 탈퇴에 실패했습니다.');
      }
    }
  };

  if (loading) {
    return <div className="my-info-container"><div className="loading">로딩 중...</div></div>;
  }

  if (error) {
    return <div className="my-info-container"><div className="error">{error}</div></div>;
  }

  if (!userInfo) {
    return <div className="my-info-container"><div className="error">사용자 정보를 찾을 수 없습니다.</div></div>;
  }

  return (
    <div className="my-info-container">
      <div className="my-info-header">
        <h1>내 정보</h1>
        <button 
          className={`btn-edit-mode ${isEditing ? 'editing' : ''}`}
          onClick={handleEditToggle}
        >
          {isEditing ? '취소' : '수정'}
        </button>
      </div>

      <div className="info-card">
        <div className="info-section">
          <h2>기본 정보</h2>
          
          <div className="info-row">
            <label>아이디</label>
            <div className="info-value">{userInfo.userId}</div>
          </div>

          <div className="info-row">
            <label>이름</label>
            {isEditing ? (
              <input
                type="text"
                name="username"
                value={editForm.username}
                onChange={handleInputChange}
                className="info-input"
              />
            ) : (
              <div className="info-value">{userInfo.username || '-'}</div>
            )}
          </div>

          <div className="info-row">
            <label>이메일</label>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={editForm.email}
                onChange={handleInputChange}
                className="info-input"
              />
            ) : (
              <div className="info-value">{userInfo.email || '-'}</div>
            )}
          </div>

          <div className="info-row">
            <label>전화번호</label>
            {isEditing ? (
              <input
                type="tel"
                name="phone"
                value={editForm.phone}
                onChange={handleInputChange}
                className="info-input"
                placeholder="010-1234-5678"
              />
            ) : (
              <div className="info-value">{userInfo.phone || '-'}</div>
            )}
          </div>

          <div className="info-row">
            <label>성별</label>
            {isEditing ? (
              <select
                name="gender"
                value={editForm.gender}
                onChange={handleInputChange}
                className="info-input"
              >
                <option value="">선택</option>
                <option value="M">남성</option>
                <option value="F">여성</option>
                <option value="O">기타</option>
              </select>
            ) : (
              <div className="info-value">
                {userInfo.gender === 'M' ? '남성' : userInfo.gender === 'F' ? '여성' : userInfo.gender === 'O' ? '기타' : '-'}
              </div>
            )}
          </div>

          <div className="info-row">
            <label>생년월일</label>
            {isEditing ? (
              <input
                type="date"
                name="birthDate"
                value={editForm.birthDate}
                onChange={handleInputChange}
                className="info-input"
              />
            ) : (
              <div className="info-value">{userInfo.birthDate || '-'}</div>
            )}
          </div>

          <div className="info-row">
            <label>주소</label>
            {isEditing ? (
              <div className="address-container">
                <div className="address-input-wrapper">
                  <input
                    type="text"
                    name="address"
                    value={editForm.address}
                    className="info-input address-input"
                    placeholder="주소를 검색하세요"
                    onClick={handleAddressSearch}
                    readOnly
                    style={{ cursor: 'pointer' }}
                  />
                  <button
                    type="button"
                    className="btn-address-search"
                    onClick={handleAddressSearch}
                  >
                    주소 검색
                  </button>
                </div>
                <input
                  type="text"
                  name="detailAddress"
                  value={editForm.detailAddress}
                  onChange={handleInputChange}
                  className="info-input detail-address-input"
                  placeholder="상세주소를 입력하세요 (예: 101동 202호)"
                />
              </div>
            ) : (
              <div className="info-value">
                {userInfo.address ? userInfo.address.replace('|', ' ') : '-'}
              </div>
            )}
          </div>

          <div className="info-row">
            <label>가입일</label>
            <div className="info-value">
              {userInfo.createdAt ? new Date(userInfo.createdAt).toLocaleDateString() : '-'}
            </div>
          </div>

          {isEditing && (
            <div className="edit-actions">
              <button className="btn-save" onClick={handleSaveInfo}>
                저장
              </button>
            </div>
          )}
        </div>

        <div className="info-section">
          <h2>계정 관리</h2>
          
          <div className="account-actions">
            <button 
              className="btn-password-change"
              onClick={() => {
                setShowPasswordModal(true);
                setPasswordEmailVerification({
                  codeSent: false,
                  code: '',
                  verified: false,
                  timer: 0,
                  timerInterval: null,
                });
              }}
            >
              비밀번호 변경
            </button>
            
            <button 
              className="btn-delete-account"
              onClick={() => {
                setShowDeleteModal(true);
                setDeleteEmailVerification({
                  codeSent: false,
                  code: '',
                  verified: false,
                  timer: 0,
                  timerInterval: null,
                });
              }}
            >
              회원 탈퇴
            </button>
          </div>
        </div>
      </div>

      {/* 비밀번호 변경 모달 */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>비밀번호 변경</h2>
            
            <div className="modal-form">
              {/* 이메일 인증 섹션 */}
              <div className="form-group email-verification-section">
                <label>이메일 인증</label>
                <div className="email-display">
                  <span className="email-text">{userInfo.email}</span>
                </div>
                <div className="verification-input-group">
                  <input
                    type="text"
                    value={passwordEmailVerification.code}
                    onChange={(e) => setPasswordEmailVerification(prev => ({
                      ...prev,
                      code: e.target.value
                    }))}
                    placeholder="인증 코드 6자리"
                    maxLength="6"
                    disabled={passwordEmailVerification.verified || !passwordEmailVerification.codeSent}
                    style={{
                      backgroundColor: passwordEmailVerification.verified ? '#f0f0f0' : 'white'
                    }}
                  />
                  {passwordEmailVerification.codeSent && passwordEmailVerification.timer > 0 && (
                    <span className="timer">{formatTime(passwordEmailVerification.timer)}</span>
                  )}
                  <button
                    type="button"
                    onClick={passwordEmailVerification.codeSent ? handleVerifyPasswordCode : handleSendPasswordCode}
                    className={passwordEmailVerification.verified ? "btn-verified" : "btn-send-code"}
                    disabled={passwordEmailVerification.verified}
                  >
                    {passwordEmailVerification.verified ? '인증완료' : 
                     passwordEmailVerification.codeSent ? '확인' : '인증'}
                  </button>
                </div>
                {passwordEmailVerification.verified && (
                  <p className="verification-success">✓ 이메일 인증이 완료되었습니다.</p>
                )}
              </div>

              <div className="form-group">
                <label>현재 비밀번호</label>
                <input
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm(prev => ({
                    ...prev,
                    oldPassword: e.target.value
                  }))}
                  placeholder="현재 비밀번호를 입력하세요"
                />
              </div>

              <div className="form-group">
                <label>새 비밀번호</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({
                    ...prev,
                    newPassword: e.target.value
                  }))}
                  placeholder="새 비밀번호를 입력하세요"
                />
              </div>

              <div className="form-group">
                <label>새 비밀번호 확인</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({
                    ...prev,
                    confirmPassword: e.target.value
                  }))}
                  placeholder="새 비밀번호를 다시 입력하세요"
                />
              </div>

              <div className="modal-actions">
                <button 
                  className="btn-modal-cancel"
                  onClick={() => setShowPasswordModal(false)}
                >
                  취소
                </button>
                <button 
                  className="btn-modal-confirm"
                  onClick={handlePasswordChange}
                  disabled={!passwordEmailVerification.verified}
                >
                  변경
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 회원 탈퇴 모달 */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: '#dc3545' }}>⚠️ 회원 탈퇴</h2>
            
            <div className="modal-form">
              <div className="warning-message">
                <p>회원 탈퇴 시 모든 데이터가 <strong>영구적으로 삭제</strong>됩니다.</p>
                <p>이 작업은 <strong>취소할 수 없습니다.</strong></p>
              </div>

              {/* 이메일 인증 섹션 */}
              <div className="form-group email-verification-section">
                <label>이메일 인증</label>
                <div className="email-display">
                  <span className="email-text">{userInfo.email}</span>
                </div>
                <div className="verification-input-group">
                  <input
                    type="text"
                    value={deleteEmailVerification.code}
                    onChange={(e) => setDeleteEmailVerification(prev => ({
                      ...prev,
                      code: e.target.value
                    }))}
                    placeholder="인증 코드 6자리"
                    maxLength="6"
                    disabled={deleteEmailVerification.verified || !deleteEmailVerification.codeSent}
                    style={{
                      backgroundColor: deleteEmailVerification.verified ? '#f0f0f0' : 'white'
                    }}
                  />
                  {deleteEmailVerification.codeSent && deleteEmailVerification.timer > 0 && (
                    <span className="timer">{formatTime(deleteEmailVerification.timer)}</span>
                  )}
                  <button
                    type="button"
                    onClick={deleteEmailVerification.codeSent ? handleVerifyDeleteCode : handleSendDeleteCode}
                    className={deleteEmailVerification.verified ? "btn-verified" : "btn-send-code"}
                    disabled={deleteEmailVerification.verified}
                  >
                    {deleteEmailVerification.verified ? '인증완료' : 
                     deleteEmailVerification.codeSent ? '확인' : '인증'}
                  </button>
                </div>
                {deleteEmailVerification.verified && (
                  <p className="verification-success">✓ 이메일 인증이 완료되었습니다.</p>
                )}
              </div>

              <div className="modal-actions">
                <button 
                  className="btn-modal-cancel"
                  onClick={() => setShowDeleteModal(false)}
                >
                  취소
                </button>
                <button 
                  className="btn-modal-confirm btn-delete"
                  onClick={handleDeleteAccount}
                  disabled={!deleteEmailVerification.verified}
                  style={{ backgroundColor: '#dc3545' }}
                >
                  탈퇴하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyInfo;

// dd
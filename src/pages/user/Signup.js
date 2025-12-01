import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authApi from '../../api/authApi';
import './Signup.css';

const Signup = () => {
  const navigate = useNavigate();
  
  // 단계 관리: 1=이메일 인증, 2=회원정보 입력
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    email: '',
    verificationCode: '',
    userId: '',
    password: '',
    passwordConfirm: '',
    username: '',
    phone: '',
    marketingConsent: false,
    privacyConsent: false,
  });
  
  const [emailVerification, setEmailVerification] = useState({
    codeSent: false,
    codeVerified: false,
    timer: 0,
    timerInterval: null,
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorAlert, setErrorAlert] = useState('');

  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    hasSpecialChar: false,
    hasUpperLower: false
  });

  const validatePassword = (pwd) => {
    const validation = {
      length: pwd.length >= 8 && pwd.length <= 16,
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
      hasUpperLower: /[a-z]/.test(pwd) && /[A-Z]/.test(pwd)
    };
    setPasswordValidation(validation);
    return validation.length && validation.hasSpecialChar && validation.hasUpperLower;
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'password') {
      validatePassword(value);
    }
    
    setErrors(prev => ({
      ...prev,
      [name]: ''
    }));
    setErrorAlert('');
  };
  
  // 타이머 시작
  const startTimer = () => {
    if (emailVerification.timerInterval) {
      clearInterval(emailVerification.timerInterval);
    }
    
    setEmailVerification(prev => ({ ...prev, timer: 300 })); // 5분
    
    const interval = setInterval(() => {
      setEmailVerification(prev => {
        if (prev.timer <= 1) {
          clearInterval(interval);
          return { ...prev, timer: 0, timerInterval: null, codeSent: false };
        }
        return { ...prev, timer: prev.timer - 1 };
      });
    }, 1000);
    
    setEmailVerification(prev => ({ ...prev, timerInterval: interval }));
  };
  
  // 타이머 포맷팅
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // 인증 코드 전송
  const handleSendCode = async () => {
    if (!formData.email) {
      setErrorAlert('이메일을 입력해주세요.');
      return;
    }
    
    const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      setErrorAlert('올바른 이메일 형식이 아닙니다.');
      return;
    }
    
    setLoading(true);
    setErrorAlert('');
    
    try {
      const response = await fetch('http://localhost:8080/api/email/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEmailVerification(prev => ({
          ...prev,
          codeSent: true,
          codeVerified: false,
        }));
        startTimer();
        setSuccessMessage('인증 코드가 이메일로 전송되었습니다.');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorAlert(data.message || '인증 코드 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('인증 코드 전송 오류:', error);
      setErrorAlert('인증 코드 전송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 인증 코드 확인
  const handleVerifyCode = async () => {
    if (!formData.verificationCode) {
      setErrorAlert('인증 코드를 입력해주세요.');
      return;
    }
    
    setLoading(true);
    setErrorAlert('');
    
    try {
      const response = await fetch('http://localhost:8080/api/email/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          code: formData.verificationCode,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (emailVerification.timerInterval) {
          clearInterval(emailVerification.timerInterval);
        }
        setEmailVerification(prev => ({
          ...prev,
          codeVerified: true,
          timer: 0,
          timerInterval: null,
        }));
        setSuccessMessage('이메일 인증이 완료되었습니다!');
        setTimeout(() => {
          setSuccessMessage('');
          setStep(2); // 다음 단계로 이동
        }, 1500);
      } else {
        setErrorAlert(data.message || '인증 코드가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('인증 코드 확인 오류:', error);
      setErrorAlert('인증 코드 확인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 회원가입 폼 검증
  const validateSignupForm = () => {
    const newErrors = {};
    
    if (!formData.userId || formData.userId.length < 4 || formData.userId.length > 20) {
      newErrors.userId = '아이디는 4-20자여야 합니다.';
    }
    
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = '비밀번호는 8자 이상이어야 합니다.';
    }

    if (!validatePassword(formData.password)) {
      newErrors.password = '비밀번호 조건을 모두 충족해주세요.';
    }
    
    if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    }
    
    if (!formData.username || formData.username.trim() === '') {
      newErrors.username = '이름을 입력해주세요.';
    }
    
    if (formData.phone) {
      const phoneRegex = /^01[0-9]-?\d{3,4}-?\d{4}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = '올바른 휴대폰 번호 형식이 아닙니다.';
      }
    }
    
    // 필수 동의 항목 확인
    if (!formData.privacyConsent) {
      newErrors.privacyConsent = '개인정보 수집 및 이용 동의는 필수입니다.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // 회원가입 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorAlert('');
    setSuccessMessage('');
    
    if (!validateSignupForm()) {
      setErrorAlert('입력 정보를 확인해주세요.');
      return;
    }
    
    setLoading(true);
    
    try {
      const signupData = {
        userId: formData.userId,
        password: formData.password,
        email: formData.email,
        username: formData.username,
        phone: formData.phone || null,
        marketingConsent: formData.marketingConsent,
        privacyConsent: formData.privacyConsent,
      };
      
      const response = await authApi.signup(signupData);
      
      if (response.success) {
        setSuccessMessage('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setErrorAlert(response.message || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      console.error('회원가입 실패:', error);
      
      if (error.response) {
        const errorMessage = error.response.data?.message || '회원가입에 실패했습니다.';
        setErrorAlert(errorMessage);
      } else if (error.request) {
        setErrorAlert('서버와 연결할 수 없습니다.');
      } else {
        setErrorAlert('회원가입 처리 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    if (step === 2) {
      setStep(1);
      setEmailVerification({
        codeSent: false,
        codeVerified: false,
        timer: 0,
        timerInterval: null,
      });
    } else {
      navigate(-1);
    }
  };
  
  return (
    <div className="on-main-wrap">
      <div className="regeist_wrapper mb-40">
        <div className="regeist_inner">
          <h2 className="mb-30">회원가입</h2>
          <div className="border-1p"></div>
          
          {/* Step 1: 이메일 인증 */}
          {step === 1 && (
            <div className="mt-40">
              <div className="form-group">
                <label className="login-label" htmlFor="email">
                  이메일 <span style={{ color: '#d32f2f' }}>*</span>
                </label>
                <div className="email-verification-container">
                  <input
                    type="email"
                    id="email"
                    className="input email-input"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="이메일"
                    disabled={emailVerification.codeVerified || loading}
                  />
                  <button
                    type="button"
                    className="btn btn--primary verification-btn"
                    onClick={handleSendCode}
                    disabled={emailVerification.codeVerified || loading}
                  >
                    {emailVerification.codeSent ? '재전송' : '인증'}
                  </button>
                </div>
                {errors.email && (
                  <div className="error-message-small">{errors.email}</div>
                )}
              </div>
              
              {emailVerification.codeSent && !emailVerification.codeVerified && (
                <div className="form-group verification-code-section">
                  <label className="login-label-small">
                    이메일로 발송된 인증 코드를 입력하세요
                  </label>
                  <div className="verification-input-container">
                    <input
                      type="text"
                      className="input verification-code-input"
                      name="verificationCode"
                      value={formData.verificationCode}
                      onChange={handleChange}
                      placeholder="인증 코드 6자리"
                      maxLength="6"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="btn btn--primary verification-confirm-btn"
                      onClick={handleVerifyCode}
                      disabled={loading}
                    >
                      확인
                    </button>
                  </div>
                  {emailVerification.timer > 0 && (
                    <div className="timer-display">
                      남은 시간: {formatTime(emailVerification.timer)}
                    </div>
                  )}
                </div>
              )}
              
              {successMessage && (
                <div className="success-message">{successMessage}</div>
              )}
              
              {errorAlert && (
                <div className="error-alert">{errorAlert}</div>
              )}
              
              <div className="login-link mt-40">
                이미 계정이 있으신가요?{' '}
                <Link to="/login"><b>로그인</b></Link>
              </div>
            </div>
          )}
          
          {/* Step 2: 회원정보 입력 */}
          {step === 2 && (
            <form className="mt-40" onSubmit={handleSubmit}>
              {/* 아이디 */}
              <div className="form-group">
                <label className="login-label" htmlFor="userId">
                  아이디 <span style={{ color: '#d32f2f' }}>*</span>
                </label>
                <input
                  className="input"
                  type="text"
                  id="userId"
                  name="userId"
                  value={formData.userId}
                  onChange={handleChange}
                  placeholder="4-20글자"
                  required
                  disabled={loading}
                />
                {errors.userId && (
                  <div className="error-message">{errors.userId}</div>
                )}
              </div>
              
              {/* 비밀번호 */}
              <div className="form-group">
                <label className="login-label" htmlFor="password">
                  비밀번호 <span style={{ color: '#d32f2f' }}>*</span>
                </label>
                <input
                  type="password"
                  className="input"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="비밀번호"
                  required
                  disabled={loading}
                />
                
                {/* 비밀번호 조건 표시 - 항상 표시 */}
                <div className="password-requirements">
                  <p>비밀번호를 입력해 주세요</p>
                  <ul>
                    <li className={passwordValidation.length ? 'valid' : 'invalid'}>
                      8자 이상 16자 이내
                    </li>
                    <li className={passwordValidation.hasSpecialChar ? 'valid' : 'invalid'}>
                      특수문자 포함
                    </li>
                    <li className={passwordValidation.hasUpperLower ? 'valid' : 'invalid'}>
                      대문자 포함
                    </li>
                  </ul>
                </div>
                
                {errors.password && (
                  <div className="error-message">{errors.password}</div>
                )}
              </div>
              
              {/* 비밀번호 확인 */}
              <div className="form-group">
                <label className="login-label" htmlFor="passwordConfirm">
                  비밀번호 확인 <span style={{ color: '#d32f2f' }}>*</span>
                </label>
                <input
                  type="password"
                  className="input"
                  id="passwordConfirm"
                  name="passwordConfirm"
                  value={formData.passwordConfirm}
                  onChange={handleChange}
                  placeholder="비밀번호 재입력"
                  required
                  disabled={loading}
                />
                {errors.passwordConfirm && (
                  <div className="error-message">{errors.passwordConfirm}</div>
                )}
              </div>
              
              {/* 이름 */}
              <div className="form-group">
                <label className="login-label" htmlFor="username">
                  이름 <span style={{ color: '#d32f2f' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="홍길동"
                  required
                  disabled={loading}
                />
                {errors.username && (
                  <div className="error-message">{errors.username}</div>
                )}
              </div>
              
              {/* 휴대폰 */}
              <div className="form-group">
                <label className="login-label" htmlFor="phone">
                  휴대폰
                </label>
                <input
                  type="tel"
                  className="input"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="010-1234-5678"
                  disabled={loading}
                />
                {errors.phone && (
                  <div className="error-message">{errors.phone}</div>
                )}
              </div>
              
              {/* 동의 항목 */}
              <div className="form-group consent-section">
                <div className="consent-title">
                  약관 동의 <span style={{ color: '#d32f2f' }}>*</span>
                </div>
                
                {/* 필수: 개인정보 수집 및 이용 동의 */}
                <div className="consent-item">
                  <label className="consent-label">
                    <input
                      type="checkbox"
                      name="privacyConsent"
                      checked={formData.privacyConsent}
                      onChange={handleChange}
                      disabled={loading}
                      className="consent-checkbox"
                    />
                    <span className="consent-text">
                      [필수] 개인정보 수집 및 이용 동의
                    </span>
                  </label>
                  <div className="consent-description">
                    회원가입 및 서비스 제공을 위해 개인정보를 수집합니다.
                  </div>
                </div>
                {errors.privacyConsent && (
                  <div className="error-message">{errors.privacyConsent}</div>
                )}
                
                {/* 선택: 광고성 정보 수신 동의 */}
                <div className="consent-item">
                  <label className="consent-label">
                    <input
                      type="checkbox"
                      name="marketingConsent"
                      checked={formData.marketingConsent}
                      onChange={handleChange}
                      disabled={loading}
                      className="consent-checkbox"
                    />
                    <span className="consent-text">
                      [선택] 광고성 정보 수신 동의
                    </span>
                  </label>
                  <div className="consent-description">
                    신상품, 이벤트, 특가 정보 등 광고성 정보를 수신합니다. (미동의 시 광고 알림을 받을 수 없습니다)
                  </div>
                </div>
              </div>
              
              {successMessage && (
                <div className="success-message">{successMessage}</div>
              )}
              
              {errorAlert && (
                <div className="error-alert">{errorAlert}</div>
              )}
              
              <div className="border-2p"></div>
              
              <div className="button-group justify-start flex mb-20">
                <button 
                  type="submit" 
                  className="btn btn--primary"
                  disabled={loading}
                >
                  {loading ? '처리중...' : '회원가입'}
                </button>
                <button 
                  type="button" 
                  className="btn btn--primary-outline" 
                  onClick={handleCancel}
                  disabled={loading}
                >
                  취소
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;

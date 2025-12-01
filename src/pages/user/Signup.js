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
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
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
  
  /**
   * handleSendCode() - 이메일 인증 코드 전송
   * 
   * 호출 위치: "인증" 또는 "재전송" 버튼 클릭 시
   * 
   * 처리 흐름:
   * 1. 이메일 입력 여부 확인
   * 2. 이메일 형식 검증 (정규식)
   * 3. 백엔드 API 호출 (POST /api/email/send-code)
   * 4. 성공 시:
   *    - codeSent = true (인증 코드 입력창 표시)
   *    - 5분 타이머 시작
   *    - 성공 메시지 표시 (3초 후 자동 사라짐)
   * 5. 실패 시: 에러 메시지 표시
   * 
   * 데이터 흐름:
   * [프론트엔드] formData.email → fetch() → [백엔드] EmailController.sendVerificationCode()
   * → EmailService.sendVerificationEmail() → Redis 저장 + 이메일 발송
   * → [프론트엔드] 성공 응답 → codeSent=true, 타이머 시작
   */
  const handleSendCode = async () => {
    // 1. 이메일 입력 여부 확인
    if (!formData.email) {
      setErrorAlert('이메일을 입력해주세요.');
      return; // 함수 종료
    }
    
    // 2. 이메일 형식 검증 (정규식)
    const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      setErrorAlert('올바른 이메일 형식이 아닙니다.');
      return;
    }
    
    // 3. 로딩 상태로 전환 (버튼 비활성화)
    setLoading(true);
    setErrorAlert(''); // 이전 에러 메시지 제거
    
    try {
      // 4. 백엔드 API 호출
      // fetch() - 브라우저 내장 HTTP 클라이언트
      const response = await fetch('http://localhost:8080/api/email/send-code', {
        method: 'POST', // HTTP 메소드
        headers: {
          'Content-Type': 'application/json', // JSON 형식으로 전송
        },
        body: JSON.stringify({ email: formData.email }), // 이메일을 JSON으로 변환
      });
      
      // 5. 응답 JSON 파싱
      const data = await response.json();
      
      // 6. 성공 시 처리
      if (data.success) {
        // 인증 코드 전송 완료 상태로 변경
        setEmailVerification(prev => ({
          ...prev,
          codeSent: true,      // 코드 전송 완료
          codeVerified: false, // 아직 인증 안 됨
        }));
        
        // 5분 타이머 시작
        startTimer();
        
        // 성공 메시지 표시
        setSuccessMessage('인증 코드가 이메일로 전송되었습니다.');
        
        // 3초 후 자동으로 메시지 제거
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        // 실패 시 에러 메시지 표시
        setErrorAlert(data.message || '인증 코드 전송에 실패했습니다.');
      }
    } catch (error) {
      // 네트워크 에러 등
      console.error('인증 코드 전송 오류:', error);
      setErrorAlert('인증 코드 전송 중 오류가 발생했습니다.');
    } finally {
      // 로딩 상태 해제 (성공/실패 모두)
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  /**
   * handleSubmit() - 회원가입 제출
   * 
   * 호출 위치: "회원가입" 버튼 클릭 시
   * 
   * 처리 흐름:
   * 1. 폼 유효성 검사 (validateSignupForm())
   * 2. authApi.signup() 호출 → POST /api/user/register
   * 3. 성공 시:
   *    - 성공 메시지 표시
   *    - 2초 후 로그인 페이지로 이동
   * 4. 실패 시: 에러 메시지 표시
   * 
   * 데이터 흐름:
   * [프론트엔드] formData → authApi.signup() → [백엔드] UserController.register()
   * → role=1 강제 설정 → UserService.register()
   * → userId 중복 체크 → password BCrypt 암호화 → DB 저장
   * → [프론트엔드] 성공 응답 → 성공 메시지 → 2초 후 로그인 페이지 이동
   */
  const handleSubmit = async (e) => {
    // 폼 기본 제출 동작 방지 (페이지 새로고침 방지)
    e.preventDefault();
    
    // 이전 메시지 초기화
    setErrorAlert('');
    setSuccessMessage('');
    
    // 1. 폼 유효성 검사
    if (!validateSignupForm()) {
      setErrorAlert('입력 정보를 확인해주세요.');
      return;
    }
    
    // 2. 로딩 상태로 전환
    setLoading(true);
    
    try {
      // 3. 회원가입 데이터 구성
      const signupData = {
        userId: formData.userId,        // 로그인 아이디
        password: formData.password,    // 비밀번호 (백엔드에서 BCrypt 암호화됨)
        email: formData.email,          // 이메일 (인증 완료됨)
        username: formData.username,    // 사용자 이름
        phone: formData.phone || null,  // 휴대폰 (선택 사항)
        marketingConsent: formData.marketingConsent, // 광고 수신 동의 (선택)
        privacyConsent: formData.privacyConsent,     // 개인정보 동의 (필수)
      };
      
      /**
       * 4. authApi.signup() 호출
       * 
       * authApi.signup()에서 하는 일:
       * - axios.post('/api/user/register', signupData)
       * - Content-Type: application/json
       * - 백엔드로 JSON 데이터 전송
       * 
       * 백엔드에서 처리:
       * - UserController.register()
       * - role을 1(일반사용자)로 강제 설정
       * - UserService.register()
       *   * userId 중복 체크
       *   * password BCrypt 암호화
       *   * User 엔티티 생성 및 DB 저장
       * - HTTP 201 Created 반환
       */
      const response = await authApi.signup(signupData);
      
      // 5. 성공 시 처리
      if (response.success) {
        // 성공 메시지 표시
        setSuccessMessage('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
        
        // 2초 후 로그인 페이지로 이동
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        // 실패 시 에러 메시지 표시
        setErrorAlert(response.message || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      /**
       * 6. 예외 처리
       * 
       * 예외 종류:
       * - error.response: 서버가 응답했지만 에러 발생 (400, 500 등)
       * - error.request: 서버로 요청을 보냈지만 응답 없음 (네트워크 오류)
       * - 기타: 요청 설정 중 오류
       */
      console.error('회원가입 실패:', error);
      
      if (error.response) {
        // 서버 응답 에러 (예: 중복 아이디)
        const errorMessage = error.response.data?.message || '회원가입에 실패했습니다.';
        setErrorAlert(errorMessage);
      } else if (error.request) {
        // 네트워크 오류 (서버 연결 실패)
        setErrorAlert('서버와 연결할 수 없습니다.');
      } else {
        // 기타 에러
        setErrorAlert('회원가입 처리 중 오류가 발생했습니다.');
      }
    } finally {
      // 로딩 상태 해제 (성공/실패 모두)
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
                  placeholder="8글자 이상"
                  required
                  disabled={loading}
                />
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

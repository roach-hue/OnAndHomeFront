import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from '../../store/slices/userSlice';
import authApi from '../../api/authApi';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 로그인 페이지 접속 시 기존 인증 정보 정리 (선택적)
  React.useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    const userInfo = localStorage.getItem("userInfo");

    if (accessToken && userInfo) {
      try {
        const user = JSON.parse(userInfo);
        if (user && user.userId) {
          // 유효한 사용자 정보가 있으면 홈으로 이동
          console.log('이미 로그인된 사용자:', user.userId);
          // navigate('/'); // 원한다면 주석 해제
        }
      } catch (error) {
        // 잘못된 사용자 정보는 제거
        console.log("잘못된 인증 정보 정리");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userInfo");
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // 입력 시 에러 메시지 초기화
  };
  
  /**
   * handleSubmit() - 사용자 로그인 처리
   * 
   * 호출 위치: "로그인" 버튼 클릭 시
   * 
   * 처리 흐름:
   * 1. 입력값 검증 (userId, password 비어있는지)
   * 2. authApi.login() 호출 → POST /api/user/login
   * 3. 백엔드에서 JWT 토큰 및 사용자 정보 반환
   * 4. Redux store 업데이트 (accessToken, refreshToken, user 저장)
   * 5. localStorage에도 저장 (새로고침 시 유지)
   * 6. 메인 페이지로 이동 ('/')
   * 
   * 중요: 일반 사용자 로그인 (role 구분 없음)
   * - role=0 (관리자): 로그인 후 메인 페이지로 이동 (AdminLogin.js와 다름)
   * - role=1 (일반사용자): 로그인 후 메인 페이지로 이동
   * - 관리자는 /admin/login 으로 접속해야 관리자 페이지 접근 가능
   * 
   * 데이터 흐름:
   * [프론트엔드] formData → authApi.login() → [백엔드] UserController.login()
   * → UserService.login() (userId/password 검증)
   * → JWT 토큰 생성 (accessToken: 60분, refreshToken: 7일)
   * → [프론트엔드] 토큰 + user 정보 반환
   * → Redux store 저장 → localStorage 저장 → 메인 페이지 이동
   */
  const handleSubmit = async (e) => {
    // 폼 기본 제출 동작 방지
    e.preventDefault();
    setError('');
    
    // 1. 입력값 검증
    if (!formData.userId.trim() || !formData.password.trim()) {
      setError('아이디와 비밀밀번호를 입력하세요.');
      return;
    }
    
    // 2. 로딩 상태로 전환
    setLoading(true);
    
    try {
      console.log('로그인 요청:', formData.userId);
      
      /**
       * 3. Spring Boot API 호출
       * 
       * authApi.login(formData)
       * - 요청: POST http://localhost:8080/api/user/login
       * - Body: {userId: "user123", password: "Password1!"}
       * 
       * 백엔드 처리 (UserController.login()):
       * - userId로 사용자 조회 (UserRepository.findByUserId)
       * - password BCrypt 검증 (passwordEncoder.matches)
       * - JWT 토큰 생성:
       *   * accessToken: 60분 유효 (JWTUtil.generateToken)
       *   * refreshToken: 7일 유효
       *   * 클레임: {id, userId, role, marketingConsent}
       * - 응답 반환: {success: true, accessToken, refreshToken, user}
       */
      const response = await authApi.login(formData);
      
      console.log('로그인 응답:', response);
      
      // 4. 로그인 성공 처리
      if (response.success && response.accessToken) {
        /**
         * 5. Redux store 업데이트
         * 
         * dispatch(login(...))
         * - Redux store의 userSlice에 저장
         * - userSlice는 동시에 localStorage에도 저장
         * - 저장되는 데이터:
         *   * accessToken: "eyJhbGciOiJIUzI1NiJ9..."
         *   * refreshToken: "eyJhbGciOiJIUzI1NiJ9..."
         *   * user: {id, userId, role, username, email, ...}
         */
        dispatch(login({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          user: response.user  // user.role: 0(관리자) or 1(일반사용자)
        }));
        
        console.log('로그인 성공 - Redux store 업데이트 완료');
        
        /**
         * 6. 메인 페이지로 이동
         * 
         * 중요: 일반 사용자 로그인은 role 구분 없이 모두 메인 페이지로 이동
         * 
         * 관리자와 일반사용자의 차이점:
         * 1. 일반 사용자 로그인 (이 파일 - Login.js):
         *    - /login 에서 로그인
         *    - role 구분 없이 모두 메인 페이지('/')로 이동
         *    - 관리자(role=0)도 여기서 로그인하면 메인 페이지로 감
         * 
         * 2. 관리자 로그인 (AdminLogin.js):
         *    - /admin/login 에서 로그인
         *    - role=0 체크 후 관리자 대시보드('/admin/dashboard')로 이동
         *    - role=1 이면 "관리자 권한이 없습니다" 에러
         * 
         * 관리자 페이지 접근 방법:
         * - 관리자는 반드시 /admin/login 으로 로그인해야 관리자 페이지 접근 가능
         */
        navigate('/');  // 메인 페이지로 이동 (role 구분 없음)
      } else {
        setError(response.message || '로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('로그인 실패:', error);
      
      if (error.response) {
        // 서버 응답이 있는 경우 (400, 401, 500 등)
        const errorMessage =
          error.response.data?.message ||
          "아이디 또는 비밀번호가 일치하지 않습니다.";
        setError(errorMessage);
      } else if (error.request) {
        // 요청은 보냈지만 응답을 받지 못한 경우 (네트워크 오류)
        setError('서버와 연결할 수 없습니다. 네트워크를 확인해주세요.');
      } else {
        // 요청 설정 중 오류가 발생한 경우
        setError('로그인 처리 중 오류가 발생했습니다.');
      }
    } finally {
      // 로딩 상태 해제 (성공/실패 모두)
      setLoading(false);
    }
  };
  
  return (
    <div className="on-main-wrap">
      <div className="login-wrap_user mt-80 mb-40">
        <div className="login-card_user">
          <div className="login-logo-wrap">
            <h3 className="login_header">Login</h3>
          </div>

          {/* 로그인 폼 */}
          <form id="loginForm" onSubmit={handleSubmit}>
            <div className="mb-16">
              <h4 className="login-h4">ID</h4>
              <input
                className="input w-full"
                type="text"
                name="userId"
                id="userId"
                value={formData.userId}
                onChange={handleChange}
                placeholder="ID를 입력하세요"
                required
                disabled={loading}
              />
            </div>
            <div>
              <h4 className="login-h4">PASSWORD</h4>
              <input
                type="password"
                name="password"
                id="password"
                className="input w-full"
                value={formData.password}
                onChange={handleChange}
                placeholder="*************"
                required
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className="btn btn--blk w-full mt-40"
              disabled={loading}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* 에러 메시지 표시 */}
          {error && (
            <div
              id="errorMessage"
              style={{
                color: "#d32f2f",
                marginTop: "10px",
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}
          
          {/* 소셜 로그인 */}
          <div style={{ margin: '30px 0', textAlign: 'center' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              margin: '20px 0' 
            }}>
              <div style={{ flex: 1, borderBottom: '1px solid #ddd' }}></div>
              <span style={{ padding: '0 15px', color: '#666', fontSize: '14px' }}>또는</span>
              <div style={{ flex: 1, borderBottom: '1px solid #ddd' }}></div>
            </div>
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('카카오 로그인 버튼 클릭');
                
                try {
                  const apiUrl = 'http://localhost:8080/api/auth/kakao/login-url';
                  console.log('API 호출:', apiUrl);
                  
                  const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                  });
                  
                  console.log('응답 상태:', response.status);
                  
                  if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                  }
                  
                  const data = await response.json();
                  console.log('받은 데이터:', data);
                  console.log('로그인 URL:', data.loginUrl);
                  
                  if (data.loginUrl) {
                    console.log('카카오 로그인 페이지로 이동:', data.loginUrl);
                    window.location.href = data.loginUrl;
                  } else {
                    throw new Error('로그인 URL이 없습니다.');
                  }
                } catch (error) {
                  console.error('카카오 로그인 오류:', error);
                  alert('카카오 로그인을 시작할 수 없습니다: ' + error.message);
                }
              }}
              style={{
                width: '100%',
                height: '50px',
                backgroundColor: '#FEE500',
                border: 'none',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                color: '#000000',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#FDD835")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#FEE500")
              }
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 3C7.03125 3 3 6.33984 3 10.5C3 12.8672 4.24219 14.9648 6.17578 16.3125L5.28906 19.9805C5.23828 20.168 5.35547 20.3555 5.53125 20.4258C5.59375 20.4492 5.66016 20.4609 5.72656 20.4609C5.85938 20.4609 5.98828 20.4023 6.07031 20.2969L9.37109 16.8867C10.207 17.0391 11.0859 17.1094 12 17.1094C16.9688 17.1094 21 13.7695 21 9.60938C21 5.44922 16.9688 2.10938 12 2.10938V3Z"
                  fill="#000000"
                />
              </svg>
              카카오로 시작하기
            </button>

            {/* 네이버 로그인 버튼 */}
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();

                console.log("네이버 로그인 버튼 클릭");

                try {
                  const apiUrl =
                    "http://localhost:8080/api/auth/naver/login-url";
                  console.log("API 호출:", apiUrl);

                  const response = await fetch(apiUrl, {
                    method: "GET",
                    headers: {
                      "Content-Type": "application/json",
                    },
                  });

                  console.log("응답 상태:", response.status);

                  if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                  }

                  const data = await response.json();
                  console.log("받은 데이터:", data);
                  console.log("로그인 URL:", data.loginUrl);

                  // state 값을 세션 스토리지에 저장 (CSRF 검증용)
                  if (data.state) {
                    sessionStorage.setItem("naverState", data.state);
                  }

                  if (data.loginUrl) {
                    console.log("네이버 로그인 페이지로 이동:", data.loginUrl);
                    window.location.href = data.loginUrl;
                  } else {
                    throw new Error("로그인 URL이 없습니다.");
                  }
                } catch (error) {
                  console.error("네이버 로그인 오류:", error);
                  alert("네이버 로그인을 시작할 수 없습니다: " + error.message);
                }
              }}
              style={{
                width: "100%",
                height: "50px",
                backgroundColor: "#03C75A",
                border: "none",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "600",
                color: "#ffffff",
                transition: "background-color 0.2s",
                marginTop: "10px",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#02B350")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#03C75A")
              }
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13.227 10.705L6.147 0H0V20H6.773V9.295L13.853 20H20V0H13.227V10.705Z"
                  fill="white"
                />
              </svg>
              네이버로 시작하기
            </button>

            {/* 구글 로그인 버튼 */}
            <button
              type="button"
              onClick={async () => {
                console.log("구글 로그인 버튼 클릭");

                try {
                  const response = await fetch(
                    "http://localhost:8080/api/auth/google/login-url"
                  );
                  
                  const data = await response.json();
                  console.log("구글 로그인 응답:", data);

                  if (data.loginUrl) {
                    console.log("구글 로그인 페이지로 이동:", data.loginUrl);
                    window.location.href = data.loginUrl;
                  } else {
                    alert("구글 로그인 URL을 가져올 수 없습니다.");
                  }
                } catch (error) {
                  console.error("구글 로그인 오류:", error);
                  alert("구글 로그인을 시작할 수 없습니다.");
                }
              }}
              style={{
                width: "100%",
                height: "50px",
                backgroundColor: "#ffffff",
                border: "1px solid #dadce0",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "600",
                color: "#3c4043",
                transition: "background-color 0.2s, box-shadow 0.2s",
                marginTop: "10px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f8f9fa";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#ffffff";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 48 48"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              구글로 시작하기
            </button>
          </div>

          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <p>
              계정이 없으신가요?{" "}
              <Link
                to="/signup"
                style={{ color: "#1976d2", textDecoration: "none" }}
              >
                <b>회원가입</b>
              </Link>
            </p>
            <p style={{ marginTop: "10px" }}>
              비밀번호를 잊어버리셨나요?{" "}
              <Link
                to="/reset-password"
                style={{ color: "#1976d2", textDecoration: "none" }}
              >
                <b>비밀번호 재설정</b>
              </Link>
            </p>
          </div>
          
          <div className="center mt-20" style={{ fontSize: 'xx-small' }}>
            ©2025 on&home. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

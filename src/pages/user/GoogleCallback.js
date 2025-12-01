import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from '../../store/slices/userSlice';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('구글 로그인 처리 중...');

  useEffect(() => {
    const handleGoogleCallback = async () => {
      const code = searchParams.get('code');
      
      if (!code) {
        setMessage('구글 로그인에 실패했습니다.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      try {
        // 백엔드로 인증 코드 전송
        const response = await fetch(
          `http://localhost:8080/api/auth/google/callback?code=${code}`,
          {
            method: 'GET',
            credentials: 'include', // 세션 쿠키 포함
          }
        );

        const data = await response.json();

        if (data.success) {
          // JWT 토큰을 localStorage에 저장 (기존 로그인과 동일)
          if (data.accessToken) {
            localStorage.setItem('accessToken', data.accessToken);
          }
          if (data.refreshToken) {
            localStorage.setItem('refreshToken', data.refreshToken);
          }
          if (data.user) {
            localStorage.setItem('userInfo', JSON.stringify(data.user));
          }
          
          // Redux 스토어에 사용자 정보 저장 (기존 로그인과 동일한 형식)
          dispatch(login({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            user: data.user,
          }));

          setMessage('로그인 성공! 메인 페이지로 이동합니다...');
          setTimeout(() => navigate('/'), 1000);
        } else {
          setMessage(data.message || '구글 로그인에 실패했습니다.');
          setTimeout(() => navigate('/login'), 2000);
        }
      } catch (error) {
        console.error('구글 로그인 처리 중 오류:', error);
        setMessage('구글 로그인 처리 중 오류가 발생했습니다.');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleGoogleCallback();
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="on-main-wrap">
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        textAlign: 'center'
      }}>
        <div>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #4285F4',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h2 style={{ marginBottom: '10px', color: '#333' }}>{message}</h2>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
};

export default GoogleCallback;

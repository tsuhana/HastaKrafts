import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const GoogleAuthSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error || !token) {
      navigate('/login?error=google_failed');
      return;
    }

    fetch('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify({
            user_id: data.data.user_id,
            full_name: data.data.full_name,
            email: data.data.email,
            role: data.data.role,
            phone: data.data.phone,
            profile_image: data.data.profile_image,
          }));

          if (data.data.role === 'seller') {
            navigate('/seller/dashboard');
          } else if (data.data.role === 'admin') {
            navigate('/admin/dashboard');
          } else {
            navigate('/');
          }
        } else {
          navigate('/login?error=auth_failed');
        }
      })
      .catch(() => navigate('/login?error=auth_failed'));
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#FFFBF7',
      gap: '1rem'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid #E8E5E1',
        borderTopColor: '#C17D4A',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite'
      }}></div>
      <p style={{ color: '#5D4E37', fontWeight: 600 }}>
        Signing you in with Google...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default GoogleAuthSuccess;
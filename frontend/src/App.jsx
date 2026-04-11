import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Upload from './pages/Upload';
import MyRentals from './pages/MyRentals';
import Player from './pages/Player';
import PaymentSuccess from './pages/PaymentSuccess';
import CreatorDashboard from './pages/CreatorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Terms from './pages/Terms';
import PrivacyPolicy from './pages/PrivacyPolicy';
import RefundPolicy from './pages/RefundPolicy';
import Contact from './pages/Contact';
import AgeGateModal from './components/AgeGateModal';
import axios from 'axios';

// Configure Axios para usar rutas relativas (compatible con proxy de Vite y Túnel de Cloudflare)
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAgeVerified, setIsAgeVerified] = useState(localStorage.getItem('ageVerified') === 'true');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get('/api/auth/me')
        .then(res => {
          setUser(res.data.user);
        })
        .catch(() => {
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const handleAgeVerify = () => {
    setIsAgeVerified(true);
    localStorage.setItem('ageVerified', 'true');
  };

  if (loading) {
    return <div className="container text-center mt-8">Cargando...</div>;
  }

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
      {!isAgeVerified && <AgeGateModal onAccept={handleAgeVerify} />}
      <Routes>
        <Route path="/" element={<Home user={user} isAgeVerified={isAgeVerified} />} />
        <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register onLogin={handleLogin} /> : <Navigate to="/" />} />
        <Route path="/upload" element={user && (user.role === 'creator' || user.role === 'admin') ? <Upload /> : <Navigate to="/" />} />
        <Route path="/my-rentals" element={user ? <MyRentals isAgeVerified={isAgeVerified} /> : <Navigate to="/login" />} />
        <Route path="/creator" element={user && user.role === 'creator' ? <CreatorDashboard /> : <Navigate to="/" />} />
        <Route path="/admin" element={user && (user.role === 'admin' || user.role === 'admin' || user.username === 'admin') ? <AdminDashboard /> : <Navigate to="/" />} />
        <Route path="/payment-success" element={user ? <PaymentSuccess /> : <Navigate to="/login" />} />
        <Route path="/watch/:token" element={<Player />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/refunds" element={<RefundPolicy />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;

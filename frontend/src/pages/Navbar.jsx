import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';
import rlogo from './../images/readailogo.svg';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import AccountCircleIcon from '@mui/icons-material/PersonOutlineOutlined';
import Brightness4Icon from '@mui/icons-material/NightsStay';
import Brightness7Icon from '@mui/icons-material/LightMode';

const Navbar = () => {
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleUpgrade = () => {
    navigate('/upgrade');
  };

  return (
    <header>
      <div className={`navbar ${darkMode ? 'dark' : ''}`}>
        <div className="cluster1">
          <img src={rlogo} className='logor' alt="Logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}/>
        </div>

        <div className="cluster2">
          <button className="login-btn" onClick={handleLogin}>Login</button>
          <button className="upgrade-btn" onClick={handleUpgrade}>Upgrade</button>
        </div>
        <div className="cluster3">
          <AccountCircleIcon style={{ color: darkMode ? '#fff' : '#000', fontSize: '35px' }} />
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {darkMode ? <Brightness7Icon style={{ fontSize: '35px',color:'#fff'}} /> : <Brightness4Icon style={{ fontSize: '35px',color:'#000' }} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

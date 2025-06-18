import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Navbar from './pages/Navbar';
import './App.css';
import Login from './pages/Login';
import Upgrade from './pages/Upgrade';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/login' element={<Login />}/>
          <Route path='/upgrade' element={<Upgrade />}/>
        </Routes>
      </Layout>
    </Router>
  );
}

const Layout = ({ children }) => {
  return (
    <>
      {<Navbar />}
      <main>{children}</main>
    </>
  );
};

export default App;

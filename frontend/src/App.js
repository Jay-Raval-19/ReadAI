import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Navbar from './pages/Navbar';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path='/' element={<Home />} />
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

import { useState } from "react";
import { Link } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSignUp) {
      if (formData.password !== formData.confirmPassword) {
        alert("Passwords do not match");
        return;
      }
      alert("Account Created!");
    } else {
      alert("Welcome Back!");
    }
  };

  return (
    <>
      <div className="temp" />
      <div className="login-container">
        <div className="login-wrapper">
          <Link to="/" className="back-link">
            ← Back to Home
          </Link>

          <div className="login-card">
            <div className="login-header">
              <div className="logo-container">
                <div className="logo-icon">📄</div>
              </div>
              <h1 className="login-title">{isSignUp ? "Create Account" : "Welcome Back"}</h1>
              <p className="login-description">
                {isSignUp
                  ? "Sign up to start turning your PDFs into answers"
                  : "Sign in to your Read AI account"}
              </p>
            </div>

            <div className="login-content">
              <form onSubmit={handleSubmit} className="login-form">
                {isSignUp && (
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                {isSignUp && (
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                )}
                <button type="submit" className="submit-btn">
                  {isSignUp ? "Create Account" : "Sign In"}
                </button>
              </form>

              {!isSignUp && (
                <div className="forgot-password">
                  <button className="forgot-link">
                    Forgot your password?
                  </button>
                </div>
              )}

              <div className="divider">
                <span>or</span>
              </div>

              <button className="google-btn">
                <span className="google-icon">G</span>
                Continue with Google
              </button>

              <div className="toggle-form">
                {isSignUp ? (
                  <>
                    <span>Already have an account? </span>
                    <button className="toggle-link" onClick={() => setIsSignUp(false)}>Sign in</button>
                  </>
                ) : (
                  <>
                    <span>Don't have an account? </span>
                    <button className="toggle-link" onClick={() => setIsSignUp(true)}>Sign up</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
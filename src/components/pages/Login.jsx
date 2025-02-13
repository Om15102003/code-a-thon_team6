import React, { useState, useEffect } from 'react';
import './CSS/Login.css'; // Ensure correct CSS file extension
import axios from 'axios';

const API_URL = 'http://localhost:4000';

const LoginPage = ({ onNavigateToRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'employee'
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post(`${API_URL}/login`, formData);
      const { token, user } = response.data;
      
      // Store auth data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      console.log("User Role:", user.role);
      console.log(user);
      
      // Redirect based on role
      if (user.role === 'employee') {
        window.location.href = `/dashboard/${user.id}`;
      } else {
        window.location.href = `/${user.role}-dashboard/${user.id}`;
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">Code-a-Company</h1>
        <p className="subtitle">Standout company for young coding minds</p>

        {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email Address"
            className="input-field"
            required
          />

          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            className="input-field"
            required
          />

          <div className="radio-group">
            <p>Select Role</p>
            <label>
              <input
                type="radio"
                name="role"
                value="employee"
                checked={formData.role === 'employee'}
                onChange={handleChange}
              />
              Employee
            </label>
            <label>
              <input
                type="radio"
                name="role"
                value="manager"
                checked={formData.role === 'manager'}
                onChange={handleChange}
              />
              Manager
            </label>
            <label>
              <input
                type="radio"
                name="role"
                value="ceo"
                checked={formData.role === 'ceo'}
                onChange={handleChange}
              />
              CEO/Admin
            </label>
          </div>

          <button type="submit" className="button">Sign In</button>
        </form>

        <a href="/forgot-password" className="link">Forgot your password? Contact your administrator</a>
        <button onClick={onNavigateToRegister} className="link">Register if you don't have an account</button>
      </div>
    </div>
  );
};

const RegistrationPage = ({ onNavigateToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    role: 'employee',
    password: '',
    company: '',
    department_id: ''
  });
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get(`${API_URL}/departments`);
        setDepartments(response.data);
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await axios.post(`${API_URL}/register`, {
        ...formData,
        phone_number: formData.mobile
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log(user);
      
      if (user.role === 'employee') {
        window.location.href = '/dashboard';
      } else {
        window.location.href = `/${user.role}-dashboard`;
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">Register New Account</h1>
        <p className="subtitle">Code-a-thon</p>

        {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Full Name"
            className="input-field"
            required
          />

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email Address"
            className="input-field"
            required
          />

          <input
            type="tel"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            placeholder="Mobile Number"
            className="input-field"
            required
          />

          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="Company Name"
            className="input-field"
            required
          />
          <input
            type="text"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="password"
            className="input-field"
            required
          />

          <select
            name="department_id"
            value={formData.department_id}
            onChange={handleChange}
            className="input-field"
            required
          >
            <option value="">Select Department</option>
            {departments.map(dept => (
              <option key={dept.deptid} value={dept.deptid}>
                {dept.deptname}
              </option>
            ))}
          </select>

          <button type="submit" className="button">Register</button>
        </form>

        <button onClick={onNavigateToLogin} className="link">Already have an account? Sign in</button>
      </div>
    </div>
  );
};

const App = () => {
  const [currentPage, setCurrentPage] = useState('login');

  return (
    <div>
      {currentPage === 'login' ? (
        <LoginPage onNavigateToRegister={() => setCurrentPage('register')} />
      ) : (
        <RegistrationPage onNavigateToLogin={() => setCurrentPage('login')} />
      )}
    </div>
  );
};

export default App;

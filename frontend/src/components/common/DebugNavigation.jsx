import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const DebugNavigation = () => {
  const location = useLocation();

  return (
    <div style={{ padding: '20px', background: '#f0f0f0', margin: '10px' }}>
      <h3>Debug Navigation</h3>
      <p><strong>Current Path:</strong> {location.pathname}</p>
      <p><strong>Current Search:</strong> {location.search}</p>
      
      <div style={{ marginTop: '20px' }}>
        <h4>Test Navigation Links:</h4>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ margin: '10px 0' }}>
            <Link 
              to="/login" 
              style={{ 
                padding: '10px 15px', 
                background: '#007bff', 
                color: 'white', 
                textDecoration: 'none',
                borderRadius: '5px',
                display: 'inline-block'
              }}
            >
              Go to Login
            </Link>
          </li>
          <li style={{ margin: '10px 0' }}>
            <Link 
              to="/register" 
              style={{ 
                padding: '10px 15px', 
                background: '#28a745', 
                color: 'white', 
                textDecoration: 'none',
                borderRadius: '5px',
                display: 'inline-block'
              }}
            >
              Go to Register
            </Link>
          </li>
          <li style={{ margin: '10px 0' }}>
            <Link 
              to="/dashboard" 
              style={{ 
                padding: '10px 15px', 
                background: '#17a2b8', 
                color: 'white', 
                textDecoration: 'none',
                borderRadius: '5px',
                display: 'inline-block'
              }}
            >
              Go to Dashboard
            </Link>
          </li>
          <li style={{ margin: '10px 0' }}>
            <Link 
              to="/tasks" 
              style={{ 
                padding: '10px 15px', 
                background: '#ffc107', 
                color: 'black', 
                textDecoration: 'none',
                borderRadius: '5px',
                display: 'inline-block'
              }}
            >
              Go to Tasks
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default DebugNavigation;
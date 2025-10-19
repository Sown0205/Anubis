import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Logout() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios
        .post('http://localhost:5000/logout', {},
             { withCredentials: true 
        })
        .then((response) => {
          localStorage.removeItem('token');
          setMessage(response.data.message);
        })
        .catch((error) => {
          setMessage('Logout failed');
        });
    } else {
      setMessage('No user logged in');
    }
  }, []);

  return (
    <div>
      <h2>Logout</h2>
      <p>{message}</p>
    </div>
  );
}

export default Logout;
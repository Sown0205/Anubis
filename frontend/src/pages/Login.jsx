
import React, { useState } from 'react';
import axios from 'axios';

function Login(){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
           await axios.post('http://localhost:3000/login', 
  new URLSearchParams({ username, password }),
  { withCredentials: true } // Để gửi cookie nếu dùng cookie auth
);
/*Nếu  để token trong localStorage thì backend cần hỗ trợ header Authorization: Bearer <token>, còn nếu token được lưu ở cookie thì frontend cần withCredentials: true.  */

        setMessage('Login successful!');
    }
         catch (error) {
        setMessage('Login failed. Please check your credentials.');
    }
};

return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">Login</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default Login;
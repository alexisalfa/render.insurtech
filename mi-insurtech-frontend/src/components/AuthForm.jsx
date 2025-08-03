// src/components/AuthForm.jsx
import React, { useState } from 'react';

function AuthForm({ apiBaseUrl, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isRegistering ? '/register/' : '/token';
    const url = `${apiBaseUrl}${endpoint}`;
    let body;
    let headers = {};

    if (isRegistering) {
      body = JSON.stringify({ username, password, email });
      headers['Content-Type'] = 'application/json';
    } else {
      body = new URLSearchParams({
        username: username,
        password: password,
      });
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: body,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (isRegistering) {
        alert('Registro exitoso! Ahora puedes iniciar sesión.');
        setIsRegistering(false);
        setUsername('');
        setPassword('');
        setEmail('');
      } else {
        onLoginSuccess(data.access_token);
      }
    } catch (err) {
      console.error('Error de autenticación:', err);
      setError(err.message || 'Ocurrió un error inesperado al autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-lg shadow-xl bg-white max-w-md mx-auto my-12">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        {isRegistering ? 'Registrarse' : 'Iniciar Sesión'}
      </h2>
      {error && (
        <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-6 w-full text-center">
          {error}
        </p>
      )}
      <form onSubmit={handleAuth} className="flex flex-col w-full gap-4">
        <input
          type="text"
          placeholder="Nombre de usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
        />
        {isRegistering && (
          <input
            type="email"
            placeholder="Email (opcional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
          />
        )}
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
        />
        <button
          type="submit"
          disabled={loading}
          className="p-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-300 ease-in-out shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Cargando...' : (isRegistering ? 'Registrarme' : 'Entrar')}
        </button>
      </form>
      <button
        onClick={() => setIsRegistering(!isRegistering)}
        className="mt-6 bg-transparent text-blue-600 hover:text-blue-800 text-sm underline focus:outline-none transition duration-200"
      >
        {isRegistering ? 'Ya tengo una cuenta' : '¿No tienes una cuenta? Regístrate'}
      </button>
    </div>
  );
}

export default AuthForm;
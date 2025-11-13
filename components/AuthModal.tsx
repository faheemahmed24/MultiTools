import React, { useState, useEffect } from 'react';
import type { TranslationSet, User } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { GoogleIcon } from './icons/GoogleIcon';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  t: TranslationSet;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess, t }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset form on open
      setEmail('');
      setPassword('');
      setError('');
      setIsLoginMode(true);
    }
  }, [isOpen]);

  const getUsers = (): User[] => {
    const usersJson = localStorage.getItem('users');
    return usersJson ? JSON.parse(usersJson) : [];
  };

  const saveUsers = (users: User[]) => {
    localStorage.setItem('users', JSON.stringify(users));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t.fillAllFields);
      return;
    }
    setError('');

    const users = getUsers();
    
    if (isLoginMode) {
      // Handle Login
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        onLoginSuccess(user);
      } else {
        setError(t.invalidCredentials);
      }
    } else {
      // Handle Sign Up
      if (users.some(u => u.email === email)) {
        setError(t.emailExists);
        return;
      }
      const newUser: User = {
        id: new Date().toISOString() + Math.random(),
        email,
        password,
        authMethod: 'password',
      };
      saveUsers([...users, newUser]);
      onLoginSuccess(newUser);
    }
  };
  
  const handleGoogleSignIn = () => {
    // Simulate Google Sign-In with a prompt
    const googleEmail = prompt("Please enter your email address to continue:");
    if (!googleEmail) {
      // User cancelled the prompt
      return;
    }
    
    // Simple email validation
    if (!/\S+@\S+\.\S+/.test(googleEmail)) {
        setError("Please enter a valid email address.");
        return;
    }

    setError('');
    const users = getUsers();
    let user = users.find(u => u.email === googleEmail);

    if (user) {
      // User exists, log them in
      if (user.authMethod === 'password') {
        // In a real app, you might ask for a password or show an error.
        // Here, we'll just log them in to keep it simple.
        console.warn('User with this email signed up with a password. Logging in...');
      }
      onLoginSuccess(user);
    } else {
      // User does not exist, create a new one
      const newUser: User = {
        id: new Date().toISOString() + Math.random(),
        email: googleEmail,
        authMethod: 'google',
      };
      saveUsers([...users, newUser]);
      onLoginSuccess(newUser);
    }
  };

  const handleToggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError('');
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl shadow-lg w-full max-w-sm p-8" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-100">
            {isLoginMode ? t.login : t.signup}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">{t.email}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div>
            <label htmlFor="password">{t.password}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <button
            type="submit"
            className="w-full py-3 px-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
          >
            {isLoginMode ? t.login : t.signup}
          </button>
        </form>

        <div className="relative flex items-center justify-center my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-gray-800 px-2 text-gray-400">{t.orSeparator}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center py-2.5 px-4 bg-white text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
        >
          <GoogleIcon className="w-5 h-5 me-3" />
          {t.continueWithGoogle}
        </button>

        <p className="mt-6 text-center text-sm text-gray-400">
          {isLoginMode ? t.loginPrompt : t.signupPrompt}{' '}
          <button onClick={handleToggleMode} className="font-medium text-purple-400 hover:underline">
            {isLoginMode ? t.signup : t.login}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;

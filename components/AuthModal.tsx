import React, { useState, useEffect } from 'react';
import type { TranslationSet, User } from '../types';
import GoogleAccountSelectorModal from './GoogleAccountSelectorModal';

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
  const [isGoogleAccountSelectorOpen, setIsGoogleAccountSelectorOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setIsRendered(true);
    }
  }, [isOpen]);

  const handleClose = () => {
      setIsRendered(false);
      setTimeout(onClose, 200); // match animation duration
  };

  useEffect(() => {
    if (isRendered) {
      // Reset form on open
      setEmail('');
      setPassword('');
      setError('');
      setIsLoginMode(true);
      setIsGoogleAccountSelectorOpen(false);
    }
  }, [isRendered]);

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
  
  const handleAccountSelected = (selectedEmail: string) => {
    setError('');
    const users = getUsers();
    let user = users.find(u => u.email === selectedEmail);

    if (user) {
      // User exists, log them in
      if (user.authMethod === 'password') {
        console.warn('User with this email signed up with a password. Logging in...');
      }
      onLoginSuccess(user);
    } else {
      // User does not exist, create a new one
      const newUser: User = {
        id: new Date().toISOString() + Math.random(),
        email: selectedEmail,
        authMethod: 'google',
      };
      saveUsers([...users, newUser]);
      onLoginSuccess(newUser);
    }
    setIsGoogleAccountSelectorOpen(false);
  };

  const handleToggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError('');
  }

  if (!isOpen && !isRendered) return null;

  const backdropClasses = [
      "fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm",
      "transition-opacity duration-200 ease-out",
      isRendered && isOpen ? "opacity-100" : "opacity-0",
  ].join(' ');

  const modalClasses = [
      "bg-[var(--secondary-bg)] rounded-2xl shadow-[var(--shadow-hover)] w-full max-w-sm p-8 relative",
      "transition-all duration-300 ease-out",
      isRendered && isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8",
  ].join(' ');

  return (
    <>
      <div className={backdropClasses} onClick={handleClose}>
        <div className={modalClasses} onClick={e => e.stopPropagation()}>
            <div key={isLoginMode ? 'login' : 'signup'} className="animate-fadeIn">
              <button 
                onClick={handleClose} 
                className="absolute top-6 right-6 text-[var(--text-secondary)] hover:text-[var(--text-color)] transition-colors bg-[var(--bg-color)] hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center"
              >
                <i className="fas fa-times" />
              </button>

              <h2 className="text-2xl font-bold text-[var(--text-color)] mb-6">
                {isLoginMode ? t.login : t.signup}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[var(--text-color)] mb-1.5">{t.email}</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-[var(--text-color)] mb-1.5">{t.password}</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                     placeholder="Enter your password"
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent transition-all"
                  />
                </div>
                
                {error && <p className="text-sm text-red-500 text-center bg-red-50 p-2 rounded">{error}</p>}

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-[var(--primary-color)] to-[#a855f7] text-white font-semibold rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  {isLoginMode ? t.login : t.signup}
                </button>
              </form>

              <div className="relative flex items-center justify-center my-6">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-[var(--border-color)]" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-[var(--secondary-bg)] px-2 text-[var(--text-secondary)]">{t.orSeparator}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsGoogleAccountSelectorOpen(true)}
                className="w-full flex items-center justify-center py-2.5 px-4 bg-[var(--secondary-bg)] border border-[var(--border-color)] text-[var(--text-color)] font-semibold rounded-lg hover:bg-[var(--bg-color)] transition-colors shadow-sm"
              >
                <i className="fab fa-google w-5 h-5 me-3 text-red-500" />
                {t.continueWithGoogle}
              </button>

              <p className="mt-8 text-center text-sm text-[var(--text-secondary)]">
                {isLoginMode ? t.loginPrompt : t.signupPrompt}{' '}
                <button onClick={handleToggleMode} className="font-semibold text-[var(--primary-color)] hover:underline">
                  {isLoginMode ? t.signup : t.login}
                </button>
              </p>
          </div>
        </div>
      </div>
      <GoogleAccountSelectorModal
        isOpen={isGoogleAccountSelectorOpen}
        onClose={() => setIsGoogleAccountSelectorOpen(false)}
        onAccountSelect={handleAccountSelected}
        t={t}
      />
    </>
  );
};

export default AuthModal;
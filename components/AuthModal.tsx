
import React, { useState, useEffect } from 'react';
import type { TranslationSet, User } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { GoogleIcon } from './icons/GoogleIcon';
import { GithubIcon } from './icons/GithubIcon';
import { EyeIcon } from './icons/EyeIcon';
import { EyeSlashIcon } from './icons/EyeSlashIcon';
import { CheckIcon } from './icons/CheckIcon';
import GoogleAccountSelectorModal from './GoogleAccountSelectorModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  t: TranslationSet;
}

// Simple deterministic hash to avoid storing passwords in clear text in localStorage.
// NOTE: This is for demo purposes only and is not a substitute for a proper,
// server-side password hashing mechanism (e.g., bcrypt, Argon2).
function hashPassword(password: string): string {
  let hash = 0;
  if (password.length === 0) return hash.toString();
  for (let i = 0; i < password.length; i++) {
    const chr = password.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString();
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess, t }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isGoogleAccountSelectorOpen, setIsGoogleAccountSelectorOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsRendered(false);
    setTimeout(onClose, 300);
  };

  const handleSocialConnect = async (provider: 'google' | 'github') => {
    setIsSubmitting(true);
    setError('');
    // Artificial "Engine" delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (provider === 'google') {
      setIsGoogleAccountSelectorOpen(true);
      setIsSubmitting(false);
    } else {
      const githubUser: User = { 
        id: `gh-${Date.now()}`, 
        email: 'operator@github.com', 
        authMethod: 'google' 
      };
      setShowSuccess(true);
      setTimeout(() => {
        onLoginSuccess(githubUser);
        setIsSubmitting(false);
        setShowSuccess(false);
      }, 800);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t.fillAllFields);
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    await new Promise(resolve => setTimeout(resolve, 1500));

    const usersJson = localStorage.getItem('users');
    const users: User[] = usersJson ? JSON.parse(usersJson) : [];
    
    if (isLoginMode) {
      const passwordHash = hashPassword(password);
      const user = users.find(
        (u: any) => u.email === email && u.passwordHash === passwordHash
      );
      if (user) {
        setShowSuccess(true);
        setTimeout(() => {
          onLoginSuccess(user);
          setIsSubmitting(false);
          setShowSuccess(false);
        }, 800);
      } else {
        setError(t.invalidCredentials);
        setIsSubmitting(false);
      }
    } else {
      if (users.some(u => u.email === email)) {
        setError(t.emailExists);
        setIsSubmitting(false);
        return;
      }
      const passwordHash = hashPassword(password);
      const newUser: User = {
        id: Date.now().toString(),
        email,
        // Store the hashed password instead of the clear-text password.
        passwordHash: passwordHash as unknown as string,
        authMethod: 'password',
      } as unknown as User;
      localStorage.setItem('users', JSON.stringify([...users, newUser]));
      setShowSuccess(true);
      setTimeout(() => {
        onLoginSuccess(newUser);
        setIsSubmitting(false);
        setShowSuccess(false);
      }, 800);
    }
  };

  if (!isOpen && !isRendered) return null;

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/80 backdrop-blur-2xl z-[100] flex items-center justify-center p-4 transition-all duration-500 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={handleClose}
      >
        <div 
          className={`relative bg-[#0A0A10]/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_0_80px_rgba(168,85,247,0.15)] w-full max-w-md overflow-hidden transition-all duration-500 ease-out transform ${isOpen ? "scale-100 opacity-100" : "scale-90 opacity-0"}`}
          onClick={e => e.stopPropagation()}
        >
          {/* Shimmer Light Source */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
          </div>

          <div className="p-10 relative z-10">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-tight">
                  {isLoginMode ? 'Access Engine' : 'New Operator'}
                </h2>
                <p className="text-[10px] font-black text-purple-500 uppercase tracking-[0.3em] mt-1">MultiTools Identity Suite</p>
              </div>
              <button onClick={handleClose} className="p-2.5 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSocialConnect('google')}
                className="group flex items-center justify-center py-3 bg-white hover:bg-gray-100 text-gray-900 font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-xl hover:scale-[1.02] active:scale-[0.95]"
              >
                <GoogleIcon className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" /> Google
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSocialConnect('github')}
                className="group flex items-center justify-center py-3 bg-[#24292e] hover:bg-[#2f363d] text-white font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-xl hover:scale-[1.02] active:scale-[0.95]"
              >
                <GithubIcon className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" /> GitHub
              </button>
            </div>

            <div className="relative flex items-center justify-center mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5" />
              </div>
              <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.2em] px-4 bg-[#0D0D15] text-gray-600 rounded-full">
                Protocol Access
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Terminal Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  className={`w-full bg-black/40 border ${error ? 'border-red-500/50' : 'border-white/10'} focus:border-purple-500 focus:shadow-[0_0_15px_rgba(168,85,247,0.2)] text-white rounded-xl py-3.5 px-4 outline-none transition-all placeholder:text-gray-800 text-sm`}
                  placeholder="operator@multitools.ai"
                />
              </div>
              
              <div>
                <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Access cipher</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    className={`w-full bg-black/40 border ${error ? 'border-red-500/50' : 'border-white/10'} focus:border-purple-500 focus:shadow-[0_0_15px_rgba(168,85,247,0.2)] text-white rounded-xl py-3.5 px-4 outline-none transition-all placeholder:text-gray-800 text-sm`}
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300"
                  >
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              {error && (
                <p className="text-[10px] font-bold text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20 animate-shake">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 mt-2 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-xl transition-all shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_50px_rgba(168,85,247,0.4)] active:scale-[0.95] flex items-center justify-center min-h-[52px]`}
              >
                {showSuccess ? (
                  <CheckIcon className="w-6 h-6 animate-pop-in" />
                ) : isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  isLoginMode ? 'Initialize Session' : 'Register Operator'
                )}
              </button>
            </form>

            <p className="mt-10 text-center text-[9px] font-black text-gray-600 uppercase tracking-widest">
              {isLoginMode ? "External operative?" : "Existing clearance?"}{' '}
              <button onClick={() => setIsLoginMode(!isLoginMode)} className="text-purple-500 hover:text-purple-400 underline decoration-purple-500/20 transition-all ml-1">
                {isLoginMode ? "Enroll Now" : "Sign In"}
              </button>
            </p>
          </div>
        </div>
      </div>
      <GoogleAccountSelectorModal
        isOpen={isGoogleAccountSelectorOpen}
        onClose={() => setIsGoogleAccountSelectorOpen(false)}
        onAccountSelect={(email) => {
          setIsGoogleAccountSelectorOpen(false);
          onLoginSuccess({ id: `g-${Date.now()}`, email, authMethod: 'google' });
        }}
        t={t}
      />
    </>
  );
};

export default AuthModal;

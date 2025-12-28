import React, { useState } from 'react';
import type { User, TranslationSet } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  t: TranslationSet;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess, t }) => {
  const [email, setEmail] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login
    const mockUser: User = {
      id: `user-${Date.now()}`,
      email: email || 'guest@example.com',
      authMethod: 'password',
    };
    onLoginSuccess(mockUser);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">{t.login} / {t.signup}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t.email}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-purple-500 focus:border-purple-500"
              placeholder="name@example.com"
              required
            />
          </div>
          <button type="submit" className="w-full py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors">
            {t.continueToAppName}
          </button>
        </form>
        <button onClick={onClose} className="mt-4 w-full py-2 text-gray-400 hover:text-white text-sm">
          {t.cancel}
        </button>
      </div>
    </div>
  );
};

export default AuthModal;
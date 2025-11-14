import React, { useState, useEffect, FormEvent } from 'react';
import type { TranslationSet } from '../types';
import { GoogleIcon } from './icons/GoogleIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

interface GoogleAccountSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountSelect: (email: string) => void;
  t: TranslationSet;
}

const GoogleAccountSelectorModal: React.FC<GoogleAccountSelectorModalProps> = ({
  isOpen,
  onClose,
  onAccountSelect,
  t,
}) => {
  const [accounts, setAccounts] = useState<string[]>([]);
  const [showNewAccountForm, setShowNewAccountForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      try {
        const storedAccounts = localStorage.getItem('google-accounts');
        setAccounts(storedAccounts ? JSON.parse(storedAccounts) : []);
      } catch (e) {
        console.error("Failed to parse Google accounts from localStorage", e);
        setAccounts([]);
      }
      setShowNewAccountForm(false);
      setNewEmail('');
      setError('');
    }
  }, [isOpen]);
  
  const handleSelectExisting = (email: string) => {
    onAccountSelect(email);
  };

  const handleAddNewAccount = (e: FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    if (!/\S+@\S+\.\S+/.test(newEmail)) {
        setError(t.invalidEmail);
        return;
    }
    
    setError('');

    if (!accounts.includes(newEmail)) {
        const newAccounts = [...accounts, newEmail];
        setAccounts(newAccounts);
        localStorage.setItem('google-accounts', JSON.stringify(newAccounts));
    }
    
    onAccountSelect(newEmail);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-md p-6 sm:p-8 transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <GoogleIcon className="w-10 h-10 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-100">{t.chooseAnAccount}</h2>
          <p className="text-base text-gray-400">{t.continueToAppName}</p>
        </div>

        {!showNewAccountForm ? (
          <ul className="space-y-1">
            {accounts.map(email => (
              <li key={email}>
                <button
                  onClick={() => handleSelectExisting(email)}
                  className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-gray-700/50 transition-colors text-left"
                >
                  <UserCircleIcon className="w-10 h-10 text-gray-400 flex-shrink-0" />
                  <span className="font-semibold text-gray-200 text-lg truncate">{email}</span>
                </button>
              </li>
            ))}
            <li>
              <button
                onClick={() => setShowNewAccountForm(true)}
                className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-gray-700/50 transition-colors text-left"
              >
                <UserCircleIcon className="w-10 h-10 text-gray-400 flex-shrink-0" />
                <span className="font-semibold text-gray-200 text-lg">{t.useAnotherAccount}</span>
              </button>
            </li>
          </ul>
        ) : (
          <form onSubmit={handleAddNewAccount}>
            <p className="text-center text-gray-300 mb-4">{t.signIn}</p>
            <div>
              <input
                type="email"
                placeholder={t.enterYourEmail}
                value={newEmail}
                onChange={e => {
                    setNewEmail(e.target.value);
                    setError('');
                }}
                autoFocus
                className="w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
            <div className="flex justify-between items-center mt-6">
              <button
                type="button"
                onClick={() => setShowNewAccountForm(false)}
                className="flex items-center gap-2 px-4 py-2 text-purple-400 font-semibold rounded-lg hover:bg-purple-600/20 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                {t.back}
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
              >
                {t.signIn}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default GoogleAccountSelectorModal;
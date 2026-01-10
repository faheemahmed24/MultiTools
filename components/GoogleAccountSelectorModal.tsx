
import React, { useState, useEffect, FormEvent } from 'react';
import type { TranslationSet, User } from '../types';
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
        const usersJson = localStorage.getItem('users');
        const users: User[] = usersJson ? JSON.parse(usersJson) : [];
        const userEmails = users.map(user => user.email);
        setAccounts(userEmails);
        setShowNewAccountForm(userEmails.length === 0);
      } catch (e) {
        setAccounts([]);
        setShowNewAccountForm(true);
      }
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
    onAccountSelect(newEmail);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-4 transition-all duration-500 animate-fadeIn" onClick={onClose}>
      <div 
        className="bg-[#0D0D15] border border-white/10 rounded-[2rem] shadow-2xl w-full max-w-md p-10 transform transition-all animate-pop-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl ring-4 ring-white/5">
            <GoogleIcon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase">{t.chooseAnAccount}</h2>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mt-2">{t.continueToAppName}</p>
        </div>

        {!showNewAccountForm ? (
          <div className="space-y-2">
            {accounts.map(email => (
              <button
                key={email}
                onClick={() => handleSelectExisting(email)}
                className="w-full group flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
              >
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserCircleIcon className="w-6 h-6 text-purple-400" />
                </div>
                <span className="font-bold text-gray-200 text-sm truncate">{email}</span>
              </button>
            ))}
            <button
              onClick={() => setShowNewAccountForm(true)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-transparent hover:bg-white/5 transition-all border border-dashed border-white/10"
            >
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                <UserCircleIcon className="w-6 h-6 text-gray-500" />
              </div>
              <span className="font-bold text-gray-500 text-sm">{t.useAnotherAccount}</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleAddNewAccount} className="animate-fadeIn">
            <div className="space-y-4">
              <input
                type="email"
                placeholder={t.enterYourEmail}
                value={newEmail}
                onChange={e => { setNewEmail(e.target.value); setError(''); }}
                autoFocus
                className="w-full bg-black/40 border border-white/10 focus:border-purple-500 text-white rounded-xl py-3.5 px-4 outline-none transition-all placeholder:text-gray-800 text-sm"
              />
              {error && <p className="text-[10px] font-bold text-red-400">{error}</p>}
            </div>
            
            <div className="flex justify-between items-center mt-10">
              <button
                type="button"
                onClick={() => accounts.length > 0 ? setShowNewAccountForm(false) : onClose()}
                className="flex items-center gap-2 px-4 py-2 text-purple-400 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-purple-600/10 transition-all"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                {accounts.length > 0 ? t.back : t.cancel}
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-purple-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-purple-500 shadow-xl transition-all"
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

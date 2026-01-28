import React, { useState, useEffect, FormEvent } from 'react';
import type { TranslationSet, User } from '../types';
import { GoogleIcon } from './icons/GoogleIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
// Added PlusIcon import to fix the "Cannot find name 'PlusIcon'" error on line 110
import { PlusIcon } from './icons/PlusIcon';

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
  const [isQuerying, setIsQuerying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsQuerying(true);
      // Simulate browser "Querying" accounts...
      const timer = setTimeout(() => {
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
        setIsQuerying(false);
      }, 800);
      
      setNewEmail('');
      setError('');
      return () => clearTimeout(timer);
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
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <div 
        className="bg-[#0A0A0F] border border-white/[0.05] rounded-[2.5rem] shadow-2xl w-full max-w-md p-12 transform transition-all animate-pop-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
            <GoogleIcon className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none mb-3">
            {isQuerying ? 'Connecting...' : t.chooseAnAccount}
          </h2>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.25em]">
            {isQuerying ? 'Syncing with browser sessions' : t.continueToAppName}
          </p>
        </div>

        {isQuerying ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
             <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
          </div>
        ) : !showNewAccountForm ? (
          <div className="space-y-3 mb-10">
            {accounts.map(email => (
              <button
                key={email}
                onClick={() => handleSelectExisting(email)}
                className="w-full group flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] transition-all border border-transparent hover:border-purple-500/20"
              >
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <UserCircleIcon className="w-7 h-7 text-purple-400" />
                </div>
                <div className="text-left overflow-hidden">
                    <span className="block font-bold text-gray-200 text-sm truncate">{email}</span>
                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Logged in</span>
                </div>
              </button>
            ))}
            <button
              onClick={() => setShowNewAccountForm(true)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-transparent hover:bg-white/[0.03] transition-all border border-dashed border-white/10 mt-4"
            >
              <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center">
                <PlusIcon className="w-6 h-6 text-gray-500" />
              </div>
              <span className="font-bold text-gray-500 text-sm">{t.useAnotherAccount}</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleAddNewAccount} className="animate-fadeIn">
            <div className="space-y-4 mb-10">
              <div className="relative group">
                <input
                    type="email"
                    placeholder={t.enterYourEmail}
                    value={newEmail}
                    onChange={e => { setNewEmail(e.target.value); setError(''); }}
                    autoFocus
                    className="w-full bg-[#050508] border border-purple-500/40 focus:border-purple-500 text-white rounded-2xl py-5 px-6 outline-none transition-all placeholder:text-gray-700 text-base shadow-inner"
                />
                <div className="absolute inset-0 rounded-2xl pointer-events-none border border-transparent group-focus-within:border-purple-500/30 transition-all"></div>
              </div>
              {error && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest ml-2">{error}</p>}
            </div>
            
            <div className="flex justify-between items-center mt-12">
              <button
                type="button"
                onClick={() => accounts.length > 0 ? setShowNewAccountForm(false) : onClose()}
                className="flex items-center gap-2 px-2 py-2 text-gray-500 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all group"
              >
                <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                {accounts.length > 0 ? t.back : t.cancel}
              </button>
              <button
                type="submit"
                className="px-10 py-4 bg-purple-600 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:bg-purple-500 shadow-[0_10px_30px_rgba(168,85,247,0.3)] active:scale-95 transition-all"
              >
                {t.signIn}
              </button>
            </div>
          </form>
        )}

        {!showNewAccountForm && (
            <div className="flex justify-start">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex items-center gap-2 px-2 py-2 text-gray-500 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all group"
                >
                    <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    {t.cancel}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default GoogleAccountSelectorModal;
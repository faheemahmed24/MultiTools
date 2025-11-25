
import React, { useState } from 'react';

interface PanelProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

const Panel: React.FC<PanelProps> = ({ title, children, defaultOpen = true, className }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-lg flex flex-col overflow-hidden transform-gpu ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-4 bg-gray-700/30 hover:bg-gray-700/50 transition-colors w-full text-left"
        aria-expanded={isOpen}
      >
        <h3 className="font-bold text-lg text-gray-200">{title}</h3>
        <i className={`fas fa-chevron-down w-6 h-6 text-gray-400 transition-transform duration-300 flex items-center justify-center ${isOpen ? '' : 'rotate-180'}`} />
      </button>
      <div 
        className="grid transition-all duration-300 ease-in-out"
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
            <div className="p-6 pt-4">
              {children}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Panel;

import React from 'react';

interface ComingSoonProps {
  toolName: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ toolName }) => {
  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center text-center min-h-[60vh] lg:h-full">
      <i className="fas fa-cog w-20 h-20 text-purple-500 animate-spin-slow mb-6 text-7xl" />
      <h2 className="text-3xl font-bold text-gray-100">{toolName}</h2>
      <p className="mt-2 text-lg text-gray-400">This feature is under construction.</p>
      <p className="mt-1 text-gray-500">Check back soon!</p>
    </div>
  );
};

export default ComingSoon;
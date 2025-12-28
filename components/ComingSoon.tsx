import React from 'react';

const ComingSoon: React.FC<{ toolName: string }> = ({ toolName }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="text-6xl mb-4">🚧</div>
      <h2 className="text-2xl font-bold text-white mb-2">{toolName}</h2>
      <p className="text-gray-400">This tool is currently under development. Check back soon!</p>
    </div>
  );
};

export default ComingSoon;
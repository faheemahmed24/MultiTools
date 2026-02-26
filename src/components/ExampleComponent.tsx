import React from 'react';

interface ExampleComponentProps {
  title: string;
  description: string;
}

const ExampleComponent: React.FC<ExampleComponentProps> = ({ title, description }) => {
  return (
    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
};

export default ExampleComponent;

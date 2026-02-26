import React from 'react';

export const WordToPdfIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    {/* Base Document */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    {/* PDF letters inside */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 13.5v3m0-3h1.5a1.5 1.5 0 010 3H8.25" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 13.5v3m0-3h1.5a1.5 1.5 0 010 3H12" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 13.5v3m0-3h-1.5" />
  </svg>
);

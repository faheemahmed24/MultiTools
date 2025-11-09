import React from 'react';

export const SpinnerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      clipRule="evenodd"
      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm0 1.5a8.25 8.25 0 100 16.5 8.25 8.25 0 000-16.5z"
      fill="currentColor"
      fillOpacity="0.2"
    />
    <path
      d="M12 2.25a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 0112 2.25z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

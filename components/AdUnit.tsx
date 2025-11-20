
import React, { useEffect, useRef } from 'react';

interface AdUnitProps {
  slotId?: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  className?: string;
}

const AdUnit: React.FC<AdUnitProps> = ({ slotId = "7406471479", format = "auto", className = "" }) => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      // Check if the ad has already been pushed to this specific element to avoid errors
      if (adRef.current && adRef.current.querySelector('ins') && adRef.current.querySelector('ins')?.getAttribute('data-ad-status') === 'filled') {
          return;
      }

      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error", e);
    }
  }, []);

  return (
    <div ref={adRef} className={`w-full my-6 text-center overflow-hidden bg-gray-800/30 rounded-lg border border-gray-700/50 min-h-[100px] flex flex-col items-center justify-center ${className}`}>
        <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-2 pt-2">Advertisement</p>
         <ins className="adsbygoogle"
             style={{ display: 'block', minWidth: '250px' }}
             data-ad-client="ca-pub-3766117905337171"
             data-ad-slot={slotId}
             data-ad-format={format}
             data-full-width-responsive="true"></ins>
    </div>
  );
};

export default AdUnit;

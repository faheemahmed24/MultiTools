import React, { useEffect, useRef } from 'react';

interface AdUnitProps {
  slot: string;
  format?: string;
  responsive?: string;
  className?: string;
  minHeight?: string;
}

const AdUnit: React.FC<AdUnitProps> = ({ 
  slot, 
  format = "auto", 
  responsive = "true",
  className = "",
  minHeight = "280px"
}) => {
  const adInitRef = useRef<boolean>(false);

  useEffect(() => {
    // Safety check for browser environment
    if (typeof window === 'undefined') return;
    if (adInitRef.current) return;
    
    const initTimer = setTimeout(() => {
      try {
        // @ts-ignore
        const adsbygoogle = window.adsbygoogle || [];
        if (typeof adsbygoogle.push === 'function') {
          adsbygoogle.push({});
          adInitRef.current = true;
          console.debug(`[AdSense] Slot ${slot} mounted.`);
        }
      } catch (e) {
        console.warn("[AdSense] Integration error:", e);
      }
    }, 500);

    return () => {
      clearTimeout(initTimer);
      adInitRef.current = false;
    };
  }, [slot]);

  return (
    <div 
      className={`ad-wrapper overflow-hidden bg-white/[0.01] border border-dashed border-white/5 flex flex-col items-center justify-center rounded-2xl ${className}`}
      style={{ minHeight, width: '100%', marginBottom: '2rem' }}
    >
      <div className="w-full text-center text-[8px] font-bold text-gray-800 uppercase tracking-widest mb-2 pointer-events-none select-none">
        Advertisements
      </div>
      <ins className="adsbygoogle"
           style={{ display: 'block', width: '100%', minWidth: '250px' }}
           data-ad-client="ca-pub-3766117905337171"
           data-ad-slot={slot}
           data-ad-format={format}
           data-full-width-responsive={responsive}></ins>
    </div>
  );
};

export default AdUnit;
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
    // Prevent double initialization during React strict mode or navigation
    if (adInitRef.current) return;
    
    const initTimer = setTimeout(() => {
      try {
        // @ts-ignore
        const adsbygoogle = window.adsbygoogle || [];
        if (typeof adsbygoogle.push === 'function') {
          adsbygoogle.push({});
          adInitRef.current = true;
          console.debug(`[AdSense] Slot ${slot} initialized.`);
        }
      } catch (e) {
        console.warn("[AdSense] Initialization skipped or blocked:", e);
      }
    }, 400); // Wait for page transitions to finish

    return () => {
      clearTimeout(initTimer);
      adInitRef.current = false;
    };
  }, [slot]);

  return (
    <div 
      className={`ad-wrapper overflow-hidden bg-white/[0.01] border border-dashed border-white/5 flex flex-col items-center justify-center transition-opacity duration-700 rounded-2xl ${className}`}
      style={{ minHeight, width: '100%' }}
    >
      <div className="w-full text-center text-[7px] font-black text-gray-800 uppercase tracking-[0.3em] mb-2 pointer-events-none select-none">
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
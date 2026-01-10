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
    // Only initialize once per mount
    if (adInitRef.current) return;
    
    const initTimer = setTimeout(() => {
      try {
        // @ts-ignore
        const adsbygoogle = (window as any).adsbygoogle || [];
        if (adsbygoogle && typeof adsbygoogle.push === 'function') {
          adsbygoogle.push({});
          adInitRef.current = true;
        }
      } catch (e) {
        console.warn("[AdSense] Integration notice: Waiting for script load.");
      }
    }, 1500); // 1.5s delay to ensure full page hydration

    return () => {
      clearTimeout(initTimer);
    };
  }, [slot]);

  return (
    <div 
      className={`ad-wrapper overflow-hidden bg-white/[0.01] border border-dashed border-white/5 flex flex-col items-center justify-center rounded-2xl ${className}`}
      style={{ minHeight, width: '100%', marginBottom: '2rem', position: 'relative' }}
    >
      <div className="absolute top-2 w-full text-center text-[8px] font-black text-gray-800 uppercase tracking-widest pointer-events-none select-none">
        Advertisement Terminal
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
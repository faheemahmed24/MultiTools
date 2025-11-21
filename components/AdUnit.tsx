
import React, { useEffect, useRef, useState } from 'react';

interface AdUnitProps {
  slotId?: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  className?: string;
}

const AdUnit: React.FC<AdUnitProps> = ({ slotId = "7406471479", format = "auto", className = "" }) => {
  const adRef = useRef<HTMLDivElement>(null);
  const [isAdRequested, setIsAdRequested] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const attemptLoadAd = () => {
      const element = adRef.current;
      if (!element) return;

      // If the element has no width (e.g. hidden or not layout yet), retry later.
      // This prevents "No slot size for availableWidth=0" errors.
      if (element.offsetWidth === 0) {
        timeoutId = setTimeout(attemptLoadAd, 500);
        return;
      }

      try {
        // Check if the ad ins element already has status or content
        const ins = element.querySelector('ins');
        if (ins) {
           const status = ins.getAttribute('data-ad-status');
           // If populated or marked as unfilled (no ad available), don't push again
           if (status === 'filled' || status === 'unfilled' || ins.innerHTML.trim().length > 0) {
               return;
           }
        }

        // Push the ad
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setIsAdRequested(true);
      } catch (e) {
        console.error("AdSense error", e);
      }
    };

    // Only attempt if we haven't successfully requested yet in this mount lifecycle
    if (!isAdRequested) {
       // Small delay to allow initial layout/transitions to start
       timeoutId = setTimeout(attemptLoadAd, 200);
    }

    return () => {
        if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isAdRequested, slotId]);

  return (
    <div ref={adRef} className={`w-full my-6 text-center overflow-hidden bg-gray-800/30 rounded-lg border border-gray-700/50 min-h-[100px] flex flex-col items-center justify-center ${className}`}>
        <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-2 pt-2">Advertisement</p>
         <ins className="adsbygoogle"
             style={{ display: 'block', width: '100%' }}
             data-ad-client="ca-pub-3766117905337171"
             data-ad-slot={slotId}
             data-ad-format={format}
             data-full-width-responsive="true"></ins>
    </div>
  );
};

export default AdUnit;

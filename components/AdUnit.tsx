
import React, { useEffect } from 'react';

interface AdUnitProps {
  slotId?: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  className?: string;
}

const AdUnit: React.FC<AdUnitProps> = ({ slotId = "7406471479", format = "auto", className = "" }) => {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error", e);
    }
  }, []);

  return (
    <div className={`w-full my-4 text-center overflow-hidden ${className}`}>
        <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-1">Advertisement</p>
         <ins className="adsbygoogle"
             style={{ display: 'block' }}
             data-ad-client="ca-pub-3766117905337171"
             data-ad-slot={slotId}
             data-ad-format={format}
             data-full-width-responsive="true"></ins>
    </div>
  );
};

export default AdUnit;

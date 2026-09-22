import { useEffect, useRef } from 'react';

const AdSense = ({ client, slot, format = 'auto', responsive = 'true' }) => {
    const adRef = useRef(null);

    useEffect(() => {
        if (adRef.current && adRef.current.getAttribute('data-adsbygoogle-status')) {
            return;
        }

        const timer = setTimeout(() => {
            try {
                if (window.adsbygoogle && adRef.current) {
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                }
            } catch (error) {
                console.error('AdSense error:', error);
            }
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div
            style={{
                width: '100%',
                maxWidth: '100%',
                height: '100%',
                maxHeight: '100%',
                overflow: 'hidden',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <ins
                ref={adRef}
                className="adsbygoogle"
                style={{
                    display: 'block',
                    width: '100%',
                    minWidth: '250px',
                    height: '100%',
                    maxHeight: '100%',
                    overflow: 'hidden',
                }}
                data-ad-client={client}
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive={responsive}
            />
        </div>
    );
};

export default AdSense;
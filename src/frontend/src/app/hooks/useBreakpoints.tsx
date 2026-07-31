import { useEffect, useState } from 'react';

const getMatch = (query: string) => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
};
const MOBILE_MAX = 767.98;

export const useBreakpoints = () => {
    const getWidth = () =>
        typeof window !== 'undefined' ? window.innerWidth : 0;

    const [width, setWidth] = useState(getWidth);

    useEffect(() => {
        const handleResize = () => {
            setWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = width <= 767.98;
    const isTablet = width > 767.98 && width <= 1024;

    return {
        width,
        isMobile,
        isTablet,
        isTabletOrMobile: width <= 1024,
    };
};

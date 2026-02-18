'use client';

import { useEffect, useRef, useState } from 'react';

interface UseScrollRevealOptions {
    threshold?: number;
    rootMargin?: string;
    triggerOnce?: boolean;
}

/**
 * Custom hook that uses IntersectionObserver to detect when an element
 * enters the viewport. Returns a ref and visibility state.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
    options: UseScrollRevealOptions = {}
) {
    const { threshold = 0.15, rootMargin = '0px 0px -60px 0px', triggerOnce = true } = options;
    const ref = useRef<T>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    if (triggerOnce) {
                        observer.unobserve(element);
                    }
                } else if (!triggerOnce) {
                    setIsVisible(false);
                }
            },
            { threshold, rootMargin }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [threshold, rootMargin, triggerOnce]);

    return { ref, isVisible };
}

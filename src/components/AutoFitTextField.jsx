'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

function parseFontSize(value, fallback) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return fallback;
}

export default function AutoFitTextField({
    as = 'input',
    value = '',
    placeholder = '',
    style,
    minFontSize = 11,
    baseFontSize = 16,
    maxFontSize,
    multiline = false,
    ...props
}) {
    const controlRef = useRef(null);
    const measureRef = useRef(null);
    const resolvedMaxFontSize = maxFontSize ?? parseFontSize(style?.fontSize, baseFontSize);
    const [fontSize, setFontSize] = useState(resolvedMaxFontSize);

    const resizeToFit = useCallback(() => {
        const control = controlRef.current;
        const measure = measureRef.current;
        if (!control || !measure || typeof window === 'undefined') return;

        const computed = window.getComputedStyle(control);
        const availableWidth = control.clientWidth
            - parseFloat(computed.paddingLeft || '0')
            - parseFloat(computed.paddingRight || '0')
            - 4;

        if (availableWidth <= 0) return;

        const text = `${value ?? ''}` || placeholder || '';
        if (!text) {
            setFontSize(prev => (prev === resolvedMaxFontSize ? prev : resolvedMaxFontSize));
            return;
        }

        measure.style.fontFamily = computed.fontFamily;
        measure.style.fontWeight = computed.fontWeight;
        measure.style.fontStyle = computed.fontStyle;
        measure.style.letterSpacing = computed.letterSpacing;
        measure.style.textTransform = computed.textTransform;

        const lines = (multiline ? text.split('\n') : [text]).map(line => line || ' ');
        let nextFontSize = resolvedMaxFontSize;

        while (nextFontSize > minFontSize) {
            measure.style.fontSize = `${nextFontSize}px`;

            const widestLine = lines.reduce((widest, line) => {
                measure.textContent = line;
                return Math.max(widest, measure.getBoundingClientRect().width);
            }, 0);

            if (widestLine <= availableWidth) break;
            nextFontSize -= 1;
        }

        if (nextFontSize < minFontSize) {
            nextFontSize = minFontSize;
        }

        setFontSize(prev => (prev === nextFontSize ? prev : nextFontSize));
    }, [minFontSize, multiline, placeholder, resolvedMaxFontSize, value]);

    useEffect(() => {
        resizeToFit();
    }, [resizeToFit]);

    useEffect(() => {
        const control = controlRef.current;
        if (!control || typeof ResizeObserver === 'undefined') return;

        const observer = new ResizeObserver(() => resizeToFit());
        observer.observe(control);

        return () => observer.disconnect();
    }, [resizeToFit]);

    const sharedStyle = {
        ...style,
        fontSize: `${fontSize}px`,
    };

    return (
        <>
            {as === 'textarea' ? (
                <textarea
                    ref={controlRef}
                    value={value}
                    placeholder={placeholder}
                    style={sharedStyle}
                    {...props}
                />
            ) : (
                <input
                    ref={controlRef}
                    value={value}
                    placeholder={placeholder}
                    style={sharedStyle}
                    {...props}
                />
            )}
            <span
                ref={measureRef}
                aria-hidden="true"
                style={{
                    position: 'fixed',
                    top: '-9999px',
                    left: '-9999px',
                    visibility: 'hidden',
                    pointerEvents: 'none',
                    whiteSpace: 'pre',
                }}
            />
        </>
    );
}

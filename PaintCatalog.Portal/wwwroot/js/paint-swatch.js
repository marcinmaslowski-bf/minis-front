(function (global) {
    const defaultFallback = '#475569';

    function normalizeHex(value) {
        if (!value) return null;
        const hex = String(value).trim();
        if (!hex) return null;
        return hex.startsWith('#') ? hex : `#${hex}`;
    }

    function buildPaintSwatch(paint, fallbackHex, options = {}) {
        const gradientType = Number(paint?.gradientType);
        const hexColor = normalizeHex(paint?.hexColor);
        const hexFrom = normalizeHex(paint?.hexFrom);
        const hexTo = normalizeHex(paint?.hexTo);
        const defaultHex = normalizeHex(options.defaultHex) || normalizeHex(fallbackHex) || defaultFallback;

        if (gradientType === 1 && hexFrom && hexTo) {
            return {
                background: `linear-gradient(90deg, ${hexFrom}, ${hexTo})`,
                label: `${hexFrom} → ${hexTo}`
            };
        }

        if (gradientType === 2 && hexFrom && hexTo) {
            return {
                background: `radial-gradient(circle, ${hexTo} 0%, ${hexFrom} 100%)`,
                label: `${hexFrom} → ${hexTo}`
            };
        }

        if (gradientType === 99 && hexColor) {
            return {
                background: hexColor,
                label: hexColor
            };
        }

        return {
            background: `linear-gradient(90deg, ${defaultHex}, #0f172a)`,
            label: defaultHex
        };
    }

    global.paintSwatchUtils = {
        normalizeHex,
        buildPaintSwatch
    };
})(typeof window !== 'undefined' ? window : this);

// Utility functions for chart components to handle dynamic styling without inline styles

/**
 * Apply color variables to chart indicator elements
 * This function should be called in useEffect or useLayoutEffect
 * @param {HTMLElement} element - The chart indicator element
 */
export function applyChartIndicatorColors(element) {
    if (!element) return;

    const bgColor = element.getAttribute('data-color-bg');
    const borderColor = element.getAttribute('data-color-border');

    if (bgColor) {
        element.style.setProperty('--color-bg', bgColor);
    }

    if (borderColor) {
        element.style.setProperty('--color-border', borderColor);
    }
}

/**
 * Apply background color to chart legend items
 * This function should be called in useEffect or useLayoutEffect
 * @param {HTMLElement} element - The chart legend item element
 */
export function applyChartLegendColors(element) {
    if (!element) return;

    const bgColor = element.getAttribute('data-bg-color');

    if (bgColor) {
        element.style.backgroundColor = bgColor;
    }
}
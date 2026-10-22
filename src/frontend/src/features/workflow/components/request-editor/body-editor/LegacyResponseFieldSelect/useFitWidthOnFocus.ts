import { useEffect, useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react';

const MAX_WIDTH = 560;
const EDGE_GUTTER = 8;

let measureContext: CanvasRenderingContext2D | null = null;

function measureText(text: string, input: HTMLInputElement) {
  measureContext ??= document.createElement('canvas').getContext('2d');
  if (!measureContext) return 0;
  const style = getComputedStyle(input);
  measureContext.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  return Math.ceil(measureContext.measureText(text).width);
}

/** Right edge of the nearest ancestor that would clip an overflowing child. */
function getClipRight(element: HTMLElement) {
  for (let node = element.parentElement; node; node = node.parentElement) {
    if (getComputedStyle(node).overflowX !== 'visible') return node.getBoundingClientRect().right;
  }
  return document.documentElement.clientWidth;
}

/**
 * Keeps a long path readable. While focused, widens the select to fit `text`
 * when it doesn't; the extra width is cancelled by an equal negative end margin,
 * so the select overlays its right neighbours instead of reflowing the row —
 * operator rows have no room to grow. Unfocused, shows the end of the path.
 */
export function useFitWidthOnFocus(hostRef: RefObject<HTMLDivElement | null>, text: string) {
  const [isFocused, setIsFocused] = useState(false);
  const [layout, setLayout] = useState<{ width: number; hostWidth: number } | null>(null);

  useLayoutEffect(() => {
    const host = hostRef.current;
    const input = host?.querySelector('input');
    const select = input?.closest<HTMLElement>('.ant-select');
    if (!isFocused || !host || !(input instanceof HTMLInputElement) || !select) {
      setLayout(null);
      return;
    }
    const hostRect = host.getBoundingClientRect();
    const chrome = select.offsetWidth - input.clientWidth;
    const available = getClipRight(host) - hostRect.left - EDGE_GUTTER;
    const width = Math.min(measureText(text, input) + chrome + 2, MAX_WIDTH, available);
    setLayout(width > hostRect.width ? { width, hostWidth: hostRect.width } : null);
  }, [hostRef, isFocused, text]);

  const [isTailShown, setIsTailShown] = useState(false);

  // Unfocused, an input shows the start of an overflowing value; the last
  // segments are what tell paths apart, so scroll to the end instead.
  useEffect(() => {
    const input = hostRef.current?.querySelector('input');
    if (isFocused || !(input instanceof HTMLInputElement)) {
      setIsTailShown(false);
      return;
    }
    const showTail = () => {
      const isOverflowing = input.scrollWidth > input.clientWidth;
      input.scrollLeft = isOverflowing ? input.scrollWidth : 0;
      setIsTailShown(isOverflowing);
    };
    // Browsers reset the scroll on blur after the event, so wait a frame.
    const frame = requestAnimationFrame(showTail);
    const observer = new ResizeObserver(showTail);
    observer.observe(input);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [hostRef, isFocused, text]);

  const style: CSSProperties | undefined = layout
    ? { width: layout.width, marginInlineEnd: layout.hostWidth - layout.width }
    : undefined;

  return {
    isExpanded: layout !== null,
    isTailShown,
    style,
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
  };
}

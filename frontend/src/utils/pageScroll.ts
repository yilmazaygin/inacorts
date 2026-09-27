function wheelPixels(event: WheelEvent): number {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 16;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * window.innerHeight;
  return event.deltaY;
}

function canScrollY(node: Element): boolean {
  const overflowY = window.getComputedStyle(node).overflowY;
  return (overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight + 1;
}

function blocksVerticalScroll(node: Element): boolean {
  const overflowX = window.getComputedStyle(node).overflowX;
  const horizontal = overflowX === 'auto' || overflowX === 'scroll' || overflowX === 'hidden';
  return horizontal && node.scrollWidth > node.clientWidth + 1 && !canScrollY(node);
}

function onWheel(event: WheelEvent) {
  if (event.ctrlKey || event.defaultPrevented) return;
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
  if (!(event.target instanceof Element)) return;

  let node: Element | null = event.target;
  let blocked = false;
  while (node && node !== document.documentElement) {
    if (canScrollY(node)) {
      if (!blocked) return;
      event.preventDefault();
      node.scrollTop += wheelPixels(event);
      return;
    }
    if (blocksVerticalScroll(node)) blocked = true;
    node = node.parentElement;
  }

  if (!blocked) return;
  event.preventDefault();
  const scroller = document.scrollingElement ?? document.documentElement;
  scroller.scrollTop += wheelPixels(event);
}

export function installPageScroll(): void {
  window.addEventListener('wheel', onWheel, { passive: false });
}

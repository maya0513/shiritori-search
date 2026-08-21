const MOBILE_BREAKPOINT = 640;
const TABLET_BREAKPOINT = 1024;
const SHORT_VIEWPORT = 600;
const VERY_SHORT_VIEWPORT = 480;

export function displayLimitForViewport(
  width: number,
  height: number,
): number {
  if (width < MOBILE_BREAKPOINT) {
    if (height < VERY_SHORT_VIEWPORT) return 2;
    if (height < SHORT_VIEWPORT) return 3;
    return 4;
  }

  if (width < TABLET_BREAKPOINT) {
    return height < SHORT_VIEWPORT ? 4 : 6;
  }

  return 10;
}

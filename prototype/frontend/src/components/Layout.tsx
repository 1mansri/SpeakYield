/**
 * The phone-width frame, and the app's one fixed-height box.
 *
 * Height is pinned rather than min-height'd so the app shell below can own a real
 * scroll region — that's what lets the tab bar pin to the bottom of the *frame* and the
 * market scroll underneath it, instead of the whole page scrolling and taking the
 * chrome with it. Padding deliberately lives in the children, not here: the shell needs
 * its header and tab bar edge to edge, while the flow screens want a gutter.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 justify-center overflow-hidden bg-background">
      <div className="flex w-full max-w-[480px] flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}

/** Gutter for the single-focus transaction screens, which render outside the app shell.
 *  They scroll on their own since there is no shell around them to do it. The bar itself
 *  is hidden: the frame is 480px wide and centred, so on a desktop its scrollbar lands in
 *  the middle of the screen — a stray strip of chrome cutting the phone in half. */
export function FlowFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="no-scrollbar flex flex-1 flex-col overflow-y-auto px-5 py-6">{children}</div>
  );
}

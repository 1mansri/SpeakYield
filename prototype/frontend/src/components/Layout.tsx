/**
 * The phone-width frame. Padding deliberately lives in the children, not here: the app
 * shell needs its header and tab bar to run edge-to-edge, while the flow screens want a
 * comfortable gutter (see `FlowFrame`).
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 justify-center bg-background">
      <div className="flex w-full max-w-[480px] flex-1 flex-col">{children}</div>
    </div>
  );
}

/** Gutter for the single-focus transaction screens, which render outside the app shell. */
export function FlowFrame({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col px-5 py-6">{children}</div>;
}

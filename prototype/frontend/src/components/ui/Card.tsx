export default function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface p-5 shadow-[0_1px_3px_rgba(38,36,32,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}

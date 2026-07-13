export default function LoadingScreen({ text }: { text: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-accent"
        aria-hidden
      />
      <p className="text-lg font-semibold text-text-secondary">{text}</p>
    </div>
  );
}

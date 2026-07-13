export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 justify-center bg-background">
      <div className="flex w-full max-w-[480px] flex-1 flex-col px-5 py-6">{children}</div>
    </div>
  );
}

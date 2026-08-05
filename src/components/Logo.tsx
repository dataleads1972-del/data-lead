export function Logo({ className }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="LeadAI"
      className={className}
      loading="eager"
      width={1024}
      height={1024}
    />
  );
}


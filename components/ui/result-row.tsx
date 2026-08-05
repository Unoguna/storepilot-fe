export function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[140px_1fr]">
      <span className="whitespace-nowrap font-extrabold">{label}</span>
      <span className="break-all">{value}</span>
    </div>
  );
}

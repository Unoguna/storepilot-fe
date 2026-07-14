export function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-teal-700 text-xs font-black text-white">
        ✓
      </span>
      <span>{text}</span>
    </div>
  );
}

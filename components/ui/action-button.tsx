export function ActionButton({
  children,
  disabled,
  loading,
}: {
  children: React.ReactNode;
  disabled: boolean;
  loading: boolean;
}) {
  return (
    <button
      className="h-12 w-fit rounded-md bg-teal-700 px-5 font-extrabold text-white transition hover:bg-teal-800 disabled:cursor-wait disabled:bg-slate-400"
      disabled={disabled}
      type="submit"
    >
      {children}
      <span className="sr-only">{loading ? "loading" : ""}</span>
    </button>
  );
}

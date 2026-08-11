export function ActionButton({
  children,
  disabled,
  loading,
  onClick,
  type = "submit",
}: {
  children: React.ReactNode;
  disabled: boolean;
  loading: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit";
}) {
  return (
    <button
      className="h-12 w-fit rounded-md bg-teal-700 px-5 font-extrabold text-white transition hover:bg-teal-800 disabled:cursor-wait disabled:bg-slate-400"
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
      <span className="sr-only">{loading ? "loading" : ""}</span>
    </button>
  );
}

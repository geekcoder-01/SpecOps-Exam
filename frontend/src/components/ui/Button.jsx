export default function Button({ children, variant = "primary", className = "", ...props }) {
  const base =
    "rounded-xl px-6 py-3 font-semibold transition duration-300";

  const styles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-slate-600 text-white hover:border-blue-400",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
export default function Input({ label, ...props }) {
  return (
    <div>
      {label && <label className="mb-2 block text-sm text-slate-300">{label}</label>}
      <input
        className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
        {...props}
      />
    </div>
  );
}
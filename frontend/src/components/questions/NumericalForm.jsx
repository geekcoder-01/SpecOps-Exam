export default function NumericalForm({
  form,
  handleChange,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        Correct Numerical Answer
      </span>

      <input
        type="text"
        name="correct_answer"
        value={form.correct_answer}
        onChange={handleChange}
        placeholder="Example: 42 or 3.14"
        className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-purple-500"
      />

      <p className="mt-2 text-xs text-slate-500">
        Numerical tolerance can be added later.
      </p>
    </label>
  );
}
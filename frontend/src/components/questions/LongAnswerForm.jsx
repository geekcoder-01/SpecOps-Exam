export default function LongAnswerForm({
  form,
  handleChange,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        Model Answer / Evaluation Guideline
      </span>

      <textarea
        name="correct_answer"
        value={form.correct_answer}
        onChange={handleChange}
        placeholder="Enter the model answer or evaluation guideline..."
        className="min-h-56 w-full rounded-xl border border-white/10 bg-slate-900 p-4 outline-none focus:border-purple-500"
      />
    </label>
  );
}
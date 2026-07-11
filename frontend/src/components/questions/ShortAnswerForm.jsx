export default function ShortAnswerForm({
  form,
  handleChange,
}) {
  const label =
    form.question_type === "fill_blank"
      ? "Correct Answer"
      : "Model Answer";

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>

      <textarea
        name="correct_answer"
        value={form.correct_answer}
        onChange={handleChange}
        placeholder={
          form.question_type === "fill_blank"
            ? "Enter the expected answer"
            : "Enter the model answer"
        }
        className="min-h-32 w-full rounded-xl border border-white/10 bg-slate-900 p-4 outline-none focus:border-purple-500"
      />
    </label>
  );
}
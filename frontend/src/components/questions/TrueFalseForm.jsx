export default function TrueFalseForm({
  form,
  updateField,
}) {
  return (
    <div>
      <h3 className="mb-4 text-xl font-bold">
        Correct Answer
      </h3>

      <div className="flex gap-4">
        {["True", "False"].map((value) => (
          <label
            key={value}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-6 py-4 ${
              form.correct_answer === value
                ? "border-green-500 bg-green-500/10 text-green-300"
                : "border-white/10 bg-slate-900"
            }`}
          >
            <input
              type="radio"
              checked={form.correct_answer === value}
              onChange={() =>
                updateField("correct_answer", value)
              }
            />

            {value}
          </label>
        ))}
      </div>
    </div>
  );
}
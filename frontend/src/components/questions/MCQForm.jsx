const OPTIONS = [
  { key: "A", field: "option_a" },
  { key: "B", field: "option_b" },
  { key: "C", field: "option_c" },
  { key: "D", field: "option_d" },
];

export default function MCQForm({
  form,
  handleChange,
  updateField,
}) {
  const isMultiple = form.question_type === "multi_select";

  const toggleMultipleAnswer = (key) => {
    const selected = form.multiple_answers.includes(key);

    const updatedAnswers = selected
      ? form.multiple_answers.filter((answer) => answer !== key)
      : [...form.multiple_answers, key];

    updateField("multiple_answers", updatedAnswers);
  };

  return (
    <div>
      <h3 className="mb-4 text-xl font-bold">
        Answer Options
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        {OPTIONS.map((option) => (
          <label key={option.key} className="block">
            <span className="mb-2 block text-sm text-slate-300">
              Option {option.key}
            </span>

            <input
              name={option.field}
              value={form[option.field]}
              onChange={handleChange}
              placeholder={`Enter option ${option.key}`}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-purple-500"
            />
          </label>
        ))}
      </div>

      <div className="mt-6">
        <p className="mb-3 text-sm font-medium text-slate-300">
          {isMultiple
            ? "Select all correct options"
            : "Select the correct option"}
        </p>

        <div className="flex flex-wrap gap-3">
          {OPTIONS.map((option) => {
            const checked = isMultiple
              ? form.multiple_answers.includes(option.key)
              : form.correct_answer === option.key;

            return (
              <label
                key={option.key}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 ${
                  checked
                    ? "border-green-500 bg-green-500/10 text-green-300"
                    : "border-white/10 bg-slate-900 text-slate-300"
                }`}
              >
                <input
                  type={isMultiple ? "checkbox" : "radio"}
                  name="correct_mcq_answer"
                  checked={checked}
                  onChange={() =>
                    isMultiple
                      ? toggleMultipleAnswer(option.key)
                      : updateField("correct_answer", option.key)
                  }
                />

                Option {option.key}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
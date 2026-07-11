export default function QuestionPreview({
  form,
  subject,
}) {
  const options = [
    ["A", form.option_a],
    ["B", form.option_b],
    ["C", form.option_c],
    ["D", form.option_d],
  ];

  return (
    <aside className="h-fit rounded-3xl border border-white/10 bg-white/5 p-6 xl:sticky xl:top-28">
      <p className="text-xs uppercase tracking-widest text-purple-400">
        Student Preview
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge text={subject || "Subject"} />
        <Badge text={form.difficulty_level} />
        <Badge text={`${form.marks} Marks`} />
      </div>

      <h2 className="mt-6 text-xl font-bold">
        {form.question_text || "Your question will appear here"}
      </h2>

      {(form.question_type === "mcq" ||
        form.question_type === "multi_select") && (
        <div className="mt-6 space-y-3">
          {options.map(([key, value]) => (
            <div
              key={key}
              className="rounded-xl border border-white/10 bg-slate-900 p-4"
            >
              <span className="mr-3 font-bold text-purple-400">
                {key}.
              </span>

              {value || `Option ${key}`}
            </div>
          ))}
        </div>
      )}

      {form.question_type === "true_false" && (
        <div className="mt-6 space-y-3">
          <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
            ○ True
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
            ○ False
          </div>
        </div>
      )}

      {[
        "fill_blank",
        "numerical",
        "short_answer",
        "long_answer",
      ].includes(form.question_type) && (
        <div className="mt-6 min-h-32 rounded-xl border border-white/10 bg-slate-900 p-4 text-slate-500">
          Student answer area
        </div>
      )}

      {[
        "image_upload",
        "file_upload",
      ].includes(form.question_type) && (
        <div className="mt-6 rounded-xl border-2 border-dashed border-white/10 bg-slate-900 p-8 text-center text-slate-500">
          Upload answer
        </div>
      )}
    </aside>
  );
}

function Badge({ text }) {
  return (
    <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs text-purple-300">
      {text}
    </span>
  );
}
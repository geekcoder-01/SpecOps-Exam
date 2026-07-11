export default function QuestionBasicInfo({
  form,
  subjects,
  handleChange,
  onQuestionTypeChange,
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-7">
      <h2 className="text-2xl font-bold">
        Question Information
      </h2>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <SelectField
          label="Library Subject"
          name="library_subject_id"
          value={form.library_subject_id}
          onChange={handleChange}
        >
          <option value="">Select subject</option>

          {subjects.map((subject) => (
            <option
              key={subject.library_subject_id}
              value={subject.library_subject_id}
            >
              {subject.subject_name}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Question Type"
          name="question_type"
          value={form.question_type}
          onChange={(event) =>
            onQuestionTypeChange(event.target.value)
          }
        >
          <option value="mcq">
            Single Correct MCQ
          </option>

          <option value="multi_select">
            Multiple Correct MCQ
          </option>

          <option value="true_false">
            True / False
          </option>

          <option value="fill_blank">
            Fill in the Blank
          </option>

          <option value="numerical">
            Numerical Answer
          </option>

          <option value="short_answer">
            Short Answer
          </option>

          <option value="long_answer">
            Long Answer
          </option>

          <option value="image_upload">
            Image Upload Answer
          </option>

          <option value="file_upload">
            File Upload Answer
          </option>
        </SelectField>

        <SelectField
          label="Difficulty"
          name="difficulty_level"
          value={form.difficulty_level}
          onChange={handleChange}
        >
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </SelectField>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Marks
          </span>

          <input
            type="number"
            min="1"
            name="marks"
            value={form.marks}
            onChange={handleChange}
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-purple-500"
          />
        </label>
      </div>
    </section>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  children,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-purple-500"
      >
        {children}
      </select>
    </label>
  );
}
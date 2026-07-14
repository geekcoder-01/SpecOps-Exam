import { FaBookOpen } from "react-icons/fa";

export default function LibraryHeader({
  library,
  subjectsCount,
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-7">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-purple-600/20 text-3xl text-purple-400">
            <FaBookOpen />
          </div>

          <div>
            <p className="mb-2 text-sm text-slate-500">
              Question Libraries / {library.title}
            </p>

            <h1 className="text-3xl font-bold">
              {library.title}
            </h1>

            <div className="mt-3 flex flex-wrap gap-2">
              {library.purpose && (
                <Badge
                  text={library.purpose}
                  color="purple"
                />
              )}

              <Badge
                text={`${library.question_count || 0} Questions`}
                color="green"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <SummaryItem
            label="Subjects"
            value={subjectsCount}
          />

          <SummaryItem
            label="Questions"
            value={library.question_count || 0}
          />

          <SummaryItem
            label="Status"
            value="Active"
          />
        </div>
      </div>
    </section>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 px-5 py-4">
      <p className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold">
        {value}
      </p>
    </div>
  );
}

function Badge({ text, color }) {
  const styles = {
    purple: "bg-purple-500/15 text-purple-300",
    green: "bg-green-500/15 text-green-300",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        styles[color] || styles.purple
      }`}
    >
      {text}
    </span>
  );
}
import {
  FaShieldAlt,
  FaVideo,
  FaBrain,
  FaFlag,
  FaEye,
  FaMicrophone,
  FaLock,
  FaChartLine,
} from "react-icons/fa";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <nav className="fixed left-0 top-0 z-50 flex w-full items-center justify-between border-b border-white/10 bg-[#020617]/80 px-8 py-5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
            <FaShieldAlt />
          </div>
          <h1 className="text-2xl font-bold text-blue-400">SpecOps Exam</h1>
        </div>

        <div className="hidden gap-6 text-sm md:flex">
          <a href="#features" className="hover:text-blue-400">Features</a>
          <a href="#workflow" className="hover:text-blue-400">Workflow</a>
          <a href="#security" className="hover:text-blue-400">Security</a>
          <a href="/student/login" className="hover:text-blue-400">Student Login</a>
          <a href="/examiner/login" className="hover:text-blue-400">Examiner Login</a>
        </div>
      </nav>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-28">
        <div className="absolute left-20 top-32 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute bottom-20 right-20 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl" />

        <div className="relative z-10 grid max-w-7xl items-center gap-12 md:grid-cols-2">
          <div>
            <p className="mb-5 w-fit rounded-full border border-blue-500/40 px-4 py-2 text-sm text-blue-300">
              AI-Powered Secure Online Examination Platform
            </p>

            <h2 className="text-5xl font-extrabold leading-tight md:text-6xl">
              Secure. Smart. Intelligent Online Exams.
            </h2>

            <p className="mt-6 max-w-xl text-lg text-slate-300">
              SpecOps Exam enables secure online examinations with camera and microphone
              verification, AI proctoring, question flagging, automated evaluation,
              examiner review, and result analytics.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="/student/login"
                className="rounded-xl bg-blue-600 px-7 py-3 font-semibold hover:bg-blue-700"
              >
                Student Login
              </a>

              <a
                href="/examiner/login"
                className="rounded-xl border border-slate-600 px-7 py-3 font-semibold hover:border-blue-400"
              >
                Examiner Login
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md">
            <div className="mb-5 flex items-center justify-between">
              <p className="font-semibold text-slate-200">Live AI Monitoring</p>
              <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-400">
                Active
              </span>
            </div>

            <div className="grid gap-4">
              <Status icon={<FaVideo />} label="Camera" value="Verified" />
              <Status icon={<FaMicrophone />} label="Microphone" value="Enabled" />
              <Status icon={<FaEye />} label="Face Tracking" value="Stable" />
              <Status icon={<FaFlag />} label="Flagged Questions" value="Supported" />
            </div>

            <div className="mt-6 rounded-2xl bg-slate-950/70 p-5">
              <p className="mb-3 text-sm text-slate-400">Suspicion Score</p>
              <div className="h-3 rounded-full bg-slate-800">
                <div className="h-3 w-[18%] rounded-full bg-green-500" />
              </div>
              <p className="mt-3 text-sm text-green-400">Low Risk • Normal Activity</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="px-8 py-20">
        <h3 className="mb-4 text-center text-4xl font-bold">Core Features</h3>
        <p className="mx-auto mb-12 max-w-2xl text-center text-slate-400">
          Built for students, examiners, and institutions that need secure and intelligent online exams.
        </p>

        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-4">
          <Feature icon={<FaShieldAlt />} title="Secure Access" text="JWT login with role-based access." />
          <Feature icon={<FaVideo />} title="Camera Check" text="Exam starts only after camera permission." />
          <Feature icon={<FaMicrophone />} title="Mic Check" text="Microphone access is verified before exam." />
          <Feature icon={<FaEye />} title="AI Proctoring" text="Face, gaze, and activity monitoring." />
          <Feature icon={<FaFlag />} title="Flag Questions" text="Students can mark questions for review." />
          <Feature icon={<FaBrain />} title="AI Evaluation" text="AI-assisted scoring for subjective answers." />
          <Feature icon={<FaLock />} title="Secure Exam UI" text="Right-click, copy, and tab switching checks." />
          <Feature icon={<FaChartLine />} title="Analytics" text="Results, feedback, and performance insights." />
        </div>
      </section>

      <section id="workflow" className="px-8 py-20">
        <h3 className="mb-12 text-center text-4xl font-bold">How SpecOps Exam Works</h3>

        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-6">
          {["Login", "Verify Camera", "Verify Mic", "Start Exam", "AI Monitoring", "Results"].map((item, index) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 font-bold">
                {index + 1}
              </div>
              <p className="text-sm font-semibold">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="security" className="px-8 py-20">
        <div className="mx-auto max-w-6xl rounded-3xl border border-blue-500/30 bg-blue-950/20 p-10 text-center">
          <h3 className="text-4xl font-bold">Designed for Secure Digital Exams</h3>
          <p className="mx-auto mt-5 max-w-3xl text-slate-300">
            The exam interface will require camera and microphone access before starting.
            During the exam, students can flag questions, navigate through a question palette,
            and submit answers securely while AI monitoring runs in the background.
          </p>
        </div>
      </section>

      <footer className="border-t border-white/10 px-8 py-8 text-center text-sm text-slate-500">
        © 2026 SpecOps Exam. AI-Powered Secure Online Examination Platform.
      </footer>
    </main>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-blue-500/60">
      <div className="mb-4 text-3xl text-blue-400">{icon}</div>
      <h4 className="mb-2 text-lg font-bold">{title}</h4>
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  );
}

function Status({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <div className="flex items-center gap-3">
        <div className="text-blue-400">{icon}</div>
        <p className="text-slate-300">{label}</p>
      </div>
      <p className="text-sm text-green-400">{value}</p>
    </div>
  );
}
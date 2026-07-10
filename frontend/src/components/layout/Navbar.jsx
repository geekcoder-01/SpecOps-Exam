import { FaShieldAlt } from "react-icons/fa";

export default function Navbar() {
  return (
    <nav className="fixed left-0 top-0 z-50 flex w-full items-center justify-between border-b border-white/10 bg-[#020617]/80 px-8 py-5 backdrop-blur-md">
      <a href="/" className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
          <FaShieldAlt />
        </div>
        <span className="text-2xl font-bold text-blue-400">SpecOps Exam</span>
      </a>

      <div className="hidden gap-6 text-sm md:flex">
        <a href="/#features" className="hover:text-blue-400">Features</a>
        <a href="/#workflow" className="hover:text-blue-400">Workflow</a>
        <a href="/#technology" className="hover:text-blue-400">Technology</a>
        <a href="/student/login" className="hover:text-blue-400">Student Login</a>
        <a href="/examiner/login" className="hover:text-blue-400">Examiner Login</a>
      </div>
    </nav>
  );
}
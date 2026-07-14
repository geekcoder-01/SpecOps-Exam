import {
  FaBrain,
  FaCheckCircle,
  FaFileImport,
  FaLayerGroup,
  FaQuestionCircle,
} from "react-icons/fa";

const tabs = [
  {
    id: "overview",
    text: "Overview",
    icon: <FaLayerGroup />,
  },
  {
    id: "questions",
    text: "Questions",
    icon: <FaQuestionCircle />,
  },
  {
    id: "import",
    text: "Import Questions",
    icon: <FaFileImport />,
  },
  {
    id: "generator",
    text: "AI Generator",
    icon: <FaBrain />,
  },
  {
    id: "review",
    text: "Review Queue",
    icon: <FaCheckCircle />,
  },
];

export default function WorkspaceTabs({
  activeTab,
  onChange,
}) {
  return (
    <div className="mt-7 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/5 p-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
            activeTab === tab.id
              ? "bg-purple-600 text-white"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          {tab.icon}
          {tab.text}
        </button>
      ))}
    </div>
  );
}
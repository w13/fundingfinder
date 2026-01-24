import Link from "next/link";

const TABS = [
  { id: "overview", label: "Analytics" },
  { id: "sources", label: "Sources" },
  { id: "exclusions", label: "Filters" },
  { id: "settings", label: "Settings" }
];

export default function TabNav({ activeTab }: { activeTab: string }) {
  return (
    <div className="tabs">
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          className={`tab ${activeTab === tab.id ? "tab--active" : ""}`}
          href={`/admin?tab=${tab.id}`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

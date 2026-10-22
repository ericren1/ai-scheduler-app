import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";

const navigation = [
  { name: "Planner", path: "/" },
  { name: "Tasks", path: "/tasks" },
  { name: "Goals", path: "/goals" },
  { name: "Settings", path: "/settings" },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="app-layout">
      <aside className={`sidebar ${sidebarOpen ? "" : "collapsed"}`}>
        <h2>{sidebarOpen ? "AI Scheduler" : "AI"}</h2>

        <nav>
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
              title={item.name}
            >
              {sidebarOpen ? item.name : item.name.charAt(0)}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main-area">
        <header className="app-header">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <span>AI Scheduler</span>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import Icon from '../ui/Icon.tsx';

const navigation = [
  { name: "Planner", path: "/", icon: 'calendar' },
  { name: "Tasks", path: "/tasks", icon: 'tasks' },
  { name: "Goals", path: "/goals", icon: 'goals' },
  { name: "Settings", path: "/settings", icon: 'settings' },
] as const;

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(() => !window.matchMedia('(max-width: 760px)').matches);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 760px)');
    const collapseOnNarrowScreen = (event: MediaQueryListEvent) => { if (event.matches) setSidebarOpen(false); };
    query.addEventListener('change', collapseOnNarrowScreen);
    return () => query.removeEventListener('change', collapseOnNarrowScreen);
  }, []);

  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">Skip to content</a>
      {sidebarOpen && <button className="navigation-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <aside id="app-navigation" className={`sidebar ${sidebarOpen ? "" : "collapsed"}`} aria-label="Workspace navigation" onKeyDown={event => { if (event.key === 'Escape') setSidebarOpen(false); }}>
        <div className="workspace-brand"><span className="workspace-monogram" aria-hidden="true">P</span>{sidebarOpen && <div><h2>Personal Hub</h2><span>Personal workspace</span></div>}</div>
        <button className="sidebar-toggle" type="button" onClick={() => setSidebarOpen(open => !open)}
          aria-label={sidebarOpen ? 'Collapse navigation' : 'Expand navigation'} aria-expanded={sidebarOpen} aria-controls="workspace-links" title={sidebarOpen ? 'Collapse navigation' : 'Expand navigation'}><Icon name="panel" /></button>
        {sidebarOpen && <p className="navigation-label">Workspace</p>}

        <nav id="workspace-links">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => { if (window.matchMedia('(max-width: 760px)').matches) setSidebarOpen(false); }}
              end={item.path === "/"}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
              title={item.name}
              aria-label={item.name}
            >
              <Icon name={item.icon} />{sidebarOpen && <span>{item.name}</span>}
            </NavLink>
          ))}
        </nav>
        {sidebarOpen && <div className="sidebar-footer"><span className="workspace-avatar" aria-hidden="true">P</span><div>Personal workspace<small>Stored on this device</small></div></div>}
      </aside>

      <div className="main-area">
        <main id="main-content" className="page-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

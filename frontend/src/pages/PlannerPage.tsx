import { lazy, Suspense, useState } from 'react';
import { mockCategories, mockEvents, mockSessions, mockTasks } from '../mocks/calendar.ts';
import { startOfWeek, toLocalDate } from '../utils/calendarDate.ts';
import { unscheduledTasks } from '../utils/calendarView.ts';
import type { CalendarRecords } from '../utils/calendarView.ts';
import PlannerToolbar from '../components/calendar/PlannerToolbar.tsx';
import UnscheduledTasksPanel from '../components/calendar/UnscheduledTasksPanel.tsx';
import WeekCalendar from '../components/calendar/WeekCalendar.tsx';
import ThemePalette from '../components/calendar/ThemePalette.tsx';
import '../components/calendar/calendar.css';

// Canonical mock collections are passed down; only view preferences live in state.
const syntheticRecords: CalendarRecords = { tasks: mockTasks, sessions: mockSessions, events: mockEvents, categories: mockCategories };
// Vite removes this import and the realistic fixtures entirely in production builds.
const DevelopmentSamples = import.meta.env.DEV ? lazy(() => import('../components/calendar/DevelopmentSamples.tsx')) : null;

export default function PlannerPage() {
  const [records, setRecords] = useState(syntheticRecords);
  const [sampleLabel, setSampleLabel] = useState('Synthetic sample');
  const [week, setWeek] = useState(() => startOfWeek(toLocalDate(new Date())));
  const [panelOpen, setPanelOpen] = useState(false);
  const [hours, setHours] = useState({ start: 6, end: 23 });
  return <div className="planner">
    <PlannerToolbar week={week} onWeekChange={setWeek} panelOpen={panelOpen} onTogglePanel={() => setPanelOpen(open => !open)}
      startHour={hours.start} endHour={hours.end} onHoursChange={(start, end) => setHours({ start, end })}
      developmentMenu={DevelopmentSamples && <Suspense fallback={null}><DevelopmentSamples synthetic={syntheticRecords} onSelect={(next, date, label) => {
      setRecords(next); setWeek(date); setSampleLabel(label);
    }} /></Suspense>} />
    <span className="sr-only" role="status">{sampleLabel}. Calendar is read only. Times in {Intl.DateTimeFormat().resolvedOptions().timeZone}.</span>
    <div className="planner-workspace">
      {panelOpen && <UnscheduledTasksPanel tasks={unscheduledTasks(records, week)} />}
      <WeekCalendar week={week} records={records} startHour={hours.start} endHour={hours.end} />
    </div>
    <ThemePalette />
  </div>;
}

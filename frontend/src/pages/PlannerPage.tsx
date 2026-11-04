import { useState } from 'react';
import { mockCategories, mockEvents, mockSessions, mockTasks } from '../mocks/calendar.ts';
import { startOfWeek, toLocalDate } from '../utils/calendarDate.ts';
import { unscheduledTasks } from '../utils/calendarView.ts';
import type { CalendarRecords } from '../utils/calendarView.ts';
import PlannerToolbar from '../components/calendar/PlannerToolbar.tsx';
import UnscheduledTasksPanel from '../components/calendar/UnscheduledTasksPanel.tsx';
import WeekCalendar from '../components/calendar/WeekCalendar.tsx';
import '../components/calendar/calendar.css';

// Canonical mock collections are passed down; only view preferences live in state.
const records: CalendarRecords = { tasks: mockTasks, sessions: mockSessions, events: mockEvents, categories: mockCategories };

export default function PlannerPage() {
  const [week, setWeek] = useState(() => startOfWeek(toLocalDate(new Date())));
  const [panelOpen, setPanelOpen] = useState(false);
  const [hours, setHours] = useState({ start: 6, end: 23 });
  return <div className="planner">
    <PlannerToolbar week={week} onWeekChange={setWeek} panelOpen={panelOpen} onTogglePanel={() => setPanelOpen(open => !open)}
      startHour={hours.start} endHour={hours.end} onHoursChange={(start, end) => setHours({ start, end })} />
    <p className="calendar-muted">Read-only preview · Times in {Intl.DateTimeFormat().resolvedOptions().timeZone}. Each day has its own time labels.</p>
    <div className="planner-workspace">
      {panelOpen && <UnscheduledTasksPanel tasks={unscheduledTasks(records, week)} />}
      <WeekCalendar week={week} records={records} startHour={hours.start} endHour={hours.end} />
    </div>
  </div>;
}

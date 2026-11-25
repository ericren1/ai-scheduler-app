import { lazy, Suspense, useState } from 'react';
import { getWeekDates, startOfWeek, toLocalDate } from '../utils/calendarDate.ts';
import { Link } from 'react-router-dom';
import { useCalendar } from '../state/CalendarContext.ts';
import SessionDialog from '../components/scheduler/SessionDialog.tsx';
import { unscheduledTasks } from '../utils/calendarView.ts';
import type { CalendarRecords } from '../utils/calendarView.ts';
import PlannerToolbar from '../components/calendar/PlannerToolbar.tsx';
import UnscheduledTasksPanel from '../components/calendar/UnscheduledTasksPanel.tsx';
import WeekCalendar from '../components/calendar/WeekCalendar.tsx';
import ThemePalette from '../components/calendar/ThemePalette.tsx';
import Icon from '../components/ui/Icon.tsx';
import '../components/calendar/calendar.css';
import { useSchedulingPreferences } from '../state/SchedulingPreferencesContext.ts';

// Canonical mock collections are passed down; only view preferences live in state.
// Vite removes this import and the realistic fixtures entirely in production builds.
const DevelopmentSamples = import.meta.env.DEV ? lazy(() => import('../components/calendar/DevelopmentSamples.tsx')) : null;

export default function PlannerPage() {
  const { records: personalRecords, warning } = useCalendar();
  const { preferences } = useSchedulingPreferences();
  const [preview, setPreview] = useState<CalendarRecords | null>(null);
  const records = preview ?? personalRecords;
  const [creationDate, setCreationDate] = useState<string | null>(null);
  const [sampleLabel, setSampleLabel] = useState('My calendar');
  const [week, setWeek] = useState(() => startOfWeek(toLocalDate(new Date())));
  const [panelOpen, setPanelOpen] = useState(false);
  const [hours, setHours] = useState({ start: 6, end: 23 });
  const [showGuidance, setShowGuidance] = useState(true);
  return <div className="planner">
    <PlannerToolbar week={week} onWeekChange={setWeek} panelOpen={panelOpen} onTogglePanel={() => setPanelOpen(open => !open)}
      startHour={hours.start} endHour={hours.end} onHoursChange={(start, end) => setHours({ start, end })}
      showGuidance={showGuidance} onToggleGuidance={() => setShowGuidance(value => !value)}
      creationControls={preview ? <button onClick={() => { setPreview(null); setSampleLabel('My calendar'); }}>My calendar</button> : <button className="primary-button" onClick={() => {
        const today = toLocalDate(new Date()); setCreationDate(getWeekDates(week).includes(today) ? today : week);
      }}><Icon name="plus" /> New session</button>}
      developmentMenu={DevelopmentSamples && <Suspense fallback={null}><DevelopmentSamples onSelect={(next, date, label) => {
      setPreview(next); setWeek(date); setSampleLabel(label);
    }} /></Suspense>} />
    <span className="sr-only" role="status">{sampleLabel}. Times in {Intl.DateTimeFormat().resolvedOptions().timeZone}.</span>
    {warning && !preview && <p className="storage-warning" role="status">{warning}</p>}
    {!preview && !personalRecords.tasks.length && <p className="planner-empty-hint"><Link to="/tasks">Add your first task</Link>, then choose New session to place it in your calendar. Saved on this browser only.</p>}
    <div className="planner-workspace">
      {panelOpen && <UnscheduledTasksPanel tasks={unscheduledTasks(records, week)} onClose={() => setPanelOpen(false)} />}
      <WeekCalendar week={week} records={records} startHour={hours.start} endHour={hours.end} onSessionEdited={date => setWeek(startOfWeek(date))} schedulePreferences={!preview && showGuidance ? preferences : undefined} />
    </div>
    <ThemePalette />
    {creationDate && <SessionDialog initialDate={creationDate} onClose={() => setCreationDate(null)} onSaved={date => setWeek(startOfWeek(date))} />}
  </div>;
}

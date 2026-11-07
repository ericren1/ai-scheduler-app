import { useState } from 'react';
import { realisticCalendar, realisticSampleWeek } from '../../mocks/realisticCalendar.ts';
import type { CalendarRecords } from '../../utils/calendarView.ts';
import ToolbarMenu from './ToolbarMenu.tsx';

export default function DevelopmentSamples({ synthetic, onSelect }: {
  synthetic: CalendarRecords; onSelect: (records: CalendarRecords, week: string, label: string) => void;
}) {
  const [selected, setSelected] = useState('synthetic');
  function openSample(value: string) {
    setSelected(value);
    onSelect(value === 'realistic' ? realisticCalendar : synthetic,
      value === 'realistic' ? realisticSampleWeek : '2026-10-19',
      value === 'realistic' ? 'Realistic sample' : 'Synthetic sample');
  }
  return <ToolbarMenu className="development-samples" label="Dev">
    <p className="menu-heading">Development samples</p>
    <label htmlFor="sample-dataset">Development sample</label>
    <select id="sample-dataset" value={selected} onChange={event => openSample(event.target.value)}>
      <option value="synthetic">Synthetic · Oct 19–25</option><option value="realistic">Realistic · Nov 2–8</option>
    </select>
    <button className="quiet-button" onClick={() => openSample(selected)}>Open sample week</button>
    <p className="menu-caption">{selected === 'realistic' ? 'Day assignments and outcomes are illustrative. Only the meeting has a supplied time.' : 'Synthetic fixtures for inspecting cards, all-day events, and overlaps.'}</p>
  </ToolbarMenu>;
}

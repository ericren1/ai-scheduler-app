const paths = {
  calendar: 'M5 3v4m14-4v4M3 10h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z',
  tasks: 'm4 6 1.5 1.5L8 5m3 1h9M4 12h3m4 0h9M4 18h3m4 0h9',
  goals: 'M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9Zm-5 0a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  settings: 'M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  panel: 'M9 3v18M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z',
  left: 'm14 6-6 6 6 6',
  right: 'm10 6 6 6-6 6',
};

export default function Icon({ name }: { name: keyof typeof paths }) {
  return <svg className="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

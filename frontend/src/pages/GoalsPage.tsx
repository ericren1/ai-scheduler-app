import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon.tsx';

export default function GoalsPage() {
  return (
    <div className="goals-page">
      <h1>Goals</h1>
      <p>Make room for the things you want to keep doing.</p>
      <div className="empty-state"><Icon name="goals" /><h2>Your bigger picture, coming later</h2><p>Goal tracking isn’t available yet. For now, create tasks and schedule time for them in Planner.</p><Link className="text-action" to="/tasks">Go to Tasks <Icon name="right" /></Link></div>
    </div>
  );
}

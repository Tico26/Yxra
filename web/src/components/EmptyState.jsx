import { Link } from 'react-router-dom';

const EmptyState = ({ message, to, action }) => (
  <div className="bg-mist px-6 py-16 text-center">
    <p className="font-display text-h2">{message}</p>
    {to && (
      <Link to={to} className="btn btn-primary mt-6">
        {action}
      </Link>
    )}
  </div>
);

export default EmptyState;

export default function PriorityBadge({ priority }) {
  const styles = {
    low: 'bg-blue-100 text-blue-800 border-blue-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200',
  };

  const labels = {
    low: 'Faible',
    medium: 'Moyen',
    high: 'Élevé',
    critical: 'Critique',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[priority] || styles.low}`}>
      {labels[priority] || priority}
    </span>
  );
}
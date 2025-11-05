export default function SeverityBadge({ severity }) {
  const styles = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };

  const labels = {
    low: 'Faible',
    medium: 'Moyen',
    high: 'Élevé',
    critical: 'Critique',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${styles[severity] || styles.low}`}>
      {labels[severity] || severity}
    </span>
  );
}
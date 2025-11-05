export default function StatusBadge({ status }) {
  const styles = {
    active: 'bg-green-100 text-green-800 border-green-200',
    failure: 'bg-red-100 text-red-800 border-red-200',
    backup: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    inactive: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const labels = {
    active: 'Actif',
    failure: 'En Panne',
    backup: 'En Secours',
    inactive: 'Inactif',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.inactive}`}>
      {labels[status] || status}
    </span>
  );
}
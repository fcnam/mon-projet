import { useState, useEffect } from 'react';
import { incidentsAPI } from '../services/api';
import Card from '../components/Common/Card';
import SeverityBadge from '../components/Common/SeverityBadge';
import { Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function Equipments() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadIncidents();
  }, [filter]);

  const loadIncidents = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await incidentsAPI.getAll(params);
      setIncidents(response.data);
    } catch (error) {
      console.error('Error loading incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await incidentsAPI.update(id, { status: newStatus });
      loadIncidents();
    } catch (error) {
      alert('Erreur lors de la mise à jour');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-red-100 text-red-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || colors.open;
  };

  const getStatusLabel = (status) => {
    const labels = {
      open: 'Ouvert',
      in_progress: 'En cours',
      resolved: 'Résolu',
      closed: 'Fermé',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Gestion des Incidents</h1>
        <p className="text-gray-600 mt-1">Suivi et résolution des problèmes d'équipements</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 bg-white p-2 rounded-lg shadow-md">
        {['all', 'open', 'in_progress', 'resolved', 'closed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === status
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {status === 'all' ? 'Tous' : getStatusLabel(status)}
          </button>
        ))}
      </div>

      {/* Incidents List */}
      <div className="space-y-4">
        {incidents.length === 0 ? (
          <Card>
            <div className="text-center py-12 text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Aucun incident trouvé</p>
            </div>
          </Card>
        ) : (
          incidents.map((incident) => (
            <Card key={incident.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{incident.title}</h3>
                    <SeverityBadge severity={incident.severity} />
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                      {getStatusLabel(incident.status)}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{incident.description}</p>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <span>📡 {incident.system_name || 'N/A'}</span>
                    <span>👤 {incident.reported_by_username}</span>
                    <span>🕐 {new Date(incident.created_at).toLocaleString('fr-FR')}</span>
                  </div>
                </div>
                
                <div className="ml-4 space-y-2">
                  {incident.status === 'open' && (
                    <button
                      onClick={() => handleUpdateStatus(incident.id, 'in_progress')}
                      className="btn bg-yellow-600 text-white hover:bg-yellow-700 text-sm"
                    >
                      Prendre en charge
                    </button>
                  )}
                  {incident.status === 'in_progress' && (
                    <button
                      onClick={() => handleUpdateStatus(incident.id, 'resolved')}
                      className="btn bg-green-600 text-white hover:bg-green-700 text-sm"
                    >
                      Résoudre
                    </button>
                  )}
                  {incident.status === 'resolved' && (
                    <button
                      onClick={() => handleUpdateStatus(incident.id, 'closed')}
                      className="btn btn-secondary text-sm"
                    >
                      Fermer
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

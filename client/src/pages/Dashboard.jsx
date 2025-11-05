import { useState, useEffect } from 'react';
import { systemsAPI, incidentsAPI } from '../services/api';
import StatusBadge from '../components/Common/StatusBadge';
import Card from '../components/Common/Card';
import SeverityBadge from '../components/Common/SeverityBadge';
import { Radio, AlertTriangle, Activity, Clock } from 'lucide-react';

export default function Dashboard() {
  const [systems, setSystems] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [systemsRes, incidentsRes] = await Promise.all([
        systemsAPI.getAll(),
        incidentsAPI.getAll({ status: 'open', limit: 5 })
      ]);
      
      setSystems(systemsRes.data);
      setIncidents(incidentsRes.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSystemIcon = (type) => {
    return <Radio className="w-8 h-8" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'text-green-600',
      failure: 'text-red-600',
      backup: 'text-yellow-600',
      inactive: 'text-gray-600',
    };
    return colors[status] || colors.inactive;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const activeCount = systems.filter(s => s.status === 'active').length;
  const failureCount = systems.filter(s => s.status === 'failure').length;
  const backupCount = systems.filter(s => s.status === 'backup').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Tableau de bord</h1>
        <p className="text-gray-600 mt-1">Vue d'ensemble des systèmes de communication</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Systèmes Actifs</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{activeCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Panne</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{failureCount}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Secours</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{backupCount}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Radio className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Incidents Ouverts</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{incidents.length}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Systems Status */}
        <Card title="État des Systèmes">
          <div className="space-y-4">
            {systems.map((system) => (
              <div key={system.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center ${getStatusColor(system.status)}`}>
                    {getSystemIcon(system.type)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{system.name}</h4>
                    <p className="text-sm text-gray-600">{system.type}</p>
                    <p className="text-xs text-gray-500 mt-1">{system.frequency}</p>
                  </div>
                </div>
                <StatusBadge status={system.status} />
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Incidents */}
        <Card title="Incidents Récents">
          {incidents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Aucun incident ouvert</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incidents.map((incident) => (
                <div key={incident.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-orange-500">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-800">{incident.title}</h4>
                    <SeverityBadge severity={incident.severity} />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{incident.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{incident.system_name || 'N/A'}</span>
                    <span>{new Date(incident.created_at).toLocaleString('fr-FR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card title="Actions Rapides">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-primary-50 hover:bg-primary-100 rounded-lg text-left transition-colors border border-primary-200">
            <Radio className="w-8 h-8 text-primary-600 mb-2" />
            <h4 className="font-semibold text-gray-800 mb-1">Basculement Système</h4>
            <p className="text-sm text-gray-600">Effectuer un basculement d'urgence</p>
          </button>
          
          <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors border border-green-200">
            <Activity className="w-8 h-8 text-green-600 mb-2" />
            <h4 className="font-semibold text-gray-800 mb-1">Test Système</h4>
            <p className="text-sm text-gray-600">Lancer un test de communication</p>
          </button>
          
          <button className="p-4 bg-red-50 hover:bg-red-100 rounded-lg text-left transition-colors border border-red-200">
            <AlertTriangle className="w-8 h-8 text-red-600 mb-2" />
            <h4 className="font-semibold text-gray-800 mb-1">Déclarer Incident</h4>
            <p className="text-sm text-gray-600">Signaler un nouveau problème</p>
          </button>
        </div>
      </Card>
    </div>
  );
}
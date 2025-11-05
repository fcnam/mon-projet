import { useState, useEffect } from 'react';
import { systemsAPI, scenariosAPI } from '../services/api';
import StatusBadge from '../components/Common/StatusBadge';
import Card from '../components/Common/Card';
import { Radio, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

export default function Systems() {
  const [systems, setSystems] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [systemsRes, scenariosRes] = await Promise.all([
        systemsAPI.getAll(),
        scenariosAPI.getAll()
      ]);
      
      setSystems(systemsRes.data);
      setScenarios(scenariosRes.data);
    } catch (error) {
      console.error('Error loading systems:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (systemId, newStatus) => {
    try {
      await systemsAPI.update(systemId, { status: newStatus });
      loadData();
    } catch (error) {
      alert('Erreur lors de la mise à jour du système');
    }
  };

  const handleExecuteScenario = async (scenarioId) => {
    if (!confirm('Êtes-vous sûr de vouloir exécuter ce scénario ?')) return;
    
    try {
      await scenariosAPI.execute(scenarioId, 'Exécution depuis la page Systèmes');
      alert('Scénario exécuté avec succès');
      loadData();
    } catch (error) {
      alert('Erreur lors de l\'exécution du scénario');
    }
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
        <h1 className="text-3xl font-bold text-gray-800">Gestion des Systèmes</h1>
        <p className="text-gray-600 mt-1">Supervision et contrôle des systèmes de communication</p>
      </div>

      {/* Systems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {systems.map((system) => (
          <Card key={system.id}>
            <div className="text-center">
              <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                system.status === 'active' ? 'bg-green-100 text-green-600' :
                system.status === 'failure' ? 'bg-red-100 text-red-600' :
                system.status === 'backup' ? 'bg-yellow-100 text-yellow-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                <Radio className="w-10 h-10" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">{system.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{system.type}</p>
              
              <div className="flex justify-center mb-4">
                <StatusBadge status={system.status} />
              </div>
              
              <div className="space-y-2 text-sm text-left bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Localisation:</span>
                  <span className="font-medium">{system.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fréquence:</span>
                  <span className="font-medium text-xs">{system.frequency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dernière vérif:</span>
                  <span className="font-medium text-xs">
                    {new Date(system.last_check).toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {system.status === 'active' && (
                  <button
                    onClick={() => handleUpdateStatus(system.id, 'backup')}
                    className="w-full btn bg-yellow-600 text-white hover:bg-yellow-700"
                  >
                    Basculer en Secours
                  </button>
                )}
                {system.status === 'inactive' && (
                  <button
                    onClick={() => handleUpdateStatus(system.id, 'active')}
                    className="w-full btn btn-primary"
                  >
                    Activer
                  </button>
                )}
                {system.status === 'failure' && (
                  <button
                    onClick={() => handleUpdateStatus(system.id, 'active')}
                    className="w-full btn bg-green-600 text-white hover:bg-green-700"
                  >
                    Rétablir
                  </button>
                )}
                <button className="w-full btn btn-secondary text-sm">
                  <RefreshCw className="w-4 h-4 inline mr-1" />
                  Tester
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Scenarios */}
      <Card title="Scénarios de Basculement">
        <div className="space-y-4">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">{scenario.name}</h4>
                  <p className="text-sm text-gray-600">{scenario.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    {scenario.source_system_name && (
                      <span>De: <span className="font-medium">{scenario.source_system_name}</span></span>
                    )}
                    {scenario.target_system_name && (
                      <span>→ Vers: <span className="font-medium">{scenario.target_system_name}</span></span>
                    )}
                    <span>⏱ {scenario.estimated_time} min</span>
                  </div>
                </div>
                <button
                  onClick={() => handleExecuteScenario(scenario.id)}
                  className="btn btn-primary text-sm"
                >
                  Exécuter
                </button>
              </div>
              
              {scenario.steps && scenario.steps.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-700 mb-2">Étapes:</p>
                  <ol className="text-xs text-gray-600 space-y-1 pl-4">
                    {scenario.steps.map((step, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2">{idx + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* System Health */}
      <Card title="État de Santé">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {systems.map((system) => (
            <div key={system.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-800">{system.name}</h4>
                {system.status === 'active' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Disponibilité:</span>
                  <span className="font-medium text-green-600">99.9%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Uptime:</span>
                  <span className="font-medium">45j 12h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Dernier test:</span>
                  <span className="font-medium">OK</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
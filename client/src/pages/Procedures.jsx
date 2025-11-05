import { useState, useEffect } from 'react';
import { scenariosAPI } from '../services/api';
import Card from '../components/Common/Card';
import PriorityBadge from '../components/Common/PriorityBadge';
import { FileText, Play, Clock, ArrowRight } from 'lucide-react';

export default function Procedures() {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState(null);

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    try {
      const response = await scenariosAPI.getAll();
      setScenarios(response.data);
    } catch (error) {
      console.error('Error loading scenarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async (scenarioId) => {
    if (!confirm('Confirmer l\'exécution de ce scénario ?')) return;
    
    try {
      const notes = prompt('Notes (optionnel):');
      await scenariosAPI.execute(scenarioId, notes);
      alert('Scénario exécuté avec succès');
    } catch (error) {
      alert('Erreur lors de l\'exécution');
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
        <h1 className="text-3xl font-bold text-gray-800">Procédures & Scénarios</h1>
        <p className="text-gray-600 mt-1">Scénarios de basculement et procédures d'urgence</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenarios List */}
        <div className="lg:col-span-2 space-y-4">
          {scenarios.map((scenario) => (
            <Card key={scenario.id}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-800">{scenario.name}</h3>
                    <PriorityBadge priority={scenario.priority} />
                  </div>
                  <p className="text-gray-600 mb-3">{scenario.description}</p>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    {scenario.source_system_name && (
                      <span className="flex items-center">
                        <span className="font-medium">{scenario.source_system_name}</span>
                        {scenario.target_system_name && (
                          <>
                            <ArrowRight className="w-4 h-4 mx-2" />
                            <span className="font-medium">{scenario.target_system_name}</span>
                          </>
                        )}
                      </span>
                    )}
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {scenario.estimated_time} min
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedScenario(scenario)}
                  className="btn btn-primary"
                >
                  Voir détails
                </button>
              </div>
              
              {scenario.steps && scenario.steps.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Étapes:</p>
                  <ol className="space-y-2">
                    {scenario.steps.slice(0, 3).map((step, idx) => (
                      <li key={idx} className="flex items-start text-sm text-gray-600">
                        <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-xs font-medium">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                    {scenario.steps.length > 3 && (
                      <li className="text-sm text-gray-500 ml-9">
                        ... et {scenario.steps.length - 3} autre(s) étape(s)
                      </li>
                    )}
                  </ol>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Scenario Details Sidebar */}
        <div>
          {selectedScenario ? (
            <Card title="Détails du Scénario">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">{selectedScenario.name}</h4>
                  <PriorityBadge priority={selectedScenario.priority} />
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">{selectedScenario.description}</p>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Source:</span>
                    <span className="font-medium">{selectedScenario.source_system_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cible:</span>
                    <span className="font-medium">{selectedScenario.target_system_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Durée estimée:</span>
                    <span className="font-medium">{selectedScenario.estimated_time} min</span>
                  </div>
                </div>
                
                {selectedScenario.steps && selectedScenario.steps.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Toutes les étapes:</h5>
                    <ol className="space-y-3">
                      {selectedScenario.steps.map((step, idx) => (
                        <li key={idx} className="flex items-start text-sm">
                          <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-xs font-medium">
                            {idx + 1}
                          </span>
                          <span className="text-gray-700 leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                
                <button
                  onClick={() => handleExecute(selectedScenario.id)}
                  className="w-full btn btn-primary flex items-center justify-center"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Exécuter le scénario
                </button>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Sélectionnez un scénario pour voir les détails</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
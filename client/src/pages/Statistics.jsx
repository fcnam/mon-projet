import { useState, useEffect } from 'react';
import { incidentsAPI, logsAPI } from '../services/api';
import Card from '../components/Common/Card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, AlertTriangle, Clock } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Statistics() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  const loadStats = async () => {
    try {
      const [statsRes, logsRes] = await Promise.all([
        incidentsAPI.getStats(),
        logsAPI.getAll({ limit: 100 })
      ]);
      
      setStats(statsRes.data);
      setLogs(logsRes.data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Prepare data for charts
  const severityData = stats?.by_severity?.map(item => ({
    name: item.severity === 'low' ? 'Faible' : 
          item.severity === 'medium' ? 'Moyen' : 
          item.severity === 'high' ? 'Élevé' : 'Critique',
    value: item.count
  })) || [];

  const statusData = stats?.by_status?.map(item => ({
    name: item.status === 'open' ? 'Ouvert' : 
          item.status === 'in_progress' ? 'En cours' : 
          item.status === 'resolved' ? 'Résolu' : 'Fermé',
    value: item.count
  })) || [];

  const systemData = stats?.by_system?.map(item => ({
    name: item.name,
    incidents: item.count
  })) || [];

  const trendData = stats?.recent_trend?.slice().reverse().map(item => ({
    date: new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    incidents: item.count
  })) || [];

  // Calculate totals
  const totalIncidents = severityData.reduce((sum, item) => sum + item.value, 0);
  const criticalCount = stats?.by_severity?.find(s => s.severity === 'critical')?.count || 0;
  const openCount = stats?.by_status?.find(s => s.status === 'open')?.count || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Statistiques</h1>
          <p className="text-gray-600 mt-1">Analyse des incidents et activités système</p>
        </div>
        
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="7">7 derniers jours</option>
          <option value="30">30 derniers jours</option>
          <option value="90">90 derniers jours</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-sm opacity-90">Total Incidents</p>
          <p className="text-3xl font-bold mt-1">{totalIncidents}</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-8 h-8 opacity-80" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded">Critique</span>
          </div>
          <p className="text-sm opacity-90">Incidents Critiques</p>
          <p className="text-3xl font-bold mt-1">{criticalCount}</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 opacity-80" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded">Ouvert</span>
          </div>
          <p className="text-sm opacity-90">Incidents Ouverts</p>
          <p className="text-3xl font-bold mt-1">{openCount}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-sm opacity-90">Taux de Résolution</p>
          <p className="text-3xl font-bold mt-1">
            {totalIncidents > 0 
              ? Math.round(((stats?.by_status?.find(s => s.status === 'resolved')?.count || 0) / totalIncidents) * 100)
              : 0}%
          </p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Incidents par Sévérité">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Incidents par Statut">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Tendance des Incidents">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="incidents" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Incidents par Système">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={systemData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" />
              <Tooltip />
              <Bar dataKey="incidents" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Activity Log */}
      <Card title="Activité Récente">
        <div className="space-y-3">
          {logs.slice(0, 10).map((log) => (
            <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">{log.action.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(log.created_at).toLocaleString('fr-FR')}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Par {log.full_name} - {log.entity_type}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
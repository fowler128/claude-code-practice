import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../services/api';

export default function Dashboard() {
  // Fetch dashboard data
  const { data: matters, isLoading } = useQuery({
    queryKey: ['matters'],
    queryFn: () => api.getMatters({ limit: 100 })
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  // Calculate summary statistics
  const allMatters = matters?.matters || [];
  const totalMatters = allMatters.filter(m => !m.is_archived).length;
  const highRiskMatters = allMatters.filter(m => m.health_risk_tier === 'high').length;
  const mediumRiskMatters = allMatters.filter(m => m.health_risk_tier === 'medium').length;
  const slaBreachMatters = allMatters.filter(m => m.sla_breach_at).length;

  // Get matters by practice area
  const practiceAreaCounts = allMatters.reduce((acc, matter) => {
    const pa = matter.practice_area_name || 'Unknown';
    acc[pa] = (acc[pa] || 0) + 1;
    return acc;
  }, {});

  // Get recent matters (last 10)
  const recentMatters = allMatters.slice(0, 10);

  // Get high-risk matters
  const criticalMatters = allMatters
    .filter(m => m.health_risk_tier === 'high')
    .sort((a, b) => a.health_score - b.health_score)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of all active matters and their health status
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Active Matters"
          value={totalMatters}
          color="blue"
          icon="📋"
        />
        <SummaryCard
          title="High Risk Matters"
          value={highRiskMatters}
          color="red"
          icon="⚠️"
        />
        <SummaryCard
          title="Medium Risk Matters"
          value={mediumRiskMatters}
          color="yellow"
          icon="⚡"
        />
        <SummaryCard
          title="SLA Breaches"
          value={slaBreachMatters}
          color="orange"
          icon="⏰"
        />
      </div>

      {/* Practice area breakdown */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Matters by Practice Area
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(practiceAreaCounts).map(([area, count]) => (
            <div key={area} className="text-center">
              <div className="text-3xl font-bold text-indigo-600">{count}</div>
              <div className="text-sm text-gray-600">{area}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical matters */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Critical Matters (High Risk)
            </h2>
            <span className="text-sm text-gray-500">Top 5</span>
          </div>
          <div className="space-y-3">
            {criticalMatters.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No high-risk matters 🎉
              </p>
            ) : (
              criticalMatters.map(matter => (
                <MatterRow key={matter.id} matter={matter} />
              ))
            )}
          </div>
        </div>

        {/* Recent matters */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Matters
            </h2>
            <Link
              to="/queue"
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentMatters.map(matter => (
              <MatterRow key={matter.id} matter={matter} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, color, icon }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    red: 'bg-red-50 text-red-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    orange: 'bg-orange-50 text-orange-700'
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md p-3 ${colorClasses[color]}`}>
            <span className="text-2xl">{icon}</span>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="text-3xl font-semibold text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function MatterRow({ matter }) {
  const riskColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };

  return (
    <Link
      to={`/matters/${matter.id}`}
      className="block hover:bg-gray-50 rounded-lg p-3 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {matter.matter_number}
            </p>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                riskColors[matter.health_risk_tier] || riskColors.medium
              }`}
            >
              {matter.health_score}
            </span>
          </div>
          <p className="text-sm text-gray-500 truncate">{matter.client_name}</p>
          <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
            <span>{matter.practice_area_name}</span>
            <span>•</span>
            <span>{matter.current_status}</span>
          </div>
        </div>
        {matter.sla_breach_at && (
          <div className="ml-2 flex-shrink-0">
            <span className="text-red-500">⏰</span>
          </div>
        )}
      </div>
    </Link>
  );
}

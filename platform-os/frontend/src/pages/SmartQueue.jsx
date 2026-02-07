import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../services/api';

export default function SmartQueue() {
  const { lane } = useParams();
  const [selectedLane, setSelectedLane] = useState(lane || 'all');
  const [selectedRole, setSelectedRole] = useState('all');

  // Fetch all matters
  const { data: matters, isLoading } = useQuery({
    queryKey: ['matters', selectedLane],
    queryFn: () => {
      const params = {};
      if (selectedLane !== 'all') {
        params.lane = selectedLane;
      }
      return api.getMatters(params);
    }
  });

  const allMatters = matters?.matters || [];

  // Get unique lanes from matters
  const lanes = [...new Set(allMatters.map(m => m.current_lane))].sort();

  // Filter matters by selected filters
  const filteredMatters = allMatters.filter(matter => {
    if (selectedLane !== 'all' && matter.current_lane !== selectedLane) {
      return false;
    }
    if (selectedRole !== 'all' && matter.assigned_role !== selectedRole) {
      return false;
    }
    return true;
  });

  // Sort matters by priority
  const sortedMatters = [...filteredMatters].sort((a, b) => {
    // High risk first
    if (a.health_risk_tier === 'high' && b.health_risk_tier !== 'high') return -1;
    if (b.health_risk_tier === 'high' && a.health_risk_tier !== 'high') return 1;

    // SLA breach next
    if (a.sla_breach_at && !b.sla_breach_at) return -1;
    if (b.sla_breach_at && !a.sla_breach_at) return 1;

    // Then by health score (lower is worse)
    return a.health_score - b.health_score;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading matters...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Smart Queue</h1>
        <p className="mt-1 text-sm text-gray-500">
          Role-based matter queue sorted by priority
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Lane filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lane
            </label>
            <select
              value={selectedLane}
              onChange={(e) => setSelectedLane(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">All Lanes</option>
              {lanes.map(lane => (
                <option key={lane} value={lane}>
                  {lane}
                </option>
              ))}
            </select>
          </div>

          {/* Role filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assigned Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">All Roles</option>
              <option value="paralegal">Paralegal</option>
              <option value="attorney">Attorney</option>
              <option value="ops_lead">Ops Lead</option>
              <option value="intake_specialist">Intake Specialist</option>
            </select>
          </div>

          {/* Summary */}
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold">{sortedMatters.length}</span> of{' '}
              <span className="font-semibold">{allMatters.length}</span> matters
            </div>
          </div>
        </div>
      </div>

      {/* Matters list */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {sortedMatters.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No matters found matching your filters
            </div>
          ) : (
            sortedMatters.map(matter => (
              <MatterQueueItem key={matter.id} matter={matter} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function MatterQueueItem({ matter }) {
  const riskColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };

  const hasAlerts = matter.sla_breach_at || matter.health_risk_tier === 'high';

  return (
    <Link
      to={`/matters/${matter.id}`}
      className="block hover:bg-gray-50 transition-colors"
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          {/* Left section */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Matter number and health score */}
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {matter.matter_number}
              </h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  riskColors[matter.health_risk_tier] || riskColors.medium
                }`}
              >
                Score: {matter.health_score}
              </span>
              {hasAlerts && (
                <span className="inline-flex items-center text-red-500">
                  ⚠️
                </span>
              )}
            </div>

            {/* Client and practice area */}
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="font-medium">{matter.client_name}</span>
              <span>•</span>
              <span>{matter.practice_area_name}</span>
              <span>•</span>
              <span>{matter.matter_type_name}</span>
            </div>

            {/* Status and lane */}
            <div className="flex items-center space-x-4 text-sm">
              <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-800">
                {matter.current_status}
              </span>
              <span className="text-gray-500">Lane: {matter.current_lane}</span>
              {matter.assigned_to && (
                <>
                  <span>•</span>
                  <span className="text-gray-500">Assigned: {matter.assigned_to}</span>
                </>
              )}
            </div>

            {/* Health drivers */}
            {matter.health_drivers && matter.health_drivers.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="text-xs font-medium text-gray-500">Health Drivers:</div>
                {matter.health_drivers.slice(0, 2).map((driver, idx) => (
                  <div key={idx} className="text-xs text-red-600">
                    • {driver.description}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right section - timestamps */}
          <div className="ml-6 flex-shrink-0 text-right space-y-1">
            <div className="text-xs text-gray-500">
              Opened {format(new Date(matter.opened_at), 'MMM d, yyyy')}
            </div>
            {matter.status_changed_at && (
              <div className="text-xs text-gray-500">
                Status changed {format(new Date(matter.status_changed_at), 'MMM d, h:mm a')}
              </div>
            )}
            {matter.sla_breach_at && (
              <div className="text-xs font-medium text-red-600">
                ⏰ SLA breach
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

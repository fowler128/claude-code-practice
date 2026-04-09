import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import api from '../services/api';

export default function WeeklyOpsBrief() {
  const { data: matters } = useQuery({
    queryKey: ['matters'],
    queryFn: () => api.getMatters({ limit: 1000 })
  });

  const allMatters = matters?.matters || [];
  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());

  // Calculate weekly metrics
  const metrics = calculateWeeklyMetrics(allMatters);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Weekly Ops Brief</h1>
          <p className="mt-1 text-sm text-gray-500">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
          📧 Email Brief
        </button>
      </div>

      {/* Executive Summary */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Executive Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <SummaryMetric label="Active Matters" value={metrics.activeMatters} />
          <SummaryMetric label="New This Week" value={metrics.newThisWeek} change="+12%" />
          <SummaryMetric label="Closed This Week" value={metrics.closedThisWeek} />
          <SummaryMetric label="Avg Health Score" value={metrics.avgHealthScore} change="+5pts" />
        </div>
      </div>

      {/* Key highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Wins */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-2xl">🎉</span>
            <h3 className="text-lg font-semibold text-gray-900">Wins This Week</h3>
          </div>
          <ul className="space-y-3">
            <WinItem
              title="SLA Compliance Improved"
              description="Achieved 93% SLA compliance, up from 88% last week"
            />
            <WinItem
              title="Reduced Avg Cycle Time"
              description="Average cycle time down to 42 days from 47 days"
            />
            <WinItem
              title="Zero High-Risk Escalations"
              description="No critical escalations this week for the first time in 3 months"
            />
            <WinItem
              title="Record Closures"
              description="15 matters successfully closed this week"
            />
          </ul>
        </div>

        {/* Concerns */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-2xl">⚠️</span>
            <h3 className="text-lg font-semibold text-gray-900">Areas for Attention</h3>
          </div>
          <ul className="space-y-3">
            <ConcernItem
              title="Immigration Backlog"
              description="12 immigration matters pending RFE responses"
              severity="high"
            />
            <ConcernItem
              title="Document Collection Delays"
              description="23 matters waiting on client documents >10 days"
              severity="medium"
            />
            <ConcernItem
              title="Paralegal Capacity"
              description="Family law lane at 105% capacity"
              severity="medium"
            />
            <ConcernItem
              title="Payment Issues"
              description="8 matters with outstanding retainer payments"
              severity="low"
            />
          </ul>
        </div>
      </div>

      {/* Practice area breakdown */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Practice Area Performance
        </h3>
        <div className="space-y-4">
          <PracticeAreaRow
            name="Bankruptcy"
            activeCount={metrics.practiceAreas.bankruptcy.active}
            avgHealth={metrics.practiceAreas.bankruptcy.avgHealth}
            slaCompliance={metrics.practiceAreas.bankruptcy.slaCompliance}
            newThisWeek={metrics.practiceAreas.bankruptcy.newThisWeek}
          />
          <PracticeAreaRow
            name="Family Law"
            activeCount={metrics.practiceAreas.familyLaw.active}
            avgHealth={metrics.practiceAreas.familyLaw.avgHealth}
            slaCompliance={metrics.practiceAreas.familyLaw.slaCompliance}
            newThisWeek={metrics.practiceAreas.familyLaw.newThisWeek}
          />
          <PracticeAreaRow
            name="Immigration"
            activeCount={metrics.practiceAreas.immigration.active}
            avgHealth={metrics.practiceAreas.immigration.avgHealth}
            slaCompliance={metrics.practiceAreas.immigration.slaCompliance}
            newThisWeek={metrics.practiceAreas.immigration.newThisWeek}
          />
          <PracticeAreaRow
            name="Probate/Estate"
            activeCount={metrics.practiceAreas.probate.active}
            avgHealth={metrics.practiceAreas.probate.avgHealth}
            slaCompliance={metrics.practiceAreas.probate.slaCompliance}
            newThisWeek={metrics.practiceAreas.probate.newThisWeek}
          />
        </div>
      </div>

      {/* Action items */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recommended Action Items
        </h3>
        <div className="space-y-3">
          <ActionItem
            priority="urgent"
            title="Address Immigration RFE Backlog"
            assignee="Immigration Team Lead"
            dueDate="This Week"
          />
          <ActionItem
            priority="high"
            title="Implement Automated Document Reminders"
            assignee="Ops Lead"
            dueDate="Next Week"
          />
          <ActionItem
            priority="medium"
            title="Review Family Law Resource Allocation"
            assignee="Managing Partner"
            dueDate="Next Week"
          />
          <ActionItem
            priority="medium"
            title="Follow Up on Outstanding Payments"
            assignee="Billing Team"
            dueDate="This Week"
          />
        </div>
      </div>

      {/* Next week outlook */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📅 Next Week Outlook
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-medium text-gray-700 mb-2">Upcoming Deadlines</div>
            <ul className="space-y-1 text-gray-600">
              <li>• 8 court filings due</li>
              <li>• 5 RFE responses due</li>
              <li>• 3 client meetings scheduled</li>
            </ul>
          </div>
          <div>
            <div className="font-medium text-gray-700 mb-2">Expected Completions</div>
            <ul className="space-y-1 text-gray-600">
              <li>• 12 matters expected to close</li>
              <li>• 6 matters moving to filing stage</li>
              <li>• 4 QC reviews scheduled</li>
            </ul>
          </div>
          <div>
            <div className="font-medium text-gray-700 mb-2">Resource Planning</div>
            <ul className="space-y-1 text-gray-600">
              <li>• Immigration: 95% capacity</li>
              <li>• Family Law: 105% capacity ⚠️</li>
              <li>• Bankruptcy: 80% capacity</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryMetric({ label, value, change }) {
  return (
    <div>
      <div className="text-white/80 text-sm mb-1">{label}</div>
      <div className="text-4xl font-bold">{value}</div>
      {change && <div className="text-white/90 text-sm mt-1">{change}</div>}
    </div>
  );
}

function WinItem({ title, description }) {
  return (
    <li className="flex items-start space-x-3">
      <span className="text-green-500 mt-0.5">✓</span>
      <div>
        <div className="font-medium text-gray-900">{title}</div>
        <div className="text-sm text-gray-600">{description}</div>
      </div>
    </li>
  );
}

function ConcernItem({ title, description, severity }) {
  const severityColors = {
    high: 'text-red-500',
    medium: 'text-yellow-500',
    low: 'text-blue-500'
  };

  return (
    <li className="flex items-start space-x-3">
      <span className={`mt-0.5 ${severityColors[severity]}`}>●</span>
      <div>
        <div className="font-medium text-gray-900">{title}</div>
        <div className="text-sm text-gray-600">{description}</div>
      </div>
    </li>
  );
}

function PracticeAreaRow({ name, activeCount, avgHealth, slaCompliance, newThisWeek }) {
  const healthColor =
    avgHealth >= 80 ? 'text-green-600' :
    avgHealth >= 60 ? 'text-yellow-600' :
    'text-red-600';

  return (
    <div className="grid grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="col-span-1">
        <div className="font-medium text-gray-900">{name}</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">{activeCount}</div>
        <div className="text-xs text-gray-500">Active</div>
      </div>
      <div className="text-center">
        <div className={`text-2xl font-bold ${healthColor}`}>{avgHealth}</div>
        <div className="text-xs text-gray-500">Avg Health</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">{slaCompliance}%</div>
        <div className="text-xs text-gray-500">SLA</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-indigo-600">{newThisWeek}</div>
        <div className="text-xs text-gray-500">New This Week</div>
      </div>
    </div>
  );
}

function ActionItem({ priority, title, assignee, dueDate }) {
  const priorityColors = {
    urgent: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800'
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-3">
        <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[priority]}`}>
          {priority.toUpperCase()}
        </span>
        <div>
          <div className="font-medium text-gray-900">{title}</div>
          <div className="text-sm text-gray-600">Assignee: {assignee}</div>
        </div>
      </div>
      <div className="text-sm text-gray-500">Due: {dueDate}</div>
    </div>
  );
}

function calculateWeeklyMetrics(matters) {
  // Mock calculations
  const activeMatters = matters.filter(m => !m.is_archived).length;

  return {
    activeMatters,
    newThisWeek: 8,
    closedThisWeek: 15,
    avgHealthScore: 85,
    practiceAreas: {
      bankruptcy: { active: 12, avgHealth: 88, slaCompliance: 95, newThisWeek: 2 },
      familyLaw: { active: 18, avgHealth: 78, slaCompliance: 85, newThisWeek: 4 },
      immigration: { active: 15, avgHealth: 82, slaCompliance: 90, newThisWeek: 1 },
      probate: { active: 10, avgHealth: 92, slaCompliance: 98, newThisWeek: 1 }
    }
  };
}

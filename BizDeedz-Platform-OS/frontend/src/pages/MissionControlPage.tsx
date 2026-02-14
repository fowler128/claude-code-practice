import { useQuery } from '@tanstack/react-query';
import { missionControlApi } from '../services/api';
import {
  Activity,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Zap,
  BarChart3,
  Settings
} from 'lucide-react';
import { useState } from 'react';
import WorkOrdersKanban from '../components/WorkOrdersKanban';

type TabType = 'dashboard' | 'work-orders' | 'analytics' | 'cron-jobs';

export default function MissionControlPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['missionControl', 'dashboard'],
    queryFn: () => missionControlApi.getDashboard(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading || !dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Mission Control...</p>
        </div>
      </div>
    );
  }

  const { spend, top_agents, work_orders, system } = dashboard;

  const utilizationPct = spend.utilization_pct || 0;
  const isWarning = utilizationPct >= 80;
  const isDanger = utilizationPct >= 95;

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: Activity },
    { id: 'work-orders' as TabType, label: 'Work Orders', icon: Zap },
    { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 },
    { id: 'cron-jobs' as TabType, label: 'Cron Jobs', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mission Control</h1>
          <p className="mt-1 text-sm text-gray-500">
            Real-time agent operations and cost monitoring
          </p>
        </div>
        {system?.last_heartbeat && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Activity className="w-4 h-4" />
            <span>Last heartbeat:</span>
            <span className="font-medium">
              {new Date(system.last_heartbeat).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && <DashboardTab dashboard={dashboard} />}
      {activeTab === 'work-orders' && <WorkOrdersTab />}
      {activeTab === 'analytics' && <AnalyticsTab />}
      {activeTab === 'cron-jobs' && <CronJobsTab />}
    </div>
  );
}

function DashboardTab({ dashboard }: { dashboard: any }) {
  if (!dashboard) return null;

  const { spend, top_agents, work_orders } = dashboard;

  const utilizationPct = spend.utilization_pct || 0;
  const isWarning = utilizationPct >= 80;
  const isDanger = utilizationPct >= 95;

  return (
    <div className="space-y-6">

      {/* Budget Status Card */}
      <div className={`rounded-lg shadow-md p-6 border-2 ${
        isDanger
          ? 'bg-red-50 border-red-500'
          : isWarning
          ? 'bg-yellow-50 border-yellow-500'
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-full ${
              isDanger
                ? 'bg-red-100'
                : isWarning
                ? 'bg-yellow-100'
                : 'bg-green-100'
            }`}>
              <DollarSign className={`w-6 h-6 ${
                isDanger
                  ? 'text-red-600'
                  : isWarning
                  ? 'text-yellow-600'
                  : 'text-green-600'
              }`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Daily Budget Status</h3>
              <p className="text-sm text-gray-600">
                ${spend.today.toFixed(2)} of ${spend.daily_cap.toFixed(2)} spent today
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${
              isDanger
                ? 'text-red-600'
                : isWarning
                ? 'text-yellow-600'
                : 'text-green-600'
            }`}>
              {utilizationPct.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-500">utilization</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isDanger
                  ? 'bg-red-500'
                  : isWarning
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(utilizationPct, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>$0.00</span>
            <span className="font-medium">${spend.remaining.toFixed(2)} remaining</span>
            <span>${spend.daily_cap.toFixed(2)}</span>
          </div>
        </div>

        {isWarning && (
          <div className="mt-4 flex items-start space-x-2 text-sm">
            <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              isDanger ? 'text-red-600' : 'text-yellow-600'
            }`} />
            <p className={isDanger ? 'text-red-700' : 'text-yellow-700'}>
              {isDanger
                ? 'Critical: Daily budget nearly exhausted! New work orders may be blocked.'
                : 'Warning: Daily budget threshold exceeded. Monitor spending closely.'}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Work Orders */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Work Orders</h3>
            <Zap className="w-5 h-5 text-primary-600" />
          </div>

          <div className="space-y-3">
            {work_orders.by_status.map((status: any) => (
              <div key={status.status} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {status.status === 'completed' && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  {status.status === 'in_progress' && (
                    <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
                  )}
                  {status.status === 'awaiting_approval' && (
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                  )}
                  {status.status === 'queued' && (
                    <Clock className="w-4 h-4 text-gray-500" />
                  )}
                  {status.status === 'failed' && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {status.status.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-lg font-semibold text-gray-900">{status.count}</span>
              </div>
            ))}

            {work_orders.by_status.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No work orders found</p>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Active Work Orders</span>
              <span className="text-xl font-bold text-primary-600">{work_orders.active}</span>
            </div>
          </div>
        </div>

        {/* Top Agents by Spend */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Agents Today</h3>
            <TrendingUp className="w-5 h-5 text-primary-600" />
          </div>

          <div className="space-y-3">
            {top_agents && top_agents.length > 0 ? (
              top_agents.map((agent: any, index: number) => (
                <div key={agent.agent_id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      'bg-orange-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {agent.agent_name || agent.agent_id}
                      </div>
                      <div className="text-xs text-gray-500">
                        {agent.run_count} {agent.run_count === 1 ? 'run' : 'runs'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      ${agent.total_spend.toFixed(4)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No agent activity today</p>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              Showing top agents by total spend today
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

function WorkOrdersTab() {
  return (
    <div>
      <WorkOrdersKanban />
    </div>
  );
}

function AnalyticsTab() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['missionControl', 'analytics'],
    queryFn: () => missionControlApi.getAnalytics(7),
  });

  if (isLoading || !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Daily Spend History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Spend History (7 days)</h3>
        <div className="space-y-2">
          {analytics.daily_history && analytics.daily_history.length > 0 ? (
            analytics.daily_history.map((day: any) => (
              <div key={day.date} className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">{new Date(day.date).toLocaleDateString()}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">{day.work_order_count} orders</span>
                  <span className="text-sm font-semibold text-gray-900">${day.total_spend.toFixed(2)}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No data available</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Spend by Work Type */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Spend by Work Type</h3>
          <div className="space-y-2">
            {analytics.by_work_type && analytics.by_work_type.length > 0 ? (
              analytics.by_work_type.map((type: any) => (
                <div key={type.order_type} className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {type.order_type.replace(/_/g, ' ').toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-500">{type.work_order_count} orders</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">${type.total_spend.toFixed(4)}</div>
                    <div className="text-xs text-gray-500">avg ${type.avg_cost.toFixed(4)}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No data available</p>
            )}
          </div>
        </div>

        {/* Top Agents */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Agents</h3>
          <div className="space-y-2">
            {analytics.top_agents && analytics.top_agents.length > 0 ? (
              analytics.top_agents.map((agent: any, index: number) => (
                <div key={agent.agent_id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{agent.agent_name || agent.agent_id}</div>
                      <div className="text-xs text-gray-500">{agent.run_count} runs</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">${agent.total_spend.toFixed(4)}</div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CronJobsTab() {
  const { data: cronJobs, isLoading } = useQuery({
    queryKey: ['missionControl', 'cronJobs'],
    queryFn: () => missionControlApi.getCronJobs(),
  });

  if (isLoading || !cronJobs) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cron jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Job Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Schedule
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Run
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Next Run
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stats
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cronJobs.map((job: any) => (
              <tr key={job.job_id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{job.job_name}</div>
                  <div className="text-xs text-gray-500">{job.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <code className="bg-gray-100 px-2 py-1 rounded">{job.schedule}</code>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {job.last_run_at ? new Date(job.last_run_at).toLocaleString() : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {job.next_run_at ? new Date(job.next_run_at).toLocaleString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {job.last_run_status && (
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      job.last_run_status === 'success'
                        ? 'bg-green-100 text-green-700'
                        : job.last_run_status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {job.last_run_status}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{job.run_count} total</div>
                  <div className="text-xs text-green-600">{job.success_count} success</div>
                  {job.failure_count > 0 && (
                    <div className="text-xs text-red-600">{job.failure_count} failed</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cronJobs.length === 0 && (
          <div className="text-center py-8 text-gray-500">No cron jobs configured</div>
        )}
      </div>
    </div>
  );
}

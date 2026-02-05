import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { mattersApi, tasksApi, eventsApi } from '../services/api';
import { ArrowLeft, Calendar, User, AlertCircle, CheckSquare, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function MatterDetailPage() {
  const { matterId } = useParams<{ matterId: string }>();

  const { data: matter, isLoading: matterLoading } = useQuery({
    queryKey: ['matter', matterId],
    queryFn: () => mattersApi.getById(matterId!),
    enabled: !!matterId,
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks', matterId],
    queryFn: () => tasksApi.getByMatter(matterId!),
    enabled: !!matterId,
  });

  const { data: events } = useQuery({
    queryKey: ['events', matterId],
    queryFn: () => eventsApi.getByMatter(matterId!, 50),
    enabled: !!matterId,
  });

  if (matterLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        <p className="mt-2 text-sm text-gray-600">Loading matter...</p>
      </div>
    );
  }

  if (!matter) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Matter not found</p>
        <Link to="/matters" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
          ← Back to Matters
        </Link>
      </div>
    );
  }

  const taskStats = {
    total: tasks?.length || 0,
    todo: tasks?.filter((t: any) => t.status === 'todo').length || 0,
    in_progress: tasks?.filter((t: any) => t.status === 'in_progress').length || 0,
    done: tasks?.filter((t: any) => t.status === 'done').length || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <Link to="/matters" className="text-sm text-primary-600 hover:text-primary-700 flex items-center mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Matters
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{matter.matter_number}</h1>
            <p className="mt-1 text-xl text-gray-600">{matter.client_name}</p>
            {matter.client_entity && (
              <p className="text-sm text-gray-500">{matter.client_entity}</p>
            )}
          </div>
          <div className="flex space-x-2">
            <span
              className={`badge ${
                matter.priority === 'urgent'
                  ? 'badge-danger'
                  : matter.priority === 'high'
                  ? 'badge-warning'
                  : 'badge-info'
              }`}
            >
              {matter.priority}
            </span>
            {matter.risk_tier && (
              <span
                className={`badge ${
                  matter.risk_tier === 'critical' || matter.risk_tier === 'high'
                    ? 'badge-danger'
                    : matter.risk_tier === 'medium'
                    ? 'badge-warning'
                    : 'badge-success'
                }`}
              >
                Risk: {matter.risk_tier}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Matter Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-primary-100">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Practice Area</p>
              <p className="text-lg font-semibold text-gray-900">{matter.practice_area_name}</p>
              <p className="text-xs text-gray-500">{matter.matter_type_name}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-green-100">
              <CheckSquare className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-lg font-semibold text-gray-900">{matter.status}</p>
              <p className="text-xs text-gray-500">Lane: {matter.lane}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-blue-100">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Opened</p>
              <p className="text-lg font-semibold text-gray-900">
                {format(new Date(matter.opened_at), 'MMM d, yyyy')}
              </p>
              {matter.owner_first_name && (
                <p className="text-xs text-gray-500">
                  By: {matter.owner_first_name} {matter.owner_last_name}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Matter Health Score */}
      {matter.matter_health_score !== null && matter.matter_health_score !== undefined && (
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Matter Health Score</h3>
              <p className="text-sm text-gray-600">Overall health and risk assessment</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-gray-900">{matter.matter_health_score}</div>
              <div className="text-sm text-gray-500">out of 100</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasks</h2>
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-gray-900">{taskStats.total}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div className="text-center p-2 bg-yellow-50 rounded">
              <div className="text-2xl font-bold text-yellow-700">{taskStats.todo}</div>
              <div className="text-xs text-yellow-700">To Do</div>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-700">{taskStats.in_progress}</div>
              <div className="text-xs text-blue-700">In Progress</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-700">{taskStats.done}</div>
              <div className="text-xs text-green-700">Done</div>
            </div>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tasks && tasks.length > 0 ? (
              tasks.map((task: any) => (
                <div key={task.task_id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                      )}
                      {task.assigned_first_name && (
                        <p className="text-xs text-gray-500 mt-1">
                          Assigned to: {task.assigned_first_name} {task.assigned_last_name}
                        </p>
                      )}
                    </div>
                    <span
                      className={`badge ml-2 ${
                        task.status === 'done'
                          ? 'badge-success'
                          : task.status === 'in_progress'
                          ? 'badge-info'
                          : 'badge-warning'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No tasks yet</p>
            )}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {events && events.length > 0 ? (
              events.map((event: any) => (
                <div key={event.event_id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{event.description}</p>
                    <div className="flex items-center mt-1 space-x-2 text-xs text-gray-500">
                      {event.first_name && (
                        <span>
                          {event.first_name} {event.last_name}
                        </span>
                      )}
                      <span>• {format(new Date(event.created_at), 'MMM d, h:mm a')}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No activity yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

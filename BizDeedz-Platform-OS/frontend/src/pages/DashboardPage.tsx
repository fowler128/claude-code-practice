import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { mattersApi, tasksApi, eventsApi } from '../services/api';
import { Briefcase, CheckSquare, AlertCircle, TrendingUp, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { data: mattersData } = useQuery({
    queryKey: ['matters', { limit: 10 }],
    queryFn: () => mattersApi.getAll({ limit: 10 }),
  });

  const { data: myTasks } = useQuery({
    queryKey: ['my-tasks', { status: 'todo' }],
    queryFn: () => tasksApi.getMyTasks('todo'),
  });

  const { data: recentEvents } = useQuery({
    queryKey: ['events', { limit: 10 }],
    queryFn: () => eventsApi.getAll(10),
  });

  const matters = mattersData?.matters || [];
  const tasks = myTasks || [];
  const events = recentEvents || [];

  const stats = [
    {
      name: 'Active Matters',
      value: mattersData?.pagination?.total || 0,
      icon: Briefcase,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
    },
    {
      name: 'My Open Tasks',
      value: tasks.length,
      icon: CheckSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Urgent Matters',
      value: matters.filter((m: any) => m.priority === 'urgent' || m.priority === 'high').length,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      name: 'Recent Activity',
      value: events.length,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-600">Welcome to BizDeedz Platform OS</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd className="text-2xl font-bold text-gray-900">{stat.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Matters */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Matters</h2>
            <Link to="/matters" className="text-sm text-primary-600 hover:text-primary-700">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {matters.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No matters found</p>
            ) : (
              matters.slice(0, 5).map((matter: any) => (
                <Link
                  key={matter.matter_id}
                  to={`/matters/${matter.matter_id}`}
                  className="block p-3 rounded-lg hover:bg-gray-50 border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {matter.matter_number}
                      </p>
                      <p className="text-sm text-gray-600 truncate">{matter.client_name}</p>
                      <div className="flex items-center mt-1 space-x-2">
                        <span className="badge badge-info">{matter.practice_area_name}</span>
                        <span
                          className={`badge ${
                            matter.priority === 'urgent'
                              ? 'badge-danger'
                              : matter.priority === 'high'
                              ? 'badge-warning'
                              : 'badge-gray'
                          }`}
                        >
                          {matter.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* My Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">My Tasks</h2>
            <Link to="/my-tasks" className="text-sm text-primary-600 hover:text-primary-700">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No open tasks</p>
            ) : (
              tasks.slice(0, 5).map((task: any) => (
                <div
                  key={task.task_id}
                  className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Matter: {task.matter_number} - {task.client_name}
                      </p>
                      {task.due_date && (
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>
                    <span className="badge badge-warning ml-2">{task.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {events.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
          ) : (
            events.map((event: any) => (
              <div key={event.event_id} className="flex items-start space-x-3 text-sm">
                <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900">{event.description}</p>
                  <div className="flex items-center mt-1 space-x-2 text-xs text-gray-500">
                    {event.matter_number && (
                      <span>Matter: {event.matter_number}</span>
                    )}
                    {event.first_name && (
                      <span>
                        • By: {event.first_name} {event.last_name}
                      </span>
                    )}
                    <span>• {format(new Date(event.created_at), 'MMM d, h:mm a')}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../services/api';

export default function MatterDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch matter data
  const { data: matter, isLoading } = useQuery({
    queryKey: ['matter', id],
    queryFn: () => api.getMatterById(id)
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => api.getMatterTasks(id)
  });

  const { data: timeline } = useQuery({
    queryKey: ['timeline', id],
    queryFn: () => api.getMatterTimeline(id)
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading matter...</div>
      </div>
    );
  }

  if (!matter) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Matter not found</p>
        <Link to="/queue" className="text-indigo-600 hover:text-indigo-700 mt-2">
          ← Back to queue
        </Link>
      </div>
    );
  }

  const riskColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/queue" className="text-sm text-indigo-600 hover:text-indigo-700">
          ← Back to queue
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{matter.matter_number}</h1>
            <p className="mt-1 text-lg text-gray-600">{matter.client_name}</p>
          </div>
          <div className="flex items-center space-x-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                riskColors[matter.health_risk_tier] || riskColors.medium
              }`}
            >
              Health Score: {matter.health_score}
            </span>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <InfoCard label="Practice Area" value={matter.practice_area_name} />
        <InfoCard label="Matter Type" value={matter.matter_type_name} />
        <InfoCard label="Current Status" value={matter.current_status} />
        <InfoCard label="Current Lane" value={matter.current_lane} />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <TabButton
            label="Overview"
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
          />
          <TabButton
            label="Tasks"
            active={activeTab === 'tasks'}
            onClick={() => setActiveTab('tasks')}
            badge={tasks?.filter(t => t.status === 'pending').length}
          />
          <TabButton
            label="Artifacts"
            active={activeTab === 'artifacts'}
            onClick={() => setActiveTab('artifacts')}
          />
          <TabButton
            label="Timeline"
            active={activeTab === 'timeline'}
            onClick={() => setActiveTab('timeline')}
          />
          <TabButton
            label="AI Runs"
            active={activeTab === 'ai_runs'}
            onClick={() => setActiveTab('ai_runs')}
          />
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'overview' && (
          <OverviewTab matter={matter} />
        )}
        {activeTab === 'tasks' && (
          <TasksTab matterId={id} tasks={tasks || []} />
        )}
        {activeTab === 'artifacts' && (
          <ArtifactsTab matterId={id} />
        )}
        {activeTab === 'timeline' && (
          <TimelineTab events={timeline || []} />
        )}
        {activeTab === 'ai_runs' && (
          <AIRunsTab matterId={id} />
        )}
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function TabButton({ label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`
        py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
        ${active
          ? 'border-indigo-500 text-indigo-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }
      `}
    >
      {label}
      {badge > 0 && (
        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
          {badge}
        </span>
      )}
    </button>
  );
}

function OverviewTab({ matter }) {
  return (
    <div className="space-y-6">
      {/* Health drivers */}
      {matter.health_drivers && matter.health_drivers.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Health Score Drivers
          </h3>
          <div className="space-y-3">
            {matter.health_drivers.map((driver, idx) => (
              <div key={idx} className="border-l-4 border-red-500 pl-4 py-2">
                <div className="font-medium text-red-900">
                  -{driver.impact} points: {driver.description}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {driver.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matter details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Client Information
          </h3>
          <dl className="space-y-3">
            <DetailRow label="Name" value={matter.client_name} />
            <DetailRow label="Email" value={matter.client_email || 'N/A'} />
            <DetailRow label="Phone" value={matter.client_phone || 'N/A'} />
            <DetailRow label="Opposing Party" value={matter.opposing_party || 'N/A'} />
          </dl>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Matter Status
          </h3>
          <dl className="space-y-3">
            <DetailRow
              label="Opened"
              value={format(new Date(matter.opened_at), 'MMM d, yyyy h:mm a')}
            />
            <DetailRow
              label="Status Changed"
              value={format(new Date(matter.status_changed_at), 'MMM d, yyyy h:mm a')}
            />
            <DetailRow label="Assigned To" value={matter.assigned_to || 'Unassigned'} />
            <DetailRow label="Assigned Role" value={matter.assigned_role || 'N/A'} />
            <DetailRow label="Defect Count" value={matter.defect_count} />
            <DetailRow label="Escalation Count" value={matter.escalation_count} />
          </dl>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}

function TasksTab({ matterId, tasks }) {
  const queryClient = useQueryClient();

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, status }) => api.updateTask(taskId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks', matterId]);
      queryClient.invalidateQueries(['matter', matterId]);
    }
  });

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Pending tasks */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Pending Tasks ({pendingTasks.length})
        </h3>
        {pendingTasks.length === 0 ? (
          <p className="text-sm text-gray-500">No pending tasks</p>
        ) : (
          <div className="space-y-3">
            {pendingTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onComplete={() =>
                  updateTaskMutation.mutate({ taskId: task.id, status: 'completed' })
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Completed tasks */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Completed Tasks ({completedTasks.length})
        </h3>
        {completedTasks.length === 0 ? (
          <p className="text-sm text-gray-500">No completed tasks</p>
        ) : (
          <div className="space-y-3">
            {completedTasks.map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TaskItem({ task, onComplete }) {
  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  return (
    <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50">
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <h4 className="font-medium text-gray-900">{task.title}</h4>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              priorityColors[task.priority] || priorityColors.medium
            }`}
          >
            {task.priority}
          </span>
        </div>
        {task.description && (
          <p className="mt-1 text-sm text-gray-600">{task.description}</p>
        )}
        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
          {task.assigned_to && <span>Assigned: {task.assigned_to}</span>}
          {task.due_date && (
            <span>Due: {format(new Date(task.due_date), 'MMM d, yyyy')}</span>
          )}
          {task.is_automated && <span>🤖 Automated</span>}
        </div>
      </div>
      {onComplete && task.status === 'pending' && (
        <button
          onClick={onComplete}
          className="ml-4 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
        >
          Complete
        </button>
      )}
    </div>
  );
}

function ArtifactsTab({ matterId }) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Artifacts</h3>
      <p className="text-sm text-gray-500">Artifact management coming soon...</p>
    </div>
  );
}

function TimelineTab({ events }) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Matter Timeline
      </h3>
      {events.length === 0 ? (
        <p className="text-sm text-gray-500">No events yet</p>
      ) : (
        <div className="space-y-4">
          {events.map((event, idx) => (
            <div key={event.id} className="flex">
              <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-indigo-500" />
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                  <span className="text-xs text-gray-500">
                    {format(new Date(event.created_at), 'MMM d, h:mm a')}
                  </span>
                </div>
                {event.description && (
                  <p className="mt-1 text-sm text-gray-600">{event.description}</p>
                )}
                {event.actor_name && (
                  <p className="mt-1 text-xs text-gray-500">by {event.actor_name}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AIRunsTab({ matterId }) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Runs</h3>
      <p className="text-sm text-gray-500">AI run tracking coming soon...</p>
    </div>
  );
}

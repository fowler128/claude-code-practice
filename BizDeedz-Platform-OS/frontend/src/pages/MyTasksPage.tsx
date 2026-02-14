import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { tasksApi } from '../services/api';
import { CheckSquare, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function MyTasksPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['my-tasks', statusFilter],
    queryFn: () => tasksApi.getMyTasks(statusFilter || undefined),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: any }) =>
      tasksApi.update(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleStatusChange = (taskId: string, newStatus: string) => {
    updateTaskMutation.mutate({
      taskId,
      data: { status: newStatus },
    });
  };

  const tasksByStatus = {
    todo: tasks?.filter((t: any) => t.status === 'todo') || [],
    in_progress: tasks?.filter((t: any) => t.status === 'in_progress') || [],
    done: tasks?.filter((t: any) => t.status === 'done') || [],
    blocked: tasks?.filter((t: any) => t.status === 'blocked') || [],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
        <p className="mt-1 text-gray-600">Manage your assigned tasks</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-yellow-100">
              <CheckSquare className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">To Do</p>
              <p className="text-2xl font-bold text-gray-900">{tasksByStatus.todo.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-blue-100">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{tasksByStatus.in_progress.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-green-100">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Done</p>
              <p className="text-2xl font-bold text-gray-900">{tasksByStatus.done.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-red-100">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Blocked</p>
              <p className="text-2xl font-bold text-gray-900">{tasksByStatus.blocked.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <label className="label">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input max-w-xs"
          >
            <option value="">All Tasks</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="card">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            <p className="mt-2 text-sm text-gray-600">Loading tasks...</p>
          </div>
        ) : tasks && tasks.length > 0 ? (
          <div className="space-y-4">
            {tasks.map((task: any) => (
              <div
                key={task.task_id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                      <span
                        className={`badge ${
                          task.status === 'done'
                            ? 'badge-success'
                            : task.status === 'in_progress'
                            ? 'badge-info'
                            : task.status === 'blocked'
                            ? 'badge-danger'
                            : 'badge-warning'
                        }`}
                      >
                        {task.status}
                      </span>
                      {task.matter_priority && (
                        <span
                          className={`badge ${
                            task.matter_priority === 'urgent'
                              ? 'badge-danger'
                              : task.matter_priority === 'high'
                              ? 'badge-warning'
                              : 'badge-gray'
                          }`}
                        >
                          {task.matter_priority} priority
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <Link
                        to={`/matters/${task.matter_id}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        Matter: {task.matter_number} - {task.client_name}
                      </Link>
                      {task.due_date && (
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
                        </span>
                      )}
                      {task.creator_first_name && (
                        <span>
                          Created by: {task.creator_first_name} {task.creator_last_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col space-y-2">
                    {task.status === 'todo' && (
                      <button
                        onClick={() => handleStatusChange(task.task_id, 'in_progress')}
                        disabled={updateTaskMutation.isPending}
                        className="btn btn-primary text-sm py-1 px-3"
                      >
                        Start
                      </button>
                    )}
                    {task.status === 'in_progress' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(task.task_id, 'done')}
                          disabled={updateTaskMutation.isPending}
                          className="btn btn-primary text-sm py-1 px-3"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleStatusChange(task.task_id, 'blocked')}
                          disabled={updateTaskMutation.isPending}
                          className="btn btn-secondary text-sm py-1 px-3"
                        >
                          Block
                        </button>
                      </>
                    )}
                    {task.status === 'blocked' && (
                      <button
                        onClick={() => handleStatusChange(task.task_id, 'in_progress')}
                        disabled={updateTaskMutation.isPending}
                        className="btn btn-primary text-sm py-1 px-3"
                      >
                        Unblock
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No tasks found</p>
          </div>
        )}
      </div>
    </div>
  );
}

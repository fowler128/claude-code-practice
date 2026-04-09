import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workOrdersApi, missionControlApi } from '../services/api';
import {
  Clock,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  DollarSign,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useState } from 'react';

interface WorkOrder {
  work_order_id: string;
  order_type: string;
  status: string;
  priority: string;
  agent_id: string;
  est_cost_usd: number;
  actual_cost_usd: number;
  est_tokens_total: number;
  actual_tokens_total: number;
  model_provider: string;
  model_name: string;
  created_at: string;
  completed_at: string;
  approval_required_reason: string;
}

const statusConfig = {
  queued: {
    label: 'Queued',
    icon: Clock,
    color: 'gray',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
  },
  in_progress: {
    label: 'In Progress',
    icon: Activity,
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
  },
  awaiting_approval: {
    label: 'Awaiting Approval',
    icon: AlertCircle,
    color: 'yellow',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'green',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    color: 'red',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
  },
};

function WorkOrderCard({ workOrder }: { workOrder: WorkOrder }) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: () => missionControlApi.approveWorkOrder(workOrder.work_order_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
    },
  });

  const executeMutation = useMutation({
    mutationFn: () => missionControlApi.executeWorkOrder(workOrder.work_order_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
    },
  });

  const variance = workOrder.actual_cost_usd && workOrder.est_cost_usd
    ? ((workOrder.actual_cost_usd - workOrder.est_cost_usd) / workOrder.est_cost_usd) * 100
    : null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-900 mb-1">
            {workOrder.order_type.replace(/_/g, ' ').toUpperCase()}
          </div>
          <div className="text-xs text-gray-500">
            ID: {workOrder.work_order_id.slice(0, 8)}...
          </div>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          workOrder.priority === 'high'
            ? 'bg-red-100 text-red-700'
            : workOrder.priority === 'medium'
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-gray-100 text-gray-700'
        }`}>
          {workOrder.priority}
        </div>
      </div>

      {/* Cost Info */}
      {workOrder.est_cost_usd && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Estimated:</span>
            <span className="font-medium text-gray-900">${workOrder.est_cost_usd.toFixed(4)}</span>
          </div>
          {workOrder.actual_cost_usd && (
            <>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-gray-600">Actual:</span>
                <span className="font-medium text-gray-900">${workOrder.actual_cost_usd.toFixed(4)}</span>
              </div>
              {variance !== null && (
                <div className={`text-xs mt-1 text-right font-medium ${
                  variance > 10 ? 'text-red-600' : variance < -10 ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {variance > 0 ? '+' : ''}{variance.toFixed(1)}% variance
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Model Info */}
      {workOrder.model_provider && (
        <div className="flex items-center space-x-1 mb-2">
          <Zap className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-600">
            {workOrder.model_provider}/{workOrder.model_name}
          </span>
        </div>
      )}

      {/* Approval Reason */}
      {workOrder.approval_required_reason && (
        <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          {workOrder.approval_required_reason}
        </div>
      )}

      {/* Actions */}
      {workOrder.status === 'awaiting_approval' && (
        <button
          onClick={() => approveMutation.mutate()}
          disabled={approveMutation.isPending}
          className="w-full btn btn-primary text-xs py-1 mb-2"
        >
          {approveMutation.isPending ? 'Approving...' : 'Approve'}
        </button>
      )}

      {workOrder.status === 'queued' && (
        <button
          onClick={() => executeMutation.mutate()}
          disabled={executeMutation.isPending}
          className="w-full btn btn-secondary text-xs py-1 mb-2"
        >
          {executeMutation.isPending ? 'Executing...' : 'Execute Now'}
        </button>
      )}

      {/* Expand/Collapse */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center text-xs text-gray-500 hover:text-gray-700"
      >
        {expanded ? (
          <>
            <ChevronUp className="w-3 h-3 mr-1" />
            Less
          </>
        ) : (
          <>
            <ChevronDown className="w-3 h-3 mr-1" />
            More
          </>
        )}
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-2 pt-2 border-t border-gray-200 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Agent ID:</span>
            <span className="font-medium text-gray-900">{workOrder.agent_id}</span>
          </div>
          {workOrder.est_tokens_total && (
            <div className="flex justify-between">
              <span className="text-gray-600">Est. Tokens:</span>
              <span className="font-medium text-gray-900">{workOrder.est_tokens_total.toLocaleString()}</span>
            </div>
          )}
          {workOrder.actual_tokens_total && (
            <div className="flex justify-between">
              <span className="text-gray-600">Actual Tokens:</span>
              <span className="font-medium text-gray-900">{workOrder.actual_tokens_total.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Created:</span>
            <span className="font-medium text-gray-900">
              {new Date(workOrder.created_at).toLocaleDateString()}
            </span>
          </div>
          {workOrder.completed_at && (
            <div className="flex justify-between">
              <span className="text-gray-600">Completed:</span>
              <span className="font-medium text-gray-900">
                {new Date(workOrder.completed_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WorkOrdersKanban() {
  const { data: workOrders = [], isLoading } = useQuery({
    queryKey: ['workOrders'],
    queryFn: () => workOrdersApi.getAll(),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading work orders...</p>
        </div>
      </div>
    );
  }

  const statusOrder = ['queued', 'in_progress', 'awaiting_approval', 'completed', 'failed'];

  const groupedWorkOrders = statusOrder.reduce((acc, status) => {
    acc[status] = workOrders.filter((wo: WorkOrder) => wo.status === status);
    return acc;
  }, {} as Record<string, WorkOrder[]>);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {statusOrder.map((status) => {
        const config = statusConfig[status as keyof typeof statusConfig];
        const Icon = config.icon;
        const orders = groupedWorkOrders[status] || [];

        return (
          <div key={status} className="flex flex-col">
            {/* Lane Header */}
            <div className={`${config.bgColor} border-2 ${config.borderColor} rounded-lg p-3 mb-3`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icon className={`w-4 h-4 text-${config.color}-600`} />
                  <h3 className="font-semibold text-sm text-gray-900">{config.label}</h3>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold bg-${config.color}-100 text-${config.color}-700`}>
                  {orders.length}
                </span>
              </div>
            </div>

            {/* Work Orders */}
            <div className="space-y-3 flex-1">
              {orders.length > 0 ? (
                orders.map((workOrder) => (
                  <WorkOrderCard key={workOrder.work_order_id} workOrder={workOrder} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No work orders
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

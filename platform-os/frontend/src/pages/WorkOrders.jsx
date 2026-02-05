import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../services/api';

export default function WorkOrders() {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const queryClient = useQueryClient();

  // Fetch work orders
  const { data: workOrdersData, isLoading } = useQuery({
    queryKey: ['work-orders', selectedStatus, selectedPriority],
    queryFn: () => {
      const params = {};
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedPriority !== 'all') params.priority = selectedPriority;
      return api.getWorkOrders(params);
    }
  });

  // Execute work order mutation
  const executeWorkOrderMutation = useMutation({
    mutationFn: ({ workOrderId, userId }) =>
      api.executeWorkOrder(workOrderId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['work-orders']);
    }
  });

  // Approve work order mutation
  const approveWorkOrderMutation = useMutation({
    mutationFn: ({ workOrderId, approvedBy }) =>
      api.approveWorkOrder(workOrderId, approvedBy),
    onSuccess: () => {
      queryClient.invalidateQueries(['work-orders']);
    }
  });

  const workOrders = workOrdersData?.work_orders || [];

  // Group by status
  const grouped = workOrders.reduce((acc, wo) => {
    const status = wo.status;
    if (!acc[status]) acc[status] = [];
    acc[status].push(wo);
    return acc;
  }, {});

  const columns = [
    { status: 'pending', title: 'Pending', color: 'bg-gray-100' },
    { status: 'in_progress', title: 'In Progress', color: 'bg-blue-100' },
    { status: 'agent_processing', title: 'Agent Processing', color: 'bg-purple-100' },
    { status: 'awaiting_approval', title: 'Awaiting Approval', color: 'bg-yellow-100' },
    { status: 'completed', title: 'Completed', color: 'bg-green-100' }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading work orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Work Orders</h1>
          <p className="mt-1 text-sm text-gray-500">
            Agent and human work items
          </p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
          + New Work Order
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="agent_processing">Agent Processing</option>
              <option value="awaiting_approval">Awaiting Approval</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold">{workOrders.length}</span> work orders
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {columns.map(column => (
          <div key={column.status} className="flex flex-col">
            <div className={`${column.color} px-4 py-3 rounded-t-lg border-b-2 border-gray-300`}>
              <h3 className="font-semibold text-gray-900">{column.title}</h3>
              <span className="text-sm text-gray-600">
                {grouped[column.status]?.length || 0}
              </span>
            </div>
            <div className="bg-gray-50 rounded-b-lg p-4 space-y-3 min-h-[400px] max-h-[600px] overflow-y-auto">
              {(grouped[column.status] || []).map(wo => (
                <WorkOrderCard
                  key={wo.id}
                  workOrder={wo}
                  onExecute={(userId) =>
                    executeWorkOrderMutation.mutate({ workOrderId: wo.id, userId })
                  }
                  onApprove={(approvedBy) =>
                    approveWorkOrderMutation.mutate({ workOrderId: wo.id, approvedBy })
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkOrderCard({ workOrder, onExecute, onApprove }) {
  const priorityColors = {
    urgent: 'bg-red-100 text-red-800 border-red-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    medium: 'bg-blue-100 text-blue-800 border-blue-300',
    low: 'bg-gray-100 text-gray-800 border-gray-300'
  };

  return (
    <div
      className={`bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4 ${
        priorityColors[workOrder.priority]
      }`}
    >
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 text-sm">{workOrder.title}</h4>
            <div className="text-xs text-gray-500 mt-1">
              {workOrder.work_order_number}
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[workOrder.priority]}`}
          >
            {workOrder.priority}
          </span>
        </div>

        {/* Description */}
        {workOrder.description && (
          <p className="text-xs text-gray-600 line-clamp-2">
            {workOrder.description}
          </p>
        )}

        {/* Agent info */}
        {workOrder.agent_name && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-purple-600">🤖</span>
            <span className="text-gray-700">{workOrder.agent_name}</span>
          </div>
        )}

        {/* Work type */}
        <div className="inline-flex items-center px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs">
          {workOrder.work_type}
        </div>

        {/* Actions */}
        {workOrder.status === 'pending' && workOrder.agent_id && (
          <button
            onClick={() => onExecute('current_user')}
            className="w-full mt-2 px-3 py-1.5 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
          >
            Execute with Agent
          </button>
        )}

        {workOrder.status === 'awaiting_approval' && (
          <div className="flex space-x-2 mt-2">
            <button
              onClick={() => onApprove('current_user')}
              className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700"
            >
              Approve
            </button>
            <button className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700">
              Reject
            </button>
          </div>
        )}

        {/* Due date */}
        {workOrder.due_date && (
          <div className="text-xs text-gray-500 pt-2 border-t">
            Due: {format(new Date(workOrder.due_date), 'MMM d, h:mm a')}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { contentOpsApi } from '../services/api';
import type { ContentOpsDashboard } from '@shared/types';

export default function ContentCommandCenterPage() {
  const navigate = useNavigate();

  const { data: dashboard, isLoading, error } = useQuery<ContentOpsDashboard>({
    queryKey: ['content-ops-dashboard'],
    queryFn: () => contentOpsApi.getDashboard(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Error loading dashboard</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Content Command Center</h1>
        <p className="text-gray-600 mt-1">Version 2.1 Content Operations System</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Drafts Pending Review</div>
          <div className="text-3xl font-bold text-orange-600">
            {dashboard?.drafts_pending_review || 0}
          </div>
          <button
            onClick={() => navigate('/content/review-queue')}
            className="text-sm text-blue-600 hover:underline mt-2"
          >
            View Queue →
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Scheduled This Week</div>
          <div className="text-3xl font-bold text-green-600">
            {dashboard?.scheduled_this_week || 0}
          </div>
          <button
            onClick={() => navigate('/content/calendar')}
            className="text-sm text-blue-600 hover:underline mt-2"
          >
            View Calendar →
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Total Published</div>
          <div className="text-3xl font-bold text-purple-600">
            {dashboard?.total_published || 0}
          </div>
          <button
            onClick={() => navigate('/content/performance')}
            className="text-sm text-blue-600 hover:underline mt-2"
          >
            View Performance →
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Ideas in Pipeline</div>
          <div className="text-3xl font-bold text-blue-600">
            {dashboard?.ideas_pipeline?.reduce((sum, item) => sum + (item.idea_count || 0), 0) || 0}
          </div>
          <button
            onClick={() => navigate('/content/ideas')}
            className="text-sm text-blue-600 hover:underline mt-2"
          >
            View Ideas →
          </button>
        </div>
      </div>

      {/* Ideas Pipeline */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Ideas Pipeline</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* BizDeedz Lane */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">BizDeedz</h3>
              <div className="space-y-2">
                {dashboard?.ideas_pipeline
                  ?.filter((item) => item.lane === 'bizdeedz')
                  .map((item) => (
                    <div key={`${item.lane}-${item.status}`} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium text-gray-700 capitalize">{item.status}</span>
                      <span className="text-sm font-bold text-gray-900">{item.idea_count || 0}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Turea Lane */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Turea</h3>
              <div className="space-y-2">
                {dashboard?.ideas_pipeline
                  ?.filter((item) => item.lane === 'turea')
                  .map((item) => (
                    <div key={`${item.lane}-${item.status}`} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium text-gray-700 capitalize">{item.status}</span>
                      <span className="text-sm font-bold text-gray-900">{item.idea_count || 0}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Content */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Top Performing Content</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lane
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hook
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversions
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Calls
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboard?.top_performing && dashboard.top_performing.length > 0 ? (
                dashboard.top_performing.map((item: any) => (
                  <tr key={item.draft_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.platform}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.lane}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                      {item.hook_1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-gray-900">
                      {Math.round(item.performance_score || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-semibold">
                      {item.conversions || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600 font-semibold">
                      {item.calls || 0}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No performance data available yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/content/ideas')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
        >
          Manage Ideas
        </button>
        <button
          onClick={() => navigate('/content/review-queue')}
          className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 font-medium"
        >
          Review Drafts
        </button>
        <button
          onClick={() => navigate('/content/calendar')}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
        >
          Schedule Content
        </button>
      </div>
    </div>
  );
}

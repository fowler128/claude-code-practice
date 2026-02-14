import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentOpsApi } from '../services/api';
import type { ContentIdea, BrandLane, ContentIdeaStatus } from '@shared/types';

export default function ContentIdeaBankPage() {
  const queryClient = useQueryClient();
  const [selectedLane, setSelectedLane] = useState<BrandLane | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<ContentIdeaStatus | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<ContentIdea | null>(null);

  const { data: ideas, isLoading } = useQuery<ContentIdea[]>({
    queryKey: ['content-ideas', selectedLane, selectedStatus],
    queryFn: () => {
      const params: any = {};
      if (selectedLane !== 'all') params.lane = selectedLane;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      return contentOpsApi.getIdeas(params);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (ideaId: string) => contentOpsApi.approveIdea(ideaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-ideas'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ideaId: string) => contentOpsApi.deleteIdea(ideaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-ideas'] });
    },
  });

  const getStatusBadgeColor = (status: ContentIdeaStatus) => {
    const colors: Record<ContentIdeaStatus, string> = {
      captured: 'bg-gray-100 text-gray-800',
      approved: 'bg-green-100 text-green-800',
      drafted: 'bg-blue-100 text-blue-800',
      scheduled: 'bg-purple-100 text-purple-800',
      published: 'bg-indigo-100 text-indigo-800',
      archived: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Idea Bank</h1>
        <p className="text-gray-600 mt-1">Content ideas with hooks, mechanisms, and principles</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand Lane</label>
            <select
              value={selectedLane}
              onChange={(e) => setSelectedLane(e.target.value as BrandLane | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Lanes</option>
              <option value="bizdeedz">BizDeedz</option>
              <option value="turea">Turea</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as ContentIdeaStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="captured">Captured</option>
              <option value="approved">Approved</option>
              <option value="drafted">Drafted</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="ml-auto">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
            >
              + New Idea
            </button>
          </div>
        </div>
      </div>

      {/* Ideas Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading ideas...</div>
        </div>
      ) : ideas && ideas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ideas.map((idea) => (
            <div key={idea.idea_id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getStatusBadgeColor(idea.status)}`}>
                    {idea.status}
                  </span>
                  <span className="ml-2 inline-block px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                    {idea.lane}
                  </span>
                </div>
              </div>

              {idea.sku && (
                <div className="text-xs text-gray-500 mb-2">SKU: {idea.sku}</div>
              )}

              <div className="mb-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Hook 1:</h3>
                <p className="text-sm text-gray-900">{idea.hook_1}</p>
              </div>

              {idea.hook_2 && (
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Hook 2:</h3>
                  <p className="text-sm text-gray-900">{idea.hook_2}</p>
                </div>
              )}

              {idea.mechanism && (
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Mechanism:</h3>
                  <p className="text-sm text-gray-600">{idea.mechanism}</p>
                </div>
              )}

              {idea.principle && (
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Principle:</h3>
                  <p className="text-sm text-gray-600">{idea.principle}</p>
                </div>
              )}

              {idea.tags && idea.tags.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {idea.tags.map((tag, idx) => (
                    <span key={idx} className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2 mt-4">
                {idea.status === 'captured' && (
                  <button
                    onClick={() => approveMutation.mutate(idea.idea_id)}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
                  >
                    Approve
                  </button>
                )}
                <button
                  onClick={() => setSelectedIdea(idea)}
                  className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200"
                >
                  View
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this idea?')) {
                      deleteMutation.mutate(idea.idea_id);
                    }
                  }}
                  className="bg-red-100 text-red-700 px-3 py-2 rounded text-sm hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No ideas found with the selected filters</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Create Your First Idea
          </button>
        </div>
      )}

      {/* Create Modal Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Create New Idea</h2>
            <p className="text-gray-600 mb-4">
              Idea creation form coming soon. For now, use the API directly.
            </p>
            <button
              onClick={() => setShowCreateModal(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* View Modal Placeholder */}
      {selectedIdea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Idea Details</h2>
            <div className="space-y-4">
              <div>
                <strong>Lane:</strong> {selectedIdea.lane}
              </div>
              <div>
                <strong>Status:</strong> {selectedIdea.status}
              </div>
              {selectedIdea.sku && (
                <div>
                  <strong>SKU:</strong> {selectedIdea.sku}
                </div>
              )}
              <div>
                <strong>Hook 1:</strong> {selectedIdea.hook_1}
              </div>
              {selectedIdea.hook_2 && (
                <div>
                  <strong>Hook 2:</strong> {selectedIdea.hook_2}
                </div>
              )}
              {selectedIdea.mechanism && (
                <div>
                  <strong>Mechanism:</strong> {selectedIdea.mechanism}
                </div>
              )}
              {selectedIdea.principle && (
                <div>
                  <strong>Principle:</strong> {selectedIdea.principle}
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedIdea(null)}
              className="mt-6 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

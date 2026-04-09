import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tantml:react-query';
import { contentOpsApi } from '../services/api';
import type { ContentReviewQueueItem, UpdateContentDraftQARequest } from '@shared/types';

export default function ContentReviewQueuePage() {
  const queryClient = useQueryClient();
  const [selectedDraft, setSelectedDraft] = useState<ContentReviewQueueItem | null>(null);
  const [qaState, setQaState] = useState({
    qa_principle: false,
    qa_mechanism: false,
    qa_cta: false,
    qa_audience: false,
    review_notes: '',
  });

  const { data: reviewQueue, isLoading } = useQuery<ContentReviewQueueItem[]>({
    queryKey: ['content-review-queue'],
    queryFn: () => contentOpsApi.getReviewQueue(),
  });

  const updateQAMutation = useMutation({
    mutationFn: ({ draftId, data }: { draftId: string; data: UpdateContentDraftQARequest }) =>
      contentOpsApi.updateDraftQA(draftId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-review-queue'] });
      setSelectedDraft(null);
    },
  });

  const handleReviewDraft = (draft: ContentReviewQueueItem) => {
    setSelectedDraft(draft);
    setQaState({
      qa_principle: draft.qa_principle || false,
      qa_mechanism: draft.qa_mechanism || false,
      qa_cta: draft.qa_cta || false,
      qa_audience: draft.qa_audience || false,
      review_notes: '',
    });
  };

  const handleSubmitReview = () => {
    if (!selectedDraft) return;

    updateQAMutation.mutate({
      draftId: selectedDraft.draft_id,
      data: qaState,
    });
  };

  const allGatesPassed = qaState.qa_principle && qaState.qa_mechanism && qaState.qa_cta && qaState.qa_audience;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Review Queue</h1>
        <p className="text-gray-600 mt-1">4-Gate QA System: Principle • Mechanism • CTA • Audience</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading review queue...</div>
        </div>
      ) : reviewQueue && reviewQueue.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lane
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Principle
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mechanism
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CTA
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Audience
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reviewQueue.map((item) => (
                <tr key={item.draft_id} className={item.qa_passed ? 'bg-green-50' : 'bg-white'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.lane}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.platform}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {item.qa_principle ? (
                      <span className="text-green-600 text-xl">✓</span>
                    ) : (
                      <span className="text-red-600 text-xl">✗</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {item.qa_mechanism ? (
                      <span className="text-green-600 text-xl">✓</span>
                    ) : (
                      <span className="text-red-600 text-xl">✗</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {item.qa_cta ? (
                      <span className="text-green-600 text-xl">✓</span>
                    ) : (
                      <span className="text-red-600 text-xl">✗</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {item.qa_audience ? (
                      <span className="text-green-600 text-xl">✓</span>
                    ) : (
                      <span className="text-red-600 text-xl">✗</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {item.qa_passed ? (
                      <span className="inline-block px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">
                        PASSED
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">
                        NEEDS REVIEW
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleReviewDraft(item)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No drafts in review queue</p>
        </div>
      )}

      {/* Review Modal */}
      {selectedDraft && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Review Draft</h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedDraft.lane} • {selectedDraft.platform}
              </p>
            </div>

            <div className="p-6">
              {/* Draft Preview (placeholder) */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Draft Content</h3>
                <p className="text-sm text-gray-600 italic">
                  [Draft text would appear here - needs to be fetched separately]
                </p>
              </div>

              {/* QA Gates */}
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Quality Gates</h3>

                {/* Gate 1: Principle */}
                <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <input
                    type="checkbox"
                    checked={qaState.qa_principle}
                    onChange={(e) => setQaState({ ...qaState, qa_principle: e.target.checked })}
                    className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-semibold text-gray-900">
                      Gate 1: Teaches a Principle/Framework
                    </span>
                    <span className="block text-sm text-gray-600 mt-1">
                      Does this content teach a clear principle, framework, or concept?
                    </span>
                  </div>
                </label>

                {/* Gate 2: Mechanism */}
                <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <input
                    type="checkbox"
                    checked={qaState.qa_mechanism}
                    onChange={(e) => setQaState({ ...qaState, qa_mechanism: e.target.checked })}
                    className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-semibold text-gray-900">
                      Gate 2: Explains HOW It Works
                    </span>
                    <span className="block text-sm text-gray-600 mt-1">
                      Does this content explain the mechanism or process behind the concept?
                    </span>
                  </div>
                </label>

                {/* Gate 3: CTA */}
                <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <input
                    type="checkbox"
                    checked={qaState.qa_cta}
                    onChange={(e) => setQaState({ ...qaState, qa_cta: e.target.checked })}
                    className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-semibold text-gray-900">
                      Gate 3: Clear Call-to-Action
                    </span>
                    <span className="block text-sm text-gray-600 mt-1">
                      Does this content have a clear, compelling call-to-action?
                    </span>
                  </div>
                </label>

                {/* Gate 4: Audience */}
                <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <input
                    type="checkbox"
                    checked={qaState.qa_audience}
                    onChange={(e) => setQaState({ ...qaState, qa_audience: e.target.checked })}
                    className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-semibold text-gray-900">
                      Gate 4: Targeted to Right Audience
                    </span>
                    <span className="block text-sm text-gray-600 mt-1">
                      Is this content properly targeted to the intended audience?
                    </span>
                  </div>
                </label>
              </div>

              {/* Pass/Fail Indicator */}
              {allGatesPassed && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-green-600 text-2xl mr-3">✓</span>
                    <div>
                      <p className="text-sm font-semibold text-green-900">All Quality Gates Passed</p>
                      <p className="text-sm text-green-700">This draft meets all quality criteria</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Review Notes */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Review Notes (Optional)
                </label>
                <textarea
                  value={qaState.review_notes}
                  onChange={(e) => setQaState({ ...qaState, review_notes: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any notes about this review..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleSubmitReview}
                  disabled={updateQAMutation.isPending}
                  className={`flex-1 px-6 py-3 rounded-lg font-medium ${
                    allGatesPassed
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {updateQAMutation.isPending ? 'Saving...' : 'Submit Review'}
                </button>
                <button
                  onClick={() => setSelectedDraft(null)}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

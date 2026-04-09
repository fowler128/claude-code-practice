import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { mattersApi, controlledListsApi } from '../services/api';
import { X, AlertCircle } from 'lucide-react';
import type { CreateMatterRequest } from '@shared/types';

interface CreateMatterModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateMatterModal({ onClose, onSuccess }: CreateMatterModalProps) {
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CreateMatterRequest>();

  const practiceAreaId = watch('practice_area_id');

  const { data: practiceAreas } = useQuery({
    queryKey: ['practice-areas'],
    queryFn: controlledListsApi.getPracticeAreas,
  });

  const { data: matterTypes } = useQuery({
    queryKey: ['matter-types', practiceAreaId],
    queryFn: () => controlledListsApi.getMatterTypes(practiceAreaId),
    enabled: !!practiceAreaId,
  });

  const createMutation = useMutation({
    mutationFn: mattersApi.create,
    onSuccess: () => {
      onSuccess();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to create matter');
    },
  });

  const onSubmit = (data: CreateMatterRequest) => {
    setError(null);
    createMutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Create New Matter</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="client_name" className="label">
                Client Name *
              </label>
              <input
                id="client_name"
                type="text"
                {...register('client_name', { required: 'Client name is required' })}
                className="input"
                placeholder="John Doe"
              />
              {errors.client_name && (
                <p className="mt-1 text-sm text-red-600">{errors.client_name.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="client_entity" className="label">
                Client Entity (optional)
              </label>
              <input
                id="client_entity"
                type="text"
                {...register('client_entity')}
                className="input"
                placeholder="Company name or entity"
              />
            </div>

            <div>
              <label htmlFor="practice_area_id" className="label">
                Practice Area *
              </label>
              <select
                id="practice_area_id"
                {...register('practice_area_id', { required: 'Practice area is required' })}
                className="input"
              >
                <option value="">Select practice area</option>
                {practiceAreas?.map((pa: any) => (
                  <option key={pa.practice_area_id} value={pa.practice_area_id}>
                    {pa.name}
                  </option>
                ))}
              </select>
              {errors.practice_area_id && (
                <p className="mt-1 text-sm text-red-600">{errors.practice_area_id.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="matter_type_id" className="label">
                Matter Type *
              </label>
              <select
                id="matter_type_id"
                {...register('matter_type_id', { required: 'Matter type is required' })}
                className="input"
                disabled={!practiceAreaId}
              >
                <option value="">Select matter type</option>
                {matterTypes?.map((mt: any) => (
                  <option key={mt.matter_type_id} value={mt.matter_type_id}>
                    {mt.name}
                  </option>
                ))}
              </select>
              {errors.matter_type_id && (
                <p className="mt-1 text-sm text-red-600">{errors.matter_type_id.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="priority" className="label">
                Priority *
              </label>
              <select
                id="priority"
                {...register('priority', { required: 'Priority is required' })}
                className="input"
                defaultValue="medium"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label htmlFor="billing_type" className="label">
                Billing Type
              </label>
              <select
                id="billing_type"
                {...register('billing_type')}
                className="input"
              >
                <option value="">Select billing type</option>
                <option value="hourly">Hourly</option>
                <option value="fixed">Fixed Fee</option>
                <option value="subscription">Subscription</option>
                <option value="contingency">Contingency</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn btn-primary"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Matter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

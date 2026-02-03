import React, { useId } from 'react';
import { Building2 } from 'lucide-react';
import { Input, Select } from '../ui';
import {
  type FirmProfile,
  type PracticeArea,
  type PracticeManagementTool,
  type OperationsMaturity,
  PRACTICE_AREA_LABELS,
  PRACTICE_MANAGEMENT_LABELS,
  OPERATIONS_MATURITY_INFO,
} from '../../types/firm.types';

/**
 * Local type for form state that extends FirmProfile with required fields
 */
export interface FirmProfileFormData {
  firmName: string;
  practiceAreas: PracticeArea[];
  attorneyCount: number;
  paralegalCount: number;
  practiceManagement: PracticeManagementTool;
  currentOperationsMaturity: OperationsMaturity;
}

export interface FirmProfileFormProps {
  /** Current profile data (null if not yet started) */
  profile: FirmProfileFormData | null;
  /** Callback when any field changes */
  onChange: (profile: FirmProfileFormData) => void;
}

/**
 * Default values for a new firm profile
 */
const DEFAULT_PROFILE: FirmProfileFormData = {
  firmName: '',
  practiceAreas: [],
  attorneyCount: 1,
  paralegalCount: 0,
  practiceManagement: 'none',
  currentOperationsMaturity: 'informal',
};

/**
 * FirmProfileForm collects basic information about the law firm
 * before beginning the assessment.
 */
export const FirmProfileForm: React.FC<FirmProfileFormProps> = ({
  profile,
  onChange,
}) => {
  const practiceAreasId = useId();
  const maturityId = useId();

  // Use profile or default values
  const currentProfile = profile || DEFAULT_PROFILE;

  // Validation state
  const errors = {
    firmName: !currentProfile.firmName.trim() ? 'Firm name is required' : undefined,
    practiceAreas:
      currentProfile.practiceAreas.length === 0
        ? 'Select at least one practice area'
        : undefined,
  };

  const handleFieldChange = <K extends keyof FirmProfileFormData>(
    field: K,
    value: FirmProfileFormData[K]
  ) => {
    onChange({
      ...currentProfile,
      [field]: value,
    });
  };

  const handlePracticeAreaToggle = (area: PracticeArea) => {
    const currentAreas = currentProfile.practiceAreas;
    const newAreas = currentAreas.includes(area)
      ? currentAreas.filter((a) => a !== area)
      : [...currentAreas, area];
    handleFieldChange('practiceAreas', newAreas);
  };

  // Practice management options
  const practiceManagementOptions = Object.entries(PRACTICE_MANAGEMENT_LABELS).map(
    ([value, label]) => ({ value, label })
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary-600" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Firm Profile</h2>
            <p className="mt-1 text-sm text-gray-600">
              Tell us about your firm so we can tailor the assessment and recommendations.
            </p>
          </div>
        </div>
      </div>

      {/* Form fields */}
      <div className="space-y-6">
        {/* Firm Name */}
        <Input
          label="Firm Name"
          value={currentProfile.firmName}
          onChange={(e) => handleFieldChange('firmName', e.target.value)}
          error={errors.firmName}
          placeholder="Enter your firm's name"
          required
        />

        {/* Practice Areas - Multi-select checkboxes */}
        <fieldset>
          <legend
            id={practiceAreasId}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Practice Areas
            <span className="text-red-500 ml-1" aria-hidden="true">
              *
            </span>
          </legend>
          <div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
            role="group"
            aria-labelledby={practiceAreasId}
            aria-describedby={errors.practiceAreas ? `${practiceAreasId}-error` : undefined}
          >
            {(Object.entries(PRACTICE_AREA_LABELS) as [PracticeArea, string][]).map(
              ([value, label]) => {
                const isChecked = currentProfile.practiceAreas.includes(value);
                return (
                  <label
                    key={value}
                    className={`
                      flex items-center gap-2 p-3 rounded-lg border cursor-pointer
                      transition-all duration-200
                      ${
                        isChecked
                          ? 'bg-primary-50 border-primary-500 text-primary-700'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }
                    `.trim()}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handlePracticeAreaToggle(value)}
                      className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium">{label}</span>
                  </label>
                );
              }
            )}
          </div>
          {errors.practiceAreas && (
            <p
              id={`${practiceAreasId}-error`}
              className="mt-2 text-sm text-red-600"
              role="alert"
            >
              {errors.practiceAreas}
            </p>
          )}
        </fieldset>

        {/* Staff counts - side by side on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Number of Attorneys"
            type="number"
            min={1}
            value={currentProfile.attorneyCount}
            onChange={(e) =>
              handleFieldChange('attorneyCount', Math.max(1, parseInt(e.target.value) || 1))
            }
            helpText="Partners, associates, and of counsel"
          />
          <Input
            label="Number of Paralegals"
            type="number"
            min={0}
            value={currentProfile.paralegalCount}
            onChange={(e) =>
              handleFieldChange('paralegalCount', Math.max(0, parseInt(e.target.value) || 0))
            }
            helpText="Including legal assistants"
          />
        </div>

        {/* Practice Management Tool */}
        <Select
          label="Practice Management Tool"
          options={practiceManagementOptions}
          value={currentProfile.practiceManagement}
          onChange={(e) =>
            handleFieldChange('practiceManagement', e.target.value as PracticeManagementTool)
          }
          helpText="The primary software your firm uses to manage cases and clients"
        />

        {/* Operations Maturity - Radio buttons */}
        <fieldset>
          <legend
            id={maturityId}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Current Operations Maturity
          </legend>
          <p className="text-sm text-gray-500 mb-3">
            How would you describe your firm's current operational processes?
          </p>
          <div
            className="space-y-3"
            role="radiogroup"
            aria-labelledby={maturityId}
          >
            {(
              Object.entries(OPERATIONS_MATURITY_INFO) as [
                OperationsMaturity,
                { label: string; description: string }
              ][]
            ).map(([value, { label, description }]) => {
              const isSelected = currentProfile.currentOperationsMaturity === value;
              return (
                <label
                  key={value}
                  className={`
                    flex items-start gap-3 p-3 rounded-lg border cursor-pointer
                    transition-all duration-200
                    ${
                      isSelected
                        ? 'bg-primary-50 border-primary-500'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }
                  `.trim()}
                >
                  <input
                    type="radio"
                    name="operations-maturity"
                    value={value}
                    checked={isSelected}
                    onChange={() => handleFieldChange('currentOperationsMaturity', value)}
                    className="mt-0.5 h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  <div>
                    <span
                      className={`text-sm font-medium ${
                        isSelected ? 'text-primary-700' : 'text-gray-900'
                      }`}
                    >
                      {label}
                    </span>
                    <p
                      className={`text-sm ${
                        isSelected ? 'text-primary-600' : 'text-gray-500'
                      }`}
                    >
                      {description}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>
    </div>
  );
};

export default FirmProfileForm;

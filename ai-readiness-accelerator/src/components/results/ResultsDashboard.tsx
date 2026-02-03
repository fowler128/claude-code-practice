/**
 * ResultsDashboard Component
 *
 * Main container for the assessment results with tabbed navigation
 * between Scorecard, ROI Calculator, and Roadmap views.
 */

import React, { memo, useState, useCallback, useMemo } from 'react';
import { RefreshCw, RotateCcw, BarChart3, Calculator, Map } from 'lucide-react';
import type { PillarScores, ExecutiveSummary as ExecutiveSummaryType, Roadmap } from '../../types/results.types';
import type { FirmProfile } from '../../types/firm.types';
import type { ROIInputs, ROIBreakdown } from '../../types/roi.types';
import { Button } from '../ui';
import { ScoreSummaryCard } from './ScoreSummaryCard';
import { RadarChartSection, type PillarScoreData } from './RadarChartSection';
import { ExecutiveSummary } from './ExecutiveSummary';
import { ROICalculator } from './ROICalculator';
import { RoadmapSection, type Blocker } from './RoadmapSection';

/**
 * Tab identifiers
 */
type TabId = 'scorecard' | 'roi' | 'roadmap';

/**
 * Tab configuration
 */
interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

/**
 * Available tabs
 */
const TABS: TabConfig[] = [
  { id: 'scorecard', label: 'Scorecard', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'roi', label: 'ROI Calculator', icon: <Calculator className="w-4 h-4" /> },
  { id: 'roadmap', label: 'Roadmap', icon: <Map className="w-4 h-4" /> },
];

export interface ResultsDashboardProps {
  /** Assessment scores data */
  scores: PillarScores;
  /** Firm profile information */
  firmProfile: FirmProfile;
  /** Executive summary data (null if not loaded) */
  summary: ExecutiveSummaryType | null;
  /** Whether the summary is being loaded */
  summaryLoading: boolean;
  /** Error message for summary generation */
  summaryError: string | null;
  /** ROI calculator input values */
  roiInputs: ROIInputs;
  /** Calculated ROI projections */
  roiProjections: ROIBreakdown;
  /** Implementation roadmap */
  roadmap: Roadmap | null;
  /** Identified blockers from assessment */
  blockers: Blocker[];
  /** Callback when ROI input changes */
  onRoiInputChange: (key: keyof ROIInputs, value: number) => void;
  /** Callback to regenerate executive summary */
  onRegenerateSummary: () => void;
  /** Callback to reset the assessment */
  onReset: () => void;
  /** Callback to book a consultation call */
  onBookCall: () => void;
}

/**
 * Tab button component with proper ARIA attributes
 */
const TabButton: React.FC<{
  tab: TabConfig;
  isSelected: boolean;
  onClick: () => void;
}> = memo(({ tab, isSelected, onClick }) => (
  <button
    role="tab"
    id={`tab-${tab.id}`}
    aria-selected={isSelected}
    aria-controls={`tabpanel-${tab.id}`}
    tabIndex={isSelected ? 0 : -1}
    onClick={onClick}
    className={`
      flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg
      transition-colors duration-200 focus:outline-none focus:ring-2
      focus:ring-indigo-500 focus:ring-offset-2
      ${
        isSelected
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }
    `}
  >
    <span aria-hidden="true">{tab.icon}</span>
    {tab.label}
  </button>
));

TabButton.displayName = 'TabButton';

/**
 * ResultsDashboard is the main container for assessment results.
 * Features tabbed navigation between Scorecard, ROI Calculator, and Roadmap views.
 * Includes proper accessibility with ARIA tab pattern implementation.
 */
export const ResultsDashboard: React.FC<ResultsDashboardProps> = memo(({
  scores,
  firmProfile,
  summary,
  summaryLoading,
  summaryError,
  roiInputs,
  roiProjections,
  roadmap,
  blockers,
  onRoiInputChange,
  onRegenerateSummary,
  onReset,
  onBookCall,
}) => {
  // Track active tab
  const [activeTab, setActiveTab] = useState<TabId>('scorecard');

  // Handle tab selection
  const handleTabSelect = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
  }, []);

  // Handle keyboard navigation for tabs
  const handleTabKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = TABS.findIndex(t => t.id === activeTab);
      let newIndex = currentIndex;

      if (event.key === 'ArrowRight') {
        newIndex = (currentIndex + 1) % TABS.length;
      } else if (event.key === 'ArrowLeft') {
        newIndex = (currentIndex - 1 + TABS.length) % TABS.length;
      } else if (event.key === 'Home') {
        newIndex = 0;
      } else if (event.key === 'End') {
        newIndex = TABS.length - 1;
      } else {
        return;
      }

      event.preventDefault();
      setActiveTab(TABS[newIndex].id);

      // Focus the new tab button
      const tabButton = document.getElementById(`tab-${TABS[newIndex].id}`);
      tabButton?.focus();
    },
    [activeTab]
  );

  // Transform pillar scores for radar chart
  const pillarScoreData: PillarScoreData[] = useMemo(() => {
    return scores.pillars.map(pillar => ({
      name: pillar.pillarName,
      score: Math.round((pillar.score / pillar.maxScore) * 100),
    }));
  }, [scores.pillars]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Assessment Results
          </h1>
          <p className="text-gray-600 mt-1">
            Review your AI readiness assessment for {firmProfile.firmName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRegenerateSummary}
            disabled={summaryLoading}
            aria-label="Regenerate executive summary"
          >
            <RefreshCw
              className={`w-4 h-4 mr-1 ${summaryLoading ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            Refresh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onReset}
            aria-label="Start a new assessment"
          >
            <RotateCcw className="w-4 h-4 mr-1" aria-hidden="true" />
            New Assessment
          </Button>
        </div>
      </div>

      {/* Tab navigation */}
      <div
        role="tablist"
        aria-label="Results sections"
        className="flex flex-wrap gap-2 mb-6 p-1 bg-gray-100 rounded-lg w-fit"
        onKeyDown={handleTabKeyDown}
      >
        {TABS.map(tab => (
          <TabButton
            key={tab.id}
            tab={tab}
            isSelected={activeTab === tab.id}
            onClick={() => handleTabSelect(tab.id)}
          />
        ))}
      </div>

      {/* Tab panels */}
      <div className="min-h-[600px]">
        {/* Scorecard Tab */}
        <div
          role="tabpanel"
          id="tabpanel-scorecard"
          aria-labelledby="tab-scorecard"
          hidden={activeTab !== 'scorecard'}
          tabIndex={0}
        >
          {activeTab === 'scorecard' && (
            <div className="space-y-6">
              {/* Score summary and radar chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ScoreSummaryCard
                  overallScore={scores.overall}
                  readinessLevel={scores.readinessLevel}
                  firmName={firmProfile.firmName}
                />
                <RadarChartSection pillarScores={pillarScoreData} />
              </div>

              {/* Executive summary */}
              <ExecutiveSummary
                summary={summary}
                loading={summaryLoading}
                error={summaryError}
                onRegenerate={onRegenerateSummary}
              />
            </div>
          )}
        </div>

        {/* ROI Calculator Tab */}
        <div
          role="tabpanel"
          id="tabpanel-roi"
          aria-labelledby="tab-roi"
          hidden={activeTab !== 'roi'}
          tabIndex={0}
        >
          {activeTab === 'roi' && (
            <ROICalculator
              inputs={roiInputs}
              projections={roiProjections}
              onInputChange={onRoiInputChange}
            />
          )}
        </div>

        {/* Roadmap Tab */}
        <div
          role="tabpanel"
          id="tabpanel-roadmap"
          aria-labelledby="tab-roadmap"
          hidden={activeTab !== 'roadmap'}
          tabIndex={0}
        >
          {activeTab === 'roadmap' && (
            <RoadmapSection
              roadmap={roadmap}
              blockers={blockers}
              onBookCall={onBookCall}
            />
          )}
        </div>
      </div>
    </div>
  );
});

ResultsDashboard.displayName = 'ResultsDashboard';

export default ResultsDashboard;

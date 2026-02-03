/**
 * Results Dashboard Components
 *
 * Export all components related to the assessment results dashboard,
 * including score display, charts, ROI calculator, and roadmap views.
 */

// Main dashboard container
export { ResultsDashboard, type ResultsDashboardProps } from './ResultsDashboard';

// Score display components
export { ScoreSummaryCard, type ScoreSummaryCardProps } from './ScoreSummaryCard';
export {
  RadarChartSection,
  type RadarChartSectionProps,
  type PillarScoreData,
} from './RadarChartSection';

// Executive summary
export { ExecutiveSummary, type ExecutiveSummaryProps } from './ExecutiveSummary';

// ROI calculator
export { ROICalculator, type ROICalculatorProps } from './ROICalculator';

// Roadmap section
export {
  RoadmapSection,
  type RoadmapSectionProps,
  type Blocker,
} from './RoadmapSection';

// Call-to-action
export { BookCallCTA, type BookCallCTAProps } from './BookCallCTA';

import { useState, useCallback } from 'react';
import { Header, Footer } from './components/layout';
import { ErrorBoundary } from './components/shared';
import { LandingView, AssessmentView, ResultsView } from './views';
import type { AssessmentResponses } from './types/assessment.types';
import type { FirmProfile } from './types/firm.types';

/**
 * View state for the application
 * - landing: Initial landing page with value proposition
 * - assessment: Multi-step assessment questionnaire
 * - results: Assessment results and recommendations
 */
type ViewState = 'landing' | 'assessment' | 'results';

/**
 * Data collected during the assessment process
 */
interface AssessmentData {
  responses: AssessmentResponses;
  firmProfile: FirmProfile;
}

/**
 * Main application component for the AI Readiness Accelerator
 * Manages view routing and assessment state
 */
function App() {
  // Current view state
  const [currentView, setCurrentView] = useState<ViewState>('landing');

  // Assessment data collected during the assessment process
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);

  /**
   * Navigate to the assessment view
   */
  const handleStartAssessment = useCallback(() => {
    setCurrentView('assessment');
  }, []);

  /**
   * Handle assessment completion - save data and navigate to results
   */
  const handleAssessmentComplete = useCallback(
    (data: { responses: AssessmentResponses; firmProfile: FirmProfile }) => {
      setAssessmentData(data);
      setCurrentView('results');
    },
    []
  );

  /**
   * Reset application state and return to landing page
   */
  const handleReset = useCallback(() => {
    setAssessmentData(null);
    setCurrentView('landing');
  }, []);

  /**
   * Navigate back from assessment to landing page
   */
  const handleBack = useCallback(() => {
    setCurrentView('landing');
  }, []);

  /**
   * Render the appropriate view based on current state
   */
  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingView onStartAssessment={handleStartAssessment} />;

      case 'assessment':
        return (
          <AssessmentView
            onComplete={handleAssessmentComplete}
            onBack={handleBack}
          />
        );

      case 'results':
        if (!assessmentData) {
          // If somehow we're on results without data, go back to landing
          setCurrentView('landing');
          return null;
        }
        return (
          <ResultsView
            assessmentData={assessmentData}
            onReset={handleReset}
          />
        );

      default:
        return <LandingView onStartAssessment={handleStartAssessment} />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-slate-50">
        {/* Header - always visible, shows reset button when not on landing */}
        <Header
          showReset={currentView !== 'landing'}
          onReset={handleReset}
        />

        {/* Main content area */}
        <main
          className={`flex-grow ${
            currentView !== 'landing' ? 'bg-slate-100' : ''
          }`}
        >
          {renderView()}
        </main>

        {/* Footer - always visible */}
        <Footer />
      </div>
    </ErrorBoundary>
  );
}

export default App;

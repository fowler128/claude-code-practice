import React from 'react';
import { Hero } from '../components/landing/Hero';
import { ValueProposition } from '../components/landing/ValueProposition';
import { PillarOverview } from '../components/landing/PillarOverview';
import { CTASection } from '../components/landing/CTASection';

export interface LandingViewProps {
  /** Callback when user starts the assessment */
  onStartAssessment: () => void;
}

/**
 * Landing page view that composes all landing page sections.
 * Includes Hero, ValueProposition, PillarOverview, and CTASection components.
 */
export const LandingView: React.FC<LandingViewProps> = ({ onStartAssessment }) => {
  return (
    <div className="min-h-screen">
      {/* Hero section with main CTA */}
      <Hero onStartAssessment={onStartAssessment} />

      {/* Value proposition - what users will receive */}
      <ValueProposition />

      {/* Pillar overview - what we assess */}
      <PillarOverview />

      {/* Final CTA section */}
      <CTASection onStartAssessment={onStartAssessment} />
    </div>
  );
};

export default LandingView;

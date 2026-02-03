import React from 'react';
import { Button } from '../ui/Button';

export interface HeroProps {
  /** Callback when the Start Assessment button is clicked */
  onStartAssessment: () => void;
}

/**
 * Hero section for the landing page.
 * Features a gradient background, headline, subheadline, CTA button, and badge.
 */
export const Hero: React.FC<HeroProps> = ({ onStartAssessment }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div className="text-center">
          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
            Is Your Firm AI-Ready?
          </h1>

          {/* Subheadline */}
          <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-indigo-100 leading-relaxed">
            Find out in 10 minutes. Get a personalized readiness scorecard and 90-day roadmap.
          </p>

          {/* CTA Button */}
          <div className="mt-10">
            <Button
              onClick={onStartAssessment}
              size="lg"
              className="bg-white text-indigo-700 hover:bg-indigo-50 focus:ring-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Start Free Assessment
            </Button>
          </div>

          {/* Trust badge */}
          <div className="mt-6">
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm text-white/90">
              Takes 10 minutes &bull; No signup required
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

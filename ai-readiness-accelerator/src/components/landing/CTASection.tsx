import React from 'react';
import { Button } from '../ui/Button';

export interface CTASectionProps {
  /** Callback when the Start Assessment button is clicked */
  onStartAssessment: () => void;
}

/**
 * Call-to-action section with dark background.
 * Features headline, subtext listing practice areas, CTA button, and trust indicators.
 */
export const CTASection: React.FC<CTASectionProps> = ({ onStartAssessment }) => {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Built for Law Firms
          </h2>

          {/* Practice areas subtext */}
          <p className="mt-4 text-lg text-gray-300">
            Bankruptcy, family law, estate planning, civil litigation
          </p>

          {/* CTA Button */}
          <div className="mt-10">
            <Button
              onClick={onStartAssessment}
              variant="secondary"
              size="lg"
              className="bg-white text-gray-900 hover:bg-gray-100 border-transparent"
            >
              Start Your Assessment
            </Button>
          </div>

          {/* Trust indicators */}
          <p className="mt-6 text-sm text-gray-400">
            No signup &bull; Free &bull; 10 minutes
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;

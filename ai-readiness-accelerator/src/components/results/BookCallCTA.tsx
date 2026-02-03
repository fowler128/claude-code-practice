/**
 * BookCallCTA Component
 *
 * Call-to-action component for booking a diagnostic consultation call.
 * Features a dark gradient background with prominent CTA button.
 */

import React, { memo } from 'react';
import { Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../ui';

export interface BookCallCTAProps {
  /** Callback when the user clicks to book a call */
  onBookCall: () => void;
}

/**
 * BookCallCTA displays a prominent call-to-action for booking
 * a diagnostic consultation. Features a dark gradient background,
 * compelling headline, and clear CTA button.
 */
export const BookCallCTA: React.FC<BookCallCTAProps> = memo(({ onBookCall }) => {
  return (
    <div
      className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 p-6 sm:p-8"
      role="region"
      aria-label="Book a consultation call"
    >
      {/* Background decorative elements */}
      <div
        className="absolute inset-0 opacity-10"
        aria-hidden="true"
      >
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-purple-400 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Icon badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-sm font-medium mb-4"
          aria-hidden="true"
        >
          <Sparkles className="w-4 h-4" />
          Free Consultation
        </div>

        {/* Headline */}
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
          Ready to execute this roadmap?
        </h3>

        {/* Description */}
        <p className="text-indigo-200 mb-6 max-w-xl">
          Schedule a free 30-minute diagnostic call with our AI implementation
          specialists. We'll review your assessment results, discuss your
          specific challenges, and help you prioritize your next steps.
        </p>

        {/* Benefits list */}
        <ul className="space-y-2 mb-6" role="list">
          {[
            'Personalized roadmap review',
            'Tool recommendations based on your needs',
            'Implementation timeline planning',
            'Budget and resource guidance',
          ].map((benefit, index) => (
            <li
              key={index}
              className="flex items-center gap-2 text-indigo-100"
            >
              <ArrowRight
                className="w-4 h-4 text-indigo-400 flex-shrink-0"
                aria-hidden="true"
              />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <Button
          onClick={onBookCall}
          size="lg"
          className="bg-white text-indigo-900 hover:bg-indigo-50 focus:ring-white"
          aria-label="Schedule your free diagnostic call"
        >
          <Calendar className="w-5 h-5 mr-2" aria-hidden="true" />
          Book Diagnostic Call
        </Button>

        {/* Reassurance text */}
        <p className="text-xs text-indigo-300 mt-4">
          No commitment required. We'll send you a calendar invite after you submit.
        </p>
      </div>
    </div>
  );
});

BookCallCTA.displayName = 'BookCallCTA';

export default BookCallCTA;

import React from 'react';
import { ClipboardCheck, Target, Map } from 'lucide-react';

interface ValuePropCard {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const valueProps: ValuePropCard[] = [
  {
    icon: <ClipboardCheck className="w-8 h-8" />,
    title: 'AI Readiness Scorecard',
    description: 'Objective baseline across 6 critical dimensions',
  },
  {
    icon: <Target className="w-8 h-8" />,
    title: 'Use-Case Portfolio',
    description: '3-5 AI opportunities ranked by feasibility and ROI',
  },
  {
    icon: <Map className="w-8 h-8" />,
    title: '90-Day Roadmap',
    description: 'Prioritized action plan with governance controls',
  },
];

/**
 * Value proposition section showcasing what users will receive from the assessment.
 * Displays 3 value prop cards in a responsive grid layout.
 */
export const ValueProposition: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section title */}
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            What You'll Get
          </h2>
        </div>

        {/* Value prop cards grid */}
        <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {valueProps.map((prop, index) => (
            <div
              key={index}
              className="relative p-6 sm:p-8 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors duration-200"
            >
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary-100 text-primary-600">
                {prop.icon}
              </div>

              {/* Title */}
              <h3 className="mt-5 text-xl font-semibold text-gray-900">
                {prop.title}
              </h3>

              {/* Description */}
              <p className="mt-3 text-base text-gray-600 leading-relaxed">
                {prop.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValueProposition;

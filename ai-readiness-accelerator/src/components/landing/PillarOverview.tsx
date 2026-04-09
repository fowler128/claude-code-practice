import React from 'react';
import { GitBranch, Database, BookOpen, Wrench, Shield, Users } from 'lucide-react';

interface PillarCard {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const pillars: PillarCard[] = [
  {
    icon: <GitBranch className="w-6 h-6" />,
    title: 'Process Maturity',
    description: 'Intake, drafting, filing workflows',
  },
  {
    icon: <Database className="w-6 h-6" />,
    title: 'Data Quality',
    description: 'Consistency, duplicates, taxonomy',
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: 'Knowledge System',
    description: 'Templates, SOPs, playbooks',
  },
  {
    icon: <Wrench className="w-6 h-6" />,
    title: 'Tooling',
    description: 'Integrations, practice management',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Risk & Governance',
    description: 'Policies, access, audit',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Change Capacity',
    description: 'Adoption, training, accountability',
  },
];

/**
 * Pillar overview section showing the 6 dimensions assessed.
 * Displays pillar cards in a responsive 2x3 grid layout.
 */
export const PillarOverview: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section title */}
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            What We Assess
          </h2>
        </div>

        {/* Pillar cards grid - 2x3 on desktop, stack on mobile */}
        <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((pillar, index) => (
            <div
              key={index}
              className="flex items-start p-5 sm:p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-100 transition-all duration-200"
            >
              {/* Icon */}
              <div className="flex-shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-lg bg-primary-50 text-primary-600">
                {pillar.icon}
              </div>

              {/* Content */}
              <div className="ml-4">
                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900">
                  {pillar.title}
                </h3>

                {/* Description */}
                <p className="mt-1 text-sm text-gray-500">
                  {pillar.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PillarOverview;

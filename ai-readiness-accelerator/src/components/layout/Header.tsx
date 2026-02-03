import React from 'react';
import { BrainCircuit } from 'lucide-react';
import { Button } from '../ui/Button';

export interface HeaderProps {
  /** Whether to show the reset/start over button */
  showReset?: boolean;
  /** Callback when reset button is clicked */
  onReset?: () => void;
}

/**
 * Fixed header component with branding and optional reset button.
 * Features BrainCircuit icon, BizDeedz branding, and "AI Readiness" subtitle.
 */
export const Header: React.FC<HeaderProps> = ({ showReset = false, onReset }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo and branding */}
          <div className="flex items-center space-x-2">
            <BrainCircuit className="w-8 h-8 text-primary-600" />
            <div className="flex items-center">
              <span className="text-xl font-bold text-gray-900">BizDeedz</span>
              <span className="mx-2 text-gray-300">|</span>
              <span className="text-lg text-gray-600">AI Readiness</span>
            </div>
          </div>

          {/* Right: Reset button (conditional) */}
          {showReset && onReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-gray-600 hover:text-gray-900"
            >
              Start Over
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

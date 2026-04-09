import React from 'react';

/**
 * Simple footer component with company branding.
 * Displays BizDeedz company name and tagline in muted text.
 */
export const Footer: React.FC = () => {
  return (
    <footer className="py-8 bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-gray-500">
          BizDeedz, Inc. | Operational Automation for Legal
        </p>
      </div>
    </footer>
  );
};

export default Footer;

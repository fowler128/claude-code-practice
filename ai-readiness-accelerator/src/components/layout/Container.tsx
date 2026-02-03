import React from 'react';

export interface ContainerProps {
  /** Container content */
  children: React.ReactNode;
  /** Container max-width size */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Additional CSS classes */
  className?: string;
}

const sizeClasses: Record<NonNullable<ContainerProps['size']>, string> = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
};

/**
 * Centered container component with configurable max-width.
 * Provides consistent horizontal padding and centers content.
 */
export const Container: React.FC<ContainerProps> = ({
  children,
  size = 'lg',
  className = '',
}) => {
  return (
    <div
      className={`
        mx-auto px-4 sm:px-6 lg:px-8
        ${sizeClasses[size]}
        ${className}
      `.trim()}
    >
      {children}
    </div>
  );
};

export default Container;

import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  color?: string;
}

// Back Arrow Icon
export const BackArrowIcon: React.FC<IconProps> = ({ size = 18, className = '', color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 12H5m0 0l7 7m-7-7l7-7"></path>
  </svg>
);

// Sort Icons
export const SortUnsortedIcon: React.FC<IconProps> = ({ size = 18, className = '', color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 12h18"></path>
    <path d="M3 6h18"></path>
    <path d="M3 18h18"></path>
  </svg>
);

export const SortCompletedTopIcon: React.FC<IconProps> = ({ size = 18, className = '', color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 6h18"></path>
    <path d="M3 12h12"></path>
    <path d="M3 18h6"></path>
    <circle cx="17" cy="15" r="3" fill={color}></circle>
    <path d="m16 14 1 1 2-2" stroke="white" strokeWidth="1.5"></path>
  </svg>
);

export const SortCompletedBottomIcon: React.FC<IconProps> = ({ size = 18, className = '', color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 18h18"></path>
    <path d="M3 12h12"></path>
    <path d="M3 6h6"></path>
    <circle cx="17" cy="9" r="3" fill={color}></circle>
    <path d="m16 8 1 1 2-2" stroke="white" strokeWidth="1.5"></path>
  </svg>
);

// Check/Save Icon
export const CheckIcon: React.FC<IconProps> = ({ size = 18, className = '', color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Replace this with your motion.dev SVG path */}
    <polyline points="20,6 9,17 4,12"></polyline>
  </svg>
);

// Cancel/Close Icon
export const CancelIcon: React.FC<IconProps> = ({ size = 18, className = '', color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Replace this with your motion.dev SVG path */}
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

// Edit Icon
export const EditIcon: React.FC<IconProps> = ({ size = 18, className = '', color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Replace this with your motion.dev SVG path */}
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

// Delete Icon
export const DeleteIcon: React.FC<IconProps> = ({ size = 18, className = '', color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Replace this with your motion.dev SVG path */}
    <polyline points="3,6 5,6 21,6"></polyline>
    <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

// Close Icon (for modals, toasts)
export const CloseIcon: React.FC<IconProps> = ({ size = 18, className = '', color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Replace this with your motion.dev SVG path */}
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
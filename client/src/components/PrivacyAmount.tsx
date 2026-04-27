import { ReactNode } from 'react';
import { usePrivacy } from '../context/PrivacyContext';

export default function PrivacyAmount({ children, className = '' }: { children: ReactNode; className?: string }) {
  const { privacyMode } = usePrivacy();
  return (
    <span className={`${className} transition-all duration-200 ${privacyMode ? 'blur-md select-none' : ''}`}>
      {children}
    </span>
  );
}

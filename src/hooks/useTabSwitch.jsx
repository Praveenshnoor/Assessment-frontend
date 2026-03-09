import { useEffect, useRef, useCallback } from 'react';

export const useTabSwitch = (onTabSwitch, maxWarnings = 3) => {
  const warningCount = useRef(0);
  const isActive = useRef(true);

  const resetWarnings = useCallback(() => {
    warningCount.current = 0;
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isActive.current) {
        warningCount.current += 1;
        onTabSwitch(warningCount.current, maxWarnings);
        
        if (warningCount.current >= maxWarnings) {
          isActive.current = false;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onTabSwitch, maxWarnings]);

  return { resetWarnings, getWarningCount: () => warningCount.current };
};
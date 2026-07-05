import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // 'instant' statt 'auto', da 'auto' die global gesetzte CSS-Regel scroll-behavior: smooth
    // respektiert und dadurch animiert statt sofort zu springen
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

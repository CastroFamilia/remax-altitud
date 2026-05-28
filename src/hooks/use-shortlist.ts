import { useState, useEffect } from 'react';
import { getShortlist, addToShortlist, removeFromShortlist } from '@/lib/utils/shortlist';

/**
 * Story 7.1: Save & Shortlist Properties
 * Custom React hook for shortlist state management
 */
export function useShortlist() {
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setShortlist(getShortlist());
    setIsLoaded(true);

    const handleUpdate = () => {
      setShortlist(getShortlist());
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('shortlist-change', handleUpdate);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('shortlist-change', handleUpdate);
    };
  }, []);

  const save = (id: string) => {
    const res = addToShortlist(id);
    if (res.success) {
      window.dispatchEvent(new Event('shortlist-change'));
    }
    return res;
  };

  const remove = (id: string) => {
    removeFromShortlist(id);
    window.dispatchEvent(new Event('shortlist-change'));
  };

  const isSaved = (id: string) => shortlist.includes(id);

  return { shortlist, isSaved, save, remove, isLoaded };
}


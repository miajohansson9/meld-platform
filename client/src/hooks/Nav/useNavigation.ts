import { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export interface NavigationState {
  currentPage: string;
  selectedDate: Date;
  isLoading: boolean;
}

const getPageFromPath = (pathname: string): string => {
  // Remove leading slash and get segments
  const segments = pathname.split('/').filter(Boolean);
  
  if (segments.length === 0) return 'today';
  
  // Handle nested routes
  if (segments[0] === 'mentor') {
    if (segments[1] === 'feed') return 'coach-feed';
    if (segments[1] === 'chats') return 'chats';
    if (segments[1] === 'fragments') return 'fragments';
    return 'coach-feed'; // Default mentor page
  }
  
  if (segments[0] === 'library') {
    if (segments[1] === 'north-star') return 'north-star';
    if (segments[1] === 'wins') return 'library';
    return 'library'; // Default library page
  }
  
  // Handle direct routes
  const routeMap: Record<string, string> = {
    'today': 'today',
    'log': 'log',
    'coach-feed': 'coach-feed',
    'me': 'me',
    // Legacy chat routes
    'c': 'chats',
  };
  
  return routeMap[segments[0]] || segments[0];
};

export function useNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  
  const currentPage = getPageFromPath(location.pathname);
  
  const navigateToPage = useCallback((page: string) => {
    setIsLoading(true);
    
    // Map pages to routes
    const pageRoutes: Record<string, string> = {
      'today': '/today',
      'log': '/log',
      'coach-feed': '/mentor/feed',
      'chats': '/mentor/chats/new',
      'fragments': '/mentor/fragments',
      'north-star': '/library/north-star',
      'library': '/library/wins',
      'me': '/me',
    };
    
    const route = pageRoutes[page] || `/${page}`;
    navigate(route);
    
    // Simulate loading for smooth transitions
    setTimeout(() => setIsLoading(false), 100);
  }, [navigate]);
  
  const handleDateChange = useCallback((direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    const offset = direction === 'prev' ? -1 : 1;
    newDate.setDate(selectedDate.getDate() + offset);
    setSelectedDate(newDate);
  }, [selectedDate]);
  
  const setDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);
  
  return {
    currentPage,
    selectedDate,
    isLoading,
    navigateToPage,
    handleDateChange,
    setDate,
  };
} 
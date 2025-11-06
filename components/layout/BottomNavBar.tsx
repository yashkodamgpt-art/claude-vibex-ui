import React from 'react';

// Define the icons we'll use.
const HomeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6-4a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const SocialIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 016-6h6a6 6 0 016 6v1h-3m-6-6a4 4 0 100-8 4 4 0 000 8z" />
  </svg>
);

const AlertsIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341A6.002 6.002 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const ProfileIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export type AppTab = 'Home' | 'Social' | 'Alerts' | 'Profile';

const navItems = [
  { id: 'Home', icon: HomeIcon },
  { id: 'Social', icon: SocialIcon },
  { id: 'Alerts', icon: AlertsIcon },
  { id: 'Profile', icon: ProfileIcon },
];

interface BottomNavBarProps {
  activeTab: AppTab;
  onTabClick: (tab: AppTab) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onTabClick }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex justify-around items-center z-50">
      {navItems.map(item => {
        const isActive = activeTab === item.id;
        const color = isActive ? 'text-green-600' : 'text-gray-400';
        return (
          <button
            key={item.id}
            onClick={() => onTabClick(item.id as AppTab)}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${color} hover:text-green-500`}
            aria-label={item.id}
          >
            <item.icon className="h-6 w-6" />
            <span className={`text-xs font-medium ${isActive ? 'text-green-600' : 'text-gray-500'}`}>{item.id}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNavBar;

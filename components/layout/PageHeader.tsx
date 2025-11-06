
import React from 'react';

const LogoutIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

interface PageHeaderProps {
  username: string;
  onLogout: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({ username, onLogout }) => {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between p-4 h-16 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="w-1/3">
        <span className="text-sm font-semibold text-gray-700 truncate">{username}</span>
      </div>
      
      <div className="w-1/3 text-center">
        <h1 className="text-2xl font-bold">
          <span className="text-green-600">Vibe</span>
          <span className="text-black">X</span>
        </h1>
      </div>
      
      <div className="w-1/3 flex justify-end">
        <button 
            onClick={onLogout} 
            className="p-2 text-gray-500 rounded-full hover:bg-gray-200 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            aria-label="Log out"
        >
            <LogoutIcon className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
};

export default PageHeader;

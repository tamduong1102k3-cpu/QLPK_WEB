import React from 'react';

const Header = () => {
  return (
    <header className="bg-white dark:bg-slate-950 docked full-width top-0 border-b border-slate-200 dark:border-slate-800 flat no shadows z-50">
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-screen-2xl mx-auto font-manrope antialiased tracking-tight">
        <div className="flex items-center gap-2">
          <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tighter">MedCore Systems</span>
        </div>
        <div className="hidden md:flex items-center gap-gutter">
          <nav className="flex items-center gap-6">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Hệ thống Quản lý Nội bộ</span>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
import React, { useState, useEffect, useCallback } from 'react';


const TheThongKe = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3 hover:shadow-md transition-all group">
    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-white ${color} shadow-lg group-hover:scale-110 transition-transform flex-shrink-0`}>
      <span className="material-symbols-outlined text-lg sm:text-xl">{icon}</span>
    </div>
    <div className="min-w-0">
      <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5 truncate">{title}</p>
      <h3 className="text-lg sm:text-xl font-black text-gray-800 truncate">{value}</h3>
    </div>
  </div>
);

export default TheThongKe;


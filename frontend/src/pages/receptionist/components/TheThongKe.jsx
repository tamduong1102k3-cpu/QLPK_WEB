import React, { useState, useEffect } from 'react';


const TheThongKe = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 hover:shadow-lg transition-all group cursor-default">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${color} shadow-lg shadow-${color.split('-')[1]}-500/20 group-hover:scale-110 transition-transform`}>
      <span className="material-symbols-outlined text-3xl">{icon}</span>
    </div>
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-2xl font-black text-gray-800">{value}</h3>
    </div>
  </div>
);

export default TheThongKe;


import React from 'react';

const TopPanel = () => {
  return (
    <div className="h-12 w-full bg-gray-100 border-b border-gray-200 flex items-center px-4 gap-4">
      {/* Project Info */}
      <div className="flex items-center gap-2 text-gray-700">
        <span className="font-semibold">Project</span>
        <span className="text-gray-400">|</span>
        <span className="text-sm">Untitled</span>
      </div>

      {/* Tools */}
      <div className="flex-1 flex items-center justify-center gap-4">
        <button className="p-2 hover:bg-gray-200 rounded text-gray-700">Tool 1</button>
        <button className="p-2 hover:bg-gray-200 rounded text-gray-700">Tool 2</button>
        <button className="p-2 hover:bg-gray-200 rounded text-gray-700">Tool 3</button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        <button className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700">
          Share
        </button>
      </div>
    </div>
  );
};

export default TopPanel;

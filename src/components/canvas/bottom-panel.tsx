import React from 'react';

const BottomPanel = () => {
  return (
    <div className="h-12 w-full bg-gray-100 border-t border-gray-200 flex items-center justify-between px-4">
      {/* Left section */}
      <div className="text-sm text-gray-500">Bottom Panel</div>
      
      {/* Center section */}
      <div className="flex-1 flex justify-center">
        {/* Add center content here */}
      </div>
      
      {/* Right section */}
      <div>
        {/* Add right content here */}
      </div>
    </div>
  );
};

export default BottomPanel;

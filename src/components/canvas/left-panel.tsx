import React from 'react';

const LeftPanel = () => {
  return (
    <div className="w-[20%] h-screen bg-gray-100 border-r border-gray-200 p-4">
      <h2 className="text-lg font-semibold mb-4">Tools</h2>
      {/* Add your tools and elements here */}
      <div className="space-y-2">
        <div className="p-2 hover:bg-gray-200 rounded cursor-pointer">Tool 1</div>
        <div className="p-2 hover:bg-gray-200 rounded cursor-pointer">Tool 2</div>
        <div className="p-2 hover:bg-gray-200 rounded cursor-pointer">Tool 3</div>
      </div>
    </div>
  );
};

export default LeftPanel;

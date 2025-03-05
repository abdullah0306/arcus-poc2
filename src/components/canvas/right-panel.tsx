import React from 'react';

const RightPanel = () => {
  return (
    <div className="w-[20%] h-screen bg-gray-100 border-l border-gray-200 p-4">
      <h2 className="text-lg font-semibold mb-4">Properties</h2>
      {/* Add your properties and settings here */}
      <div className="space-y-2">
        <div className="p-2 hover:bg-gray-200 rounded cursor-pointer">Property 1</div>
        <div className="p-2 hover:bg-gray-200 rounded cursor-pointer">Property 2</div>
        <div className="p-2 hover:bg-gray-200 rounded cursor-pointer">Property 3</div>
      </div>
    </div>
  );
};

export default RightPanel;

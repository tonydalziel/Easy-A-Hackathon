'use client';

import { Rnd } from 'react-rnd';
import { WindowData } from '@/types/window';

interface WindowProps {
  window: WindowData;
  onClose: (id: string) => void;
  onFocus: (id: string) => void;
  children: React.ReactNode;
}

export default function Window({ window, onClose, onFocus, children }: WindowProps) {
  return (
    <Rnd
      default={{
        x: window.x,
        y: window.y,
        width: window.width,
        height: window.height,
      }}
      minWidth={300}
      minHeight={200}
      bounds="parent"
      style={{ zIndex: window.zIndex }}
      dragHandleClassName="window-header"
      onMouseDown={() => onFocus(window.id)}
    >
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl h-full flex flex-col">
        <div className="window-header bg-gray-900 px-4 py-2 rounded-t-lg border-b border-gray-700 flex justify-between items-center cursor-move">
          <span className="text-white font-mono text-sm">{window.title}</span>
          <button
            onClick={() => onClose(window.id)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {children}
        </div>
      </div>
    </Rnd>
  );
}

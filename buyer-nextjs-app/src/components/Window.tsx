/**
 * WINDOW COMPONENT
 * 
 * Modern, draggable window with glassmorphism effects
 * 
 * Features:
 * - Glassmorphism backdrop blur effect
 * - Smooth animations and transitions
 * - Resizable with visual feedback
 * - Focus state management
 * - Minimalist controls
 * 
 * Usage:
 * <Window window={windowData} onClose={handleClose} onFocus={handleFocus}>
 *   <YourContent />
 * </Window>
 */

'use client';

import { Rnd } from 'react-rnd';
import { WindowData } from '@/types/window';
import { useState } from 'react';

interface WindowProps {
  window: WindowData;
  onClose: (id: string) => void;
  onFocus: (id: string) => void;
  onMinimize: (id: string) => void;
  children: React.ReactNode;
}

export default function Window({ window, onClose, onFocus, onMinimize, children }: WindowProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Don't render if minimized
  if (window.isMinimized) {
    return null;
  }

  return (
    <Rnd
      default={{
        x: window.x,
        y: window.y,
        width: window.width,
        height: window.height,
      }}
      minWidth={400}
      minHeight={300}
      bounds="parent"
      style={{ zIndex: window.zIndex }}
      dragHandleClassName="window-header"
      onMouseDown={() => onFocus(window.id)}
      onDragStart={() => setIsDragging(true)}
      onDragStop={() => setIsDragging(false)}
      onResizeStart={() => setIsResizing(true)}
      onResizeStop={() => setIsResizing(false)}
      enableResizing={{
        top: false,
        right: true,
        bottom: true,
        left: false,
        topRight: false,
        bottomRight: true,
        bottomLeft: false,
        topLeft: false,
      }}
      resizeHandleStyles={{
        right: { 
          width: '4px',
          right: 0,
          cursor: 'ew-resize',
        },
        bottom: {
          height: '4px',
          bottom: 0,
          cursor: 'ns-resize',
        },
        bottomRight: {
          width: '12px',
          height: '12px',
          right: 0,
          bottom: 0,
          cursor: 'nwse-resize',
        },
      }}
      resizeHandleClasses={{
        right: 'hover:bg-cyan-500/50 transition-colors',
        bottom: 'hover:bg-cyan-500/50 transition-colors',
        bottomRight: 'hover:bg-cyan-500 transition-colors rounded-full',
      }}
    >
      <div 
        className={`
          glass rounded-xl shadow-2xl h-full flex flex-col overflow-hidden
          transition-all duration-300
          ${isDragging ? 'scale-105 shadow-cyan-500/20' : ''}
          ${isResizing ? 'ring-2 ring-cyan-500/50' : ''}
        `}
      >
        {/* Window Header */}
        <div className="window-header relative group">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative px-4 py-3 flex justify-between items-center cursor-move">
            {/* Title */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <button 
                  className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors cursor-pointer" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    e.preventDefault();
                    onClose(window.id); 
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  title="Close"
                  type="button"
                />
                <button
                  className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors cursor-pointer" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    e.preventDefault();
                    onMinimize(window.id); 
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  title="Minimize"
                  type="button"
                />
                <div className="w-3 h-3 rounded-full bg-green-500/80 opacity-50 cursor-not-allowed" 
                     title="Maximize (not available)" />
              </div>
              <span className="text-white font-medium text-sm ml-2">{window.title}</span>
            </div>
            
            {/* Window Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  e.preventDefault();
                  onClose(window.id); 
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                title="Close"
                type="button"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Window Content */}
        <div className="flex-1 overflow-hidden bg-gray-900/30">
          {children}
        </div>
        
        {/* Resize indicator */}
        <div className="absolute bottom-0 right-0 w-4 h-4 pointer-events-none">
          <svg className="w-full h-full text-gray-600" viewBox="0 0 16 16" fill="currentColor">
            <path d="M15 9h-2v2h2V9zm0 4h-2v2h2v-2zm-4 0h-2v2h2v-2z"/>
          </svg>
        </div>
      </div>
    </Rnd>
  );
}

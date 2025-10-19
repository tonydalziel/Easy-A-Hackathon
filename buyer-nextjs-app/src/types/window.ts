export interface WindowData {
  id: string;
  type: 'help' | 'wallet' | 'agent-tracker' | 'agent-list' | 'event-history' | 'decision-stream' | 'dashboard' | 'item-registration' | 'lora-explorer';
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  agentId?: string; // For agent-tracker windows
  isMinimized?: boolean; // Whether the window is minimized to dock
}

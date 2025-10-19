export interface WindowData {
  id: string;
  type: 'help' | 'wallet' | 'agent-tracker' | 'agent-list' | 'event-history' | 'decision-stream' | 'dashboard' | 'item-registration' | 'decision-review' | 'eval-manager' | 'eval-runner' | 'lora-explorer';
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  agentId?: string; // For agent-tracker windows
  evalSetId?: string; // For eval-runner windows
  walletId?: string; // For lora-explorer windows
  isMinimized?: boolean; // Whether the window is minimized to dock
}

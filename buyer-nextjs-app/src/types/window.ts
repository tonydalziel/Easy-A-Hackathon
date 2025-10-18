export interface WindowData {
  id: string;
  type: 'help' | 'wallet' | 'agent-tracker' | 'agent-list' | 'event-history' | 'decision-stream';
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  agentId?: string; // For agent-tracker windows
}

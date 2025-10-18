# Agentic Procurement System - UI Documentation

## Overview

A modern, sleek web interface for an AI-powered autonomous procurement and selling system. Built with Next.js 15, React 19, and TypeScript, featuring a terminal-inspired command interface with real-time agent monitoring.

---

## Design System

### Color Palette

#### Primary Colors
- **Primary Cyan**: `#00d4ff` - Main accent for interactive elements
- **Primary Dark**: `#0099cc` - Darker variant for hover states
- **Secondary Purple**: `#8b5cf6` - Agent/AI indicators
- **Background**: `#0a0a0f` - Deep dark base
- **Foreground**: `#f0f0f5` - Light text

#### Status Colors
- **Success Green**: `#10b981` - Approved purchases, active states
- **Warning Amber**: `#f59e0b` - Pending approvals, caution states
- **Danger Red**: `#ef4444` - Rejected decisions, errors
- **Info Blue**: Inherited from primary cyan

### Glassmorphism Effects

The UI extensively uses glassmorphism for a modern, premium feel:

```css
.glass {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

### Gradients

- **Primary Gradient**: Purple to violet (135deg)
- **Success Gradient**: Green shades (135deg)
- **Warning Gradient**: Amber shades (135deg)
- **Danger Gradient**: Red shades (135deg)
- **Mesh Background**: Radial gradients with animated movement

### Typography

- **System Font Stack**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
- **Monospace**: Used for command input, agent IDs, technical data
- **Font Sizes**: Responsive scaling from 12px (xs) to 48px (4xl)

### Animations

#### Available Animations
1. **Pulse Glow**: For live indicators (2s cycle)
2. **Shimmer**: Loading state effect
3. **Slide In**: Entrance animation (0.4s)
4. **Scale In**: Component appearance (0.3s)
5. **Mesh Shift**: Background movement (20s cycle)

#### Usage
```tsx
className="pulse-glow"  // Live indicator
className="shimmer"     // Loading state
className="slide-in"    // Slide animation
className="scale-in"    // Scale animation
```

---

## Component Architecture

### Core Components

#### 1. Main Interface (`page.tsx`)

**Purpose**: Primary application shell with command interface

**Features**:
- Hero section with system statistics
- Command-line interface with autocomplete
- Multi-window management system
- Quick action buttons
- Real-time status updates

**State Management**:
```typescript
{
  command: string;              // Current command input
  windows: WindowData[];        // Open windows
  nextZIndex: number;           // Window layering
  error: string;                // Error messages
  success: string;              // Success messages
  suggestion: string;           // Autocomplete suggestion
  systemStats: {                // Live system metrics
    activeAgents: number;
    totalDecisions: number;
    successRate: number;
  }
}
```

**Commands**:
- `-h`: Display help window
- `wallet`: Show wallet overview
- `watch`: Live decision stream
- `track <agent-id>`: Monitor specific agent
- `list`: List all agents
- `events`: On-chain event history
- `create <prompt>`: Create new agent
- `dashboard`: System analytics dashboard

#### 2. Window Component (`Window.tsx`)

**Purpose**: Draggable, resizable window container

**Features**:
- Glassmorphism styling
- Drag and drop repositioning
- Resize handles (right, bottom, bottom-right)
- Focus management with z-index
- macOS-style traffic light buttons
- Visual feedback on drag/resize

**Props**:
```typescript
interface WindowProps {
  window: WindowData;
  onClose: (id: string) => void;
  onFocus: (id: string) => void;
  children: React.ReactNode;
}
```

**Window Sizing**:
- Minimum: 400x300px
- Default: Varies by type
- Dashboard: 900x700px
- Agent Tracker: 500x450px
- Decision Stream: 700x600px

#### 3. Dashboard Component (`Dashboard.tsx`)

**Purpose**: System-wide analytics and monitoring

**Features**:
- Four key metric cards (Agents, Decisions, Approvals, Success Rate)
- Active agents list with real-time status
- Recent activity feed (last 10 decisions)
- Visual progress bars and charts
- Auto-refresh every 5 seconds

**Metrics Displayed**:
- Total agents count
- Active vs inactive agents
- Total decisions made
- Buy vs ignore breakdown
- Success rate percentage
- Average decisions per agent
- Real-time activity stream

#### 4. Agent Tracker (`AgentTracker.tsx`)

**Purpose**: Individual agent monitoring with live decision stream

**Features**:
- Agent profile information
- Model and provider details
- Wallet information
- Agent prompt display
- Items acquired list
- **Live decision stream** (filtered to this agent)
- Stream connection status
- Buy/Ignore decision counters
- Auto-refresh every 5 seconds

**Decision Display**:
- BUY/IGNORE badges with color coding
- Item name and price
- Max price offered (for purchases)
- Reasoning preview (truncated)
- Timestamp
- Animated highlight for new decisions

#### 5. Decision Stream (`DecisionStream.tsx`)

**Purpose**: Real-time decision monitoring for all agents

**Features**:
- Server-Sent Events (SSE) connection
- Live decision cards with animations
- System-wide statistics
- Unique agent and item tracking
- Auto-scroll to newest decisions
- Connection status indicator
- Heartbeat monitoring

**Statistics**:
- Total decisions
- Buy count
- Ignore count
- Unique agents
- Unique items

---

## Command Interface

### Autocomplete System

**Intelligent Suggestions**:
- Prefix matching as you type
- Ghost text preview
- Tab or Arrow Right to accept
- Dropdown with descriptions
- Parameter hints for commands requiring arguments

**Syntax Highlighting**:
- Valid commands: Green
- Invalid commands: Red
- Parameters: Blue
- Suggestions: Gray

**Keyboard Shortcuts**:
- `Tab` or `→`: Accept suggestion
- `Enter`: Execute command
- Type to filter suggestions

### Error Handling

**Success Messages**:
- Green border and icon
- Auto-dismiss after 5 seconds
- Slide-in animation

**Error Messages**:
- Red border and icon
- Remains until dismissed or new command
- Clear error context

---

## Real-Time Features

### Server-Sent Events (SSE)

**Connection Management**:
```typescript
const eventSource = new EventSource('/api/decisions/stream');

eventSource.onmessage = (event) => {
  const message = JSON.parse(event.data);
  // Handle: connected, stats, decision, heartbeat
};
```

**Event Types**:
1. `connected`: Initial connection confirmation
2. `stats`: System-wide statistics update
3. `decision`: New decision from any agent
4. `heartbeat`: Keep-alive signal (every 15s)

**Auto-Reconnection**:
- Browser handles reconnection automatically
- Visual status indicator shows connection state
- Graceful degradation if connection fails

### Live Updates

**Polling Intervals**:
- Agent data: 5 seconds
- System stats: 10 seconds
- Dashboard metrics: 5 seconds

**SSE Streams**:
- Decision updates: Real-time
- Heartbeat: 15 seconds

---

## Window Management

### Window Types

1. **Help**: Command reference (400x300px, right-aligned)
2. **Wallet**: Balance overview (500x400px)
3. **Watch**: Decision stream (700x600px)
4. **Track**: Agent monitor (500x450px)
5. **List**: Agent list (700x500px)
6. **Events**: Transaction history (800x500px)
7. **Dashboard**: Analytics (900x700px)

### Z-Index Management

Windows use dynamic z-indexing starting at 1000:
- Clicking a window brings it to front
- Each focus increments the z-index counter
- Ensures proper layering without conflicts

### Window Controls

**Traffic Light Buttons** (macOS-style):
- Red: Close window (functional)
- Yellow: Minimize (disabled - not implemented)
- Green: Maximize (disabled - not implemented)

**X Button**: Alternative close button in top-right

---

## Styling Guidelines

### Component Structure

```tsx
<div className="glass rounded-xl p-6 border border-cyan-500/30 hover:border-cyan-500/50 transition-all">
  {/* Content */}
</div>
```

### Spacing Scale
- xs: 0.125rem (2px)
- sm: 0.25rem (4px)
- base: 0.5rem (8px)
- lg: 1rem (16px)
- xl: 1.5rem (24px)
- 2xl: 2rem (32px)

### Border Radius
- sm: 4px
- base: 8px
- lg: 12px
- xl: 16px
- 2xl: 24px

### Opacity Levels
- Disabled: 50%
- Hover: 70-80%
- Active: 100%
- Glass backgrounds: 60%
- Borders: 10-30%

---

## Responsive Design

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile Considerations
- Windows may overlap on smaller screens
- Command interface remains fixed at top
- Quick action bar at bottom
- Touch-friendly button sizes (min 44x44px)

---

## Performance Optimizations

### Component Memoization
- Use React.memo for expensive components
- Memoize callbacks with useCallback
- Memoize values with useMemo

### Update Batching
- Decision stream keeps last 50 items
- Agent tracker keeps last 20 decisions
- Automatic cleanup on component unmount

### Resource Cleanup
```typescript
useEffect(() => {
  const interval = setInterval(...);
  const eventSource = new EventSource(...);
  
  return () => {
    clearInterval(interval);
    eventSource.close();
  };
}, []);
```

---

## Accessibility

### Keyboard Navigation
- Tab through interactive elements
- Enter to activate buttons
- Escape to close modals (future)
- Arrow keys for autocomplete

### ARIA Labels
- Buttons have descriptive titles
- Status indicators have proper labels
- Form inputs have associated labels

### Color Contrast
- All text meets WCAG AA standards
- Important information uses high contrast
- Status colors are supplemented with text

---

## Browser Support

### Minimum Requirements
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Required Features
- CSS backdrop-filter (glassmorphism)
- CSS custom properties (variables)
- EventSource API (SSE)
- Flexbox and Grid
- Modern JavaScript (ES2020+)

---

## Future Enhancements

### Planned Features
1. Window minimize/maximize functionality
2. Window snap zones for easy positioning
3. Keyboard shortcuts for common commands
4. Command history (up/down arrows)
5. Themes (light mode, high contrast)
6. Customizable dashboard widgets
7. Export data to CSV/JSON
8. Advanced filtering and search
9. Agent performance charts
10. Notification system for critical events

### Performance Improvements
1. Virtual scrolling for long lists
2. Lazy loading for window content
3. WebSocket upgrade from SSE
4. Service worker for offline support
5. Progressive Web App (PWA) capabilities

---

## Development Workflow

### Component Creation
1. Create component file in `/src/components`
2. Add TypeScript interfaces
3. Implement component logic
4. Add JSDoc documentation
5. Export from component
6. Import and use in parent

### Styling Approach
1. Use Tailwind utility classes
2. Apply glassmorphism with `.glass` class
3. Add custom animations via globals.css
4. Use CSS variables for theme colors
5. Maintain consistent spacing

### Testing Strategy
1. Unit tests for utility functions
2. Integration tests for API calls
3. E2E tests for critical user flows
4. Visual regression tests
5. Accessibility audits

---

## Troubleshooting

### Common Issues

**Windows Not Dragging**:
- Ensure `dragHandleClassName="window-header"` is set
- Check that header has `cursor-move` class
- Verify `react-rnd` is installed

**SSE Connection Fails**:
- Check that backend endpoint is running
- Verify CORS settings allow SSE
- Check browser console for errors
- Ensure `/api/decisions/stream` returns proper headers

**Autocomplete Not Working**:
- Verify command list is populated
- Check that input value updates state
- Ensure suggestion calculation logic is correct
- Test keyboard event handlers

**Glassmorphism Not Showing**:
- Check browser support for `backdrop-filter`
- Verify `.glass` class is applied
- Ensure parent has non-transparent background
- Check z-index layering

---

## API Integration

### Endpoints Used

**Agents**:
- `GET /api/agents` - List all agents
- `POST /api/agents/create` - Create new agent
- `GET /api/agents/[id]` - Get agent details
- `PATCH /api/agents/[id]` - Update agent
- `DELETE /api/agents/[id]` - Delete agent

**Decisions**:
- `GET /api/decisions` - List all decisions
- `POST /api/decisions` - Register decision
- `GET /api/decisions/stream` - SSE stream
- `DELETE /api/decisions` - Clear decisions

**Express Server**:
- `POST /agents` - Register agent with backend
- `GET /agents` - List backend agents
- `POST /agents/consider-purchase` - LLM decision

### Response Formats

**Agent**:
```json
{
  "id": "uuid",
  "prompt": "string",
  "model_id": "string",
  "provider_id": "string",
  "wallet_id": "string",
  "wallet_pwd": "string",
  "currentItemsAcquired": ["string"],
  "createdAt": 1234567890,
  "status": "active" | "inactive" | "error"
}
```

**Decision**:
```json
{
  "id": "uuid",
  "agentId": "string",
  "itemId": "string",
  "itemName": "string",
  "itemPrice": 123.45,
  "decision": "BUY" | "IGNORE",
  "maxPrice": 100.00,
  "reasoning": "string",
  "timestamp": 1234567890
}
```

---

## Contributing

### Code Style
- Use TypeScript strict mode
- Follow ESLint configuration
- Use Prettier for formatting
- Add JSDoc comments to functions
- Keep components under 300 lines

### Commit Messages
```
feat: Add dashboard component
fix: Resolve window close button issue
docs: Update UI documentation
style: Remove emojis from interface
refactor: Improve autocomplete logic
test: Add tests for command parsing
```

### Pull Request Process
1. Create feature branch
2. Implement changes
3. Add tests
4. Update documentation
5. Submit PR with description
6. Address review comments
7. Merge after approval

---

## License & Credits

**Framework**: Next.js 15.5.6 with React 19.1.0  
**Styling**: TailwindCSS with custom design system  
**Draggable Windows**: react-rnd  
**Real-time**: Server-Sent Events (SSE)  
**TypeScript**: Strict mode enabled  

Built with modern web technologies for a premium user experience.

---

*Last Updated: October 18, 2025*

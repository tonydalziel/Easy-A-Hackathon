import { agentDecisionStore } from '@/lib/agentDecisionStore';
import { AgentDecision } from '@/types/agent';

// This endpoint streams decisions using Server-Sent Events (SSE)
export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const initialData = `data: ${JSON.stringify({ type: 'connected', message: 'Decision stream connected' })}\n\n`;
      controller.enqueue(encoder.encode(initialData));

      // Send current stats
      const stats = agentDecisionStore.getStats();
      const statsData = `data: ${JSON.stringify({ type: 'stats', data: stats })}\n\n`;
      controller.enqueue(encoder.encode(statsData));

      // Set up listener for new decisions
      const onNewDecision = (decision: AgentDecision) => {
        const data = `data: ${JSON.stringify({ type: 'decision', data: decision })}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      agentDecisionStore.on('newDecision', onNewDecision);

      // Send heartbeat every 15 seconds to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = `data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`;
          controller.enqueue(encoder.encode(heartbeat));
        } catch (error) {
          console.error('Error sending heartbeat:', error);
          clearInterval(heartbeatInterval);
        }
      }, 15000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        console.log('Client disconnected from decision stream');
        agentDecisionStore.removeListener('newDecision', onNewDecision);
        clearInterval(heartbeatInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

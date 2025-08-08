import { useEffect, useRef, useState, useCallback } from 'react';

interface UseWebSocketOptions {
  url: string;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

interface UseWebSocketReturn {
  socket: WebSocket | null;
  connected: boolean;
  lastMessage: MessageEvent | null;
  sendMessage: (data: any) => void;
  disconnect: () => void;
  reconnect: () => void;
}

export const useWebSocket = (options: UseWebSocketOptions): UseWebSocketReturn => {
  const {
    url,
    onOpen,
    onClose,
    onError,
    onMessage,
    reconnectAttempts = 3,
    reconnectInterval = 3000
  } = options;

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  
  const reconnectCount = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const shouldConnect = useRef(true);

  const connect = useCallback(() => {
    if (!shouldConnect.current || typeof window === 'undefined') return;

    try {
      const ws = new WebSocket(url);

      ws.onopen = (event) => {
        console.log('WebSocket connected');
        setConnected(true);
        reconnectCount.current = 0;
        onOpen?.(event);
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        setConnected(false);
        onClose?.(event);

        // Attempt to reconnect if not manually disconnected
        if (shouldConnect.current && reconnectCount.current < reconnectAttempts) {
          reconnectCount.current++;
          console.log(`Attempting to reconnect... (${reconnectCount.current}/${reconnectAttempts})`);
          
          reconnectTimer.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error', event);
        onError?.(event);
      };

      ws.onmessage = (event) => {
        setLastMessage(event);
        onMessage?.(event);
      };

      setSocket(ws);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      onError?.(error as Event);
    }
  }, [url, onOpen, onClose, onError, onMessage, reconnectAttempts, reconnectInterval]);

  const sendMessage = useCallback((data: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      try {
        const message = typeof data === 'string' ? data : JSON.stringify(data);
        socket.send(message);
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
      }
    } else {
      console.warn('WebSocket is not connected. Message not sent:', data);
    }
  }, [socket]);

  const disconnect = useCallback(() => {
    shouldConnect.current = false;
    
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    if (socket) {
      socket.close(1000, 'Manual disconnect');
      setSocket(null);
      setConnected(false);
    }
  }, [socket]);

  const reconnect = useCallback(() => {
    disconnect();
    shouldConnect.current = true;
    reconnectCount.current = 0;
    setTimeout(connect, 100);
  }, [disconnect, connect]);

  // Initialize connection
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldConnect.current = false;
      
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }

      if (socket) {
        socket.close(1000, 'Component unmount');
      }
    };
  }, [socket]);

  return {
    socket,
    connected,
    lastMessage,
    sendMessage,
    disconnect,
    reconnect
  };
};

export default useWebSocket;

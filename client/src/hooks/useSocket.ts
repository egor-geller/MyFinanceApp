import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function useSocket(token: string | null, onEntryAdded: () => void) {
  useEffect(() => {
    if (!token) return;
    socket = io({ auth: { token } });
    socket.on('entry:added', onEntryAdded);
    return () => { socket?.disconnect(); socket = null; };
  }, [token, onEntryAdded]);
}

import { io } from 'socket.io-client';

// Même origine en prod (Express sert le build + Socket.io)
export const socket = io();

import React, { createContext, useContext, useEffect, useState } from 'react';
import {server} from "./utils/address.ts";

interface WebSocketContextType {
    webSocketMessage: (message: any) => void;
    isConnected: boolean;
    lastMessage: any; // Store the latest WebSocket message
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};

const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<any>(null); // State for storing the latest message

    useEffect(() => {
        const ws = new WebSocket(`ws://${server.split(/^\w{4,5}:\/\//)[1]}/ws`);

        ws.onopen = () => {
            console.log('WebSocket connected');
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);
            setLastMessage(data); // Update the latest message
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
            setIsConnected(false);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        setSocket(ws);
        return () => {
            ws.close();
        };
    }, []);

    const webSocketMessage = (message: any) => {
        if (socket && isConnected) {
            socket.send(JSON.stringify(message));
        } else {
            console.error('WebSocket is not connected');
        }
    };

    return (
        <WebSocketContext.Provider value={{ webSocketMessage, isConnected, lastMessage }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export default WebSocketProvider;
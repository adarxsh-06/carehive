import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

// Hook to access extra socket actions (optional)
export const useSocketActions = () => {
    const { socket, setSocket } = useSocket();

    // Function to emit 'register' safely
    const registerSocket = (userId, role) => {
        if (socket && userId && role) {
            socket.emit("register", { userId, role });
            console.log(`Socket registered as ${role}`);
        }
    };

    // Hard disconnect and reconnect socket
    const disconnectAndReconnect = () => {
        if (socket) {
            socket.disconnect();
        }
        const newSocket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:4040");
        setSocket(newSocket);
    };

    return { registerSocket, disconnectAndReconnect };
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:4040");

        newSocket.on("connect", () => {
            console.log("Connected to WebSocket");
        });

        setSocket(newSocket);

        return () => {
            if (newSocket) {
                newSocket.disconnect();
                console.log("Socket disconnected");
            }
        };
    }, []);

    return <SocketContext.Provider value={{socket,setSocket}}>{children}</SocketContext.Provider>;
};

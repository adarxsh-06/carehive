import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:4040");

        newSocket.on("connect", () => {
            console.log("Connected to WebSocket");
        });

        setSocket(newSocket);

        return () => newSocket.disconnect();
    }, []);

    return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};

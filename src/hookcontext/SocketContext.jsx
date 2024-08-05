import React, { createContext, useContext, useMemo } from 'react';
import { io } from 'socket.io-client';
import { api } from '../globalkey';

const SocketContext = createContext(null);

export const useSocketContext = () => useContext(SocketContext);

export const SocketContextProvider = (props) => {

    const socket = useMemo(
        () => {
            const socketInstance = io(api);
            console.log('socket connected', socketInstance);
            return socketInstance;
        }, []);

    const value = { socket };

    return (
        <SocketContext.Provider value={value}>
            {props.children}
        </SocketContext.Provider>
    );
};

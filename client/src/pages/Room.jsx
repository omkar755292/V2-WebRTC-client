import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePeerContext } from '../hookcontext/PeerContext';
import { useSocketContext } from '../hookcontext/SocketContext';


const RoomPage = () => {
  const { roomId } = useParams();
  const { peer, createOffer, createAnswer, setRemoteAnswer, sendStream } = usePeerContext();
  const { socket } = useSocketContext();
  const myId = socket.id;
  const userEmail = localStorage.getItem('userEmail');

  const handleUserConnected = useCallback(async (data) => {
    console.log('User connected:', data);
    const { userId, email } = data;

    const offer = await createOffer();
    socket.emit('call-user', { callerId: myId, fromEmail: userEmail, email: email, userId, offer });

  }, [createOffer, socket]);

  const handleIncomingCall = useCallback(async (data) => {
    console.log('Incomming call:', data);
    const { fromEmail, callerId, offer } = data;

    const answer = await createAnswer(offer);
    socket.emit('call-accepted', { userEmail, answer, callerId })

 
  }, [socket, createAnswer]);

  const handleCallAccepted = useCallback(async (data) => {
    console.log('call Accepted:', data);
    const { answer, userId, email } = data;

    await setRemoteAnswer(answer);


  }, [socket]);


  useEffect(() => {
    socket.on('user-connected', handleUserConnected);
    socket.on('incoming-call', handleIncomingCall);
    socket.on('call-accepted', handleCallAccepted);

    return () => {
      socket.off('user-connected', handleUserConnected);
      socket.off('call-accepted', handleCallAccepted);
      socket.off('incoming-call', handleIncomingCall);
    };
  }, [socket, handleUserConnected, handleIncomingCall, handleCallAccepted]);


  return (
    <div className="relative flex flex-col items-center justify-center h-screen bg-gray-800">
      <>

        <div className="absolute bottom-4 left-4 text-gray-700 dark:text-gray-400 bg-white dark:bg-gray-700 p-2 rounded-lg shadow-md z-20">
          <span className="mr-2">Meeting Code: {roomId}</span>
        </div>
      </>
    </div >
  );
};

export default RoomPage;

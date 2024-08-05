import React, { useCallback, useEffect } from 'react';
import { useSocketContext } from '../hookcontext/SocketContext';
import { usePeerContext } from '../hookcontext/PeerContext';

const RoomPage = () => {

  const userEmail = localStorage.getItem('userEmail');
  const { socket } = useSocketContext();
  const { peer, createOffer, createAnswer, setRemoteAnswer } = usePeerContext();

  const handleUserConnected = useCallback(async (data) => {
    console.log('User connected:', data);
    const { id, email } = data;

    const offer = await createOffer();
    socket.emit('call-user', { email, id, offer, userEmail });

  }, [createOffer, socket]);

  const handleIncomingCall = useCallback(async (data) => {
    console.log('Incomming call:', data);
    const { fromEmail, offer } = data;

    const answer = await createAnswer(offer);
    socket.emit('call-accepted', { emailId: fromEmail, answer })

  }, [socket, createAnswer]);

  const handleCallAccepted = useCallback(async (data) => {
    console.log('call Accepted:', data);
    const { answer } = data;

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
      user Joined to room
    </div >
  );
};

export default RoomPage;

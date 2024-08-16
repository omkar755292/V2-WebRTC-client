import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import Swal from 'sweetalert2';
import { useSocketContext } from '../hookcontext/SocketContext';


const VideoCall = () => {
  const navigate = useNavigate();
  const { socket } = useSocketContext();
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleHostJoin = useCallback((data) => {
    const { roomId } = data;
    setLoading(false);
    navigate(`/room/${roomId}`);
  }, [navigate]);

  const handleUserJoin = useCallback((data) => {
    const { roomId } = data;
    setLoading(false);
    navigate(`/room/${roomId}`);
  }, [navigate]);

  useEffect(() => {
    socket.on('host-join', handleHostJoin);
    socket.on('user-join', handleUserJoin);

    return () => {
      socket.off('host-join', handleHostJoin);
      socket.off('user-join', handleUserJoin);
    };
  }, [socket, handleHostJoin, handleUserJoin]);

  const handleNewMeeting = useCallback(() => {
    const roomId = uuidv4();
    const myId = socket.id;
    const userEmail = localStorage.getItem('userEmail');
    Swal.fire({
      title: 'New Meeting Created',
      html: `
        <p>Meeting Code: <strong>${roomId}</strong></p>
        <button id="copyMeetingCode" class="swal2-confirm swal2-styled bg-blue-500 text-white rounded px-4 py-2 mt-2">
          Copy
        </button>
      `,
      showConfirmButton: false,
      didOpen: () => {
        const copyButton = document.getElementById('copyMeetingCode');
        copyButton.addEventListener('click', () => {
          navigator.clipboard.writeText(roomId).then(() => {
            Swal.fire({
              icon: 'success',
              title: 'Copied!',
              text: 'Meeting code has been copied to clipboard',
              timer: 1500,
              showConfirmButton: false
            });
            socket.emit("create-room", { roomId, userEmail, myId });
          });
        });
      }
    });
  }, [socket]);

  const handleJoinRoom = useCallback(() => {
    const myId = socket.id;
    if (!roomId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please enter a room code to join',
        showConfirmButton: true,
      });
      return;
    }
    const userEmail = localStorage.getItem('userEmail');
    socket.emit("join-room", { userEmail, roomId, myId });
    setLoading(true);
  }, [roomId, socket]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-gray-800 p-4 dark:bg-gray-800 dark:text-white">
      <h1 className="text-3xl font-bold mb-2 text-center">Video Call and Meeting for Everyone</h1>
      <p className="text-lg mb-6 text-center">Connect, collaborate, and celebrate from anywhere with WebRTC</p>
      <div className="flex flex-col items-center">
        <div className="flex mb-4">
          <button
            onClick={handleNewMeeting}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
          >
            New Meeting
          </button>
          <input
            type="text"
            placeholder="Enter Code"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="p-2 rounded text-gray-800 border mr-2 dark:text-gray-800"
          />
          <button
            onClick={handleJoinRoom}
            className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            {loading ? 'Joining...' : 'Join'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;

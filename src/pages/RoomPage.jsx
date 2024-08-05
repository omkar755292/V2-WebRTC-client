import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MonitorUp, Mic, MicOff, Video, Circle, VideoOff, Phone, Airplay, CircleStop } from 'lucide-react'
import ReactPlayer from 'react-player';
import RecordRTC from 'recordrtc';
import useMediaStream from '../hookcontext/MediaStream';
import { usePeerContext } from '../hookcontext/PeerContext';
import { useSocketContext } from '../hookcontext/SocketContext';
import usePlayer from '../hookcontext/playerHook';
import Swal from 'sweetalert2';


const RoomPage = () => {
  const { roomId } = useParams();
  const { stream, loading, error } = useMediaStream();
  const { myId, peer } = usePeerContext();
  const { socket } = useSocketContext();
  const { players, setPlayers, playVideo, pauseVideo, muteAudio, unmuteAudio, screenShareON, screenShareOFF } = usePlayer({ roomId });
  const [users, setUsers] = useState([]);
  const [calls, setCalls] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordStream, setRecordStream] = useState(null);
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail');

  const handleUserConnected = useCallback((data) => {
    console.log('User connected:', data);
    const { id, email } = data;
    const call = peer.call(id, stream, { metadata: { email: userEmail } });

    call.on('stream', (incomingStream) => {
      console.log('Call accepted, incoming stream from', data);
      setPlayers((prev) => ({
        ...prev,
        [id]: {
          url: incomingStream,
          muted: true,
          playing: false,
          screensharing: false,
          email: email,
        },
      }));

      setUsers((prev) => ({
        ...prev,
        [id]: call
      }))

      setCalls(call);

    });
  }, [peer, stream, setPlayers, userEmail]);

  const handleCall = useCallback((call) => {
    const { peer: callerId, metadata } = call;
    console.log('Incoming call from', callerId);
    call.answer(stream, { metadata: { email: userEmail } });

    call.on('stream', (incomingStream) => {
      console.log('Call accepted, incoming stream from', callerId);
      setPlayers((prev) => ({
        ...prev,
        [callerId]: {
          url: incomingStream,
          muted: true,
          playing: false,
          screensharing: false,
          email: metadata.email,
        },
      }));


      setUsers((prev) => ({
        ...prev,
        [callerId]: call
      }))

      setCalls(call);

    });
  }, [stream, setPlayers, userEmail]);

  useEffect(() => {
    peer.on('call', handleCall);
    socket.on('user-connected', handleUserConnected);

    return () => {
      peer.off('call', handleCall);
      socket.off('user-connected', handleUserConnected);
    };
  }, [peer, socket, handleUserConnected, handleCall]);

  useEffect(() => {
    if (!stream || !myId) return;

    console.log(`Setting my stream ${myId}`);
    setPlayers((prev) => ({
      ...prev,
      [myId]: {
        url: stream,
        muted: true,
        playing: false,
        screensharing: false,
        email: userEmail,
      },
    }));

    return () => {

    };
  }, [stream, myId, setPlayers, userEmail]);

  const handleUnmuteAudio = useCallback((data) => {
    const { userEmail, userId } = data;
    console.log('unmute audio call for user', userEmail);

    setPlayers((prevPlayers) => {
      const updatedPlayers = {
        ...prevPlayers,
        [userId]: {
          ...prevPlayers[userId],
          muted: false
        }
      }
      return updatedPlayers
    })
  }, [setPlayers]);

  const handleMuteAudio = useCallback((data) => {
    const { userEmail, userId } = data;
    console.log('mute audio call for user', userEmail);

    setPlayers((prevPlayers) => {
      const updatedPlayers = {
        ...prevPlayers,
        [userId]: {
          ...prevPlayers[userId],
          muted: true
        }
      }
      return updatedPlayers
    })
  }, [setPlayers]);

  const handlePlayVideo = useCallback((data) => {
    const { userEmail, userId } = data;
    console.log('video call play for user', userEmail);

    setPlayers((prevPlayers) => {
      const updatedPlayers = {
        ...prevPlayers,
        [userId]: {
          ...prevPlayers[userId],
          playing: true
        }
      }
      return updatedPlayers
    })
  }, [setPlayers]);

  const handlePauseVideo = useCallback((data) => {
    const { userEmail, userId } = data;
    console.log('video call pause for user', userEmail);

    setPlayers((prevPlayers) => {
      const updatedPlayers = {
        ...prevPlayers,
        [userId]: {
          ...prevPlayers[userId],
          playing: false
        }
      }
      return updatedPlayers
    })
  }, [setPlayers]);


  const endCall = useCallback(() => {
    console.log('Ending call...');
    socket.emit('end-call', { myId, userEmail, roomId });
    if (peer) {
      peer.destroy(); // or peer.close(), depending on your peer library
    }
    navigate('/video-call');

  }, [peer, navigate]);


  const handleUserLeave = useCallback((data) => {
    const { userEmail, userId } = data;
    console.log('User left the call:', userEmail);

    // Close the user's stream or connection
    if (calls[userId]) {
      calls[userId].close();
      delete calls[userId];
    }

    // Close the user's stream or connection
    if (users[userId]) {
      users[userId].close();
      delete users[userId];
    }

    // Remove the user from the players list
    setPlayers((prevPlayers) => {
      const updatedPlayers = { ...prevPlayers };
      delete updatedPlayers[userId];

      return updatedPlayers;
    });

  }, [users, setPlayers]);

  useEffect(() => {
    socket.on('user-mute-audio', handleMuteAudio);
    socket.on('user-unmute-audio', handleUnmuteAudio);
    socket.on('user-play-video', handlePlayVideo);
    socket.on('user-pause-video', handlePauseVideo);
    socket.on('user-leave', handleUserLeave);

    return () => {
      socket.off('user-leave', handleUserLeave);
      socket.off('user-mute-audio', handleMuteAudio);
      socket.off('user-unmute-audio', handleUnmuteAudio);
      socket.off('user-play-video', handlePlayVideo);
      socket.off('user-pause-video', handlePauseVideo);
    };
  }, [socket, handleMuteAudio, handleUnmuteAudio, handlePlayVideo, handlePauseVideo, handleUserLeave]);


  const startRecording = async () => {
    const rStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    const recorder = new RecordRTC(rStream, { type: 'video' });
    setRecordStream(rStream);
    setMediaRecorder(recorder);
    recorder.startRecording();
    console.log('Recording started');

    rStream.getTracks().forEach(track => {
      track.onended = () => {
      };
    });
  };

  const stopRecording = () => {
    if (!mediaRecorder || !recordStream) return;

    mediaRecorder.stopRecording(() => {
      const blob = mediaRecorder.getBlob();
      const url = URL.createObjectURL(blob);
      const dateStr = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

      Swal.fire({
        title: 'Save Recording',
        text: 'Do you want to save the recording?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Save',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          const link = document.createElement('a');
          link.href = url;
          link.download = `recorded-video-${dateStr}.webm`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      });
    });

    recordStream.getTracks().forEach(track => track.stop());
    setMediaRecorder(null);
    setRecordStream(null);
  };


  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });

      screenShareON(screenStream);
      setIsScreenSharing(true);

      // Handle end of screen sharing stream
      screenStream.getTracks().forEach(track => {
        track.onended = () => {
          stopScreenShare();
        };
      });


    } catch (error) {
      console.error("Error starting screen share:", error);
    }
  };

  const stopScreenShare = () => {

    const screenStream = players[myId]?.screenStream;

    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
    }


    screenShareOFF(screenStream);
    setIsScreenSharing(false);


  };

  const handleScreenShareStart = useCallback((data) => {
    const { userEmail, userId } = data;
    console.log('User start screen share:', { userEmail });

    const screenStream = players[userId]?.screenStream;


    console.log(screenStream)

    setPlayers(prevPlayers => ({
      ...prevPlayers,
      [userId]: {
        ...prevPlayers[userId],
        screenStream: screenStream,
        screenSharing: true,
        screenPlaying: true
      }
    }));

  }, [setPlayers]);

  const handleScreenShareStop = useCallback((data) => {
    const { userEmail, userId } = data;
    console.log('User stop screen share:', { userEmail });

    const screenStream = players[userId]?.screenStream;

    console.log(screenStream)


    setPlayers(prevPlayers => ({
      ...prevPlayers,
      [userId]: {
        ...prevPlayers[userId],
        screenStream: null,
        screenSharing: false,
        screenPlaying: false
      }
    }));


  }, [setPlayers]);


  useEffect(() => {
    socket.on('screen-share-start', handleScreenShareStart);
    socket.on('screen-share-stop', handleScreenShareStop);

    return () => {
      socket.off('screen-share-start', handleScreenShareStart);
      socket.off('screen-share-stop', handleScreenShareStop);

    }
  }, [socket, handleScreenShareStop, handleScreenShareStart])



  if (error) return <div className="text-black">Error: {error.message}</div>;

  return (
    <div className="relative flex flex-col items-center justify-center h-screen bg-gray-800">
      {loading ? (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      ) : (
        <>
          <div className="absolute top-0 left-0 w-full h-full z-0">
            <div className="w-full flex items-center justify-center h-full relative">
              {Object.keys(players).map((playerId) => {
                const { url, muted, playing, email, screenSharing, screenStream, screenPlaying } = players[playerId];

                return (
                  <div key={playerId} className="relative h-full w-full z-10">

                    {screenSharing && (
                      <div className="absolute h-full w-full z-10">
                        <div className="absolute text-grey-700 bg-white p-2 rounded-lg shadow-md">
                          <span>{email}</span>
                        </div>
                        <ReactPlayer
                          url={screenStream}
                          muted={muted}
                          playing={screenPlaying}
                          height="100%"
                          width="100%"

                        />
                      </div>
                    )}

                    {playing && !screenSharing && (
                      <div className="absolute h-full w-full z-0">
                        <div className="absolute text-grey-700 bg-white p-2 rounded-lg shadow-md">
                          <span>{email}</span>
                        </div>
                        <ReactPlayer
                          url={url}
                          muted={muted}
                          playing={playing}
                          height="100%"
                          width="100%"
                        />
                      </div>
                    )}

                    {!playing && !screenSharing && (
                      <div className="flex h-full w-full items-center justify-center bg-gray-800 text-white text-center">
                        <span className="text-xl font-semibold">{email}</span>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </div>

          <div className="absolute bottom-4 left-4 text-gray-700 dark:text-gray-400 bg-white dark:bg-gray-700 p-2 rounded-lg shadow-md z-20">
            <span className="mr-2">Meeting Code: {roomId}</span>
          </div>

          <div className="absolute bottom-4 text-gray-700 p-2 rounded-lg shadow-md z-30">
            {/* Mute Button */}
            {isMuted ? (
              <button
                onClick={() => {
                  setIsMuted(false);
                  muteAudio();
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded-lg shadow-md focus:outline-none"
              >
                <Mic size={24} />
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsMuted(true);
                  unmuteAudio();
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded-lg shadow-md focus:outline-none"
              >
                <MicOff size={24} />
              </button>
            )}

            {/* Playing Button */}
            {isPlaying ? (
              <button
                onClick={() => {
                  pauseVideo();
                  setIsPlaying(false);
                }}
                className="px-3 py-1 ml-2 bg-blue-500 text-white rounded-lg shadow-md focus:outline-none"
              >
                <Video size={24} />
              </button>
            ) : (

              <button
                onClick={() => {
                  playVideo();
                  setIsPlaying(true);
                }}
                className="px-3 py-1 ml-2 bg-blue-500 text-white rounded-lg shadow-md focus:outline-none"
              >
                <VideoOff size={24} />

              </button>
            )}

            {/* Screen Share Button */}
            {isScreenSharing ? (

              <button
                onClick={() => {
                  stopScreenShare();
                }}
                className="px-3 py-1 ml-2 bg-red-500 text-white rounded-lg shadow-md focus:outline-none"
              >
                <Airplay size={24} />
              </button>
            ) : (

              <button
                onClick={() => {
                  startScreenShare();
                }}
                className="px-3 py-1 ml-2 bg-green-500 text-white rounded-lg shadow-md focus:outline-none"
              >

                <MonitorUp size={24} />
              </button>
            )}

            {/* Screen Recording Button */}

            {isRecording ? (
              <button
                onClick={() => {
                  setIsRecording(false);
                  stopRecording();

                }}
                className="px-3 py-1 ml-2 bg-red-500 text-white rounded-lg shadow-md focus:outline-none"
              >
                <Circle size={24} />
              </button>
            ) : (
              <button

                onClick={() => {
                  setIsRecording(true);
                  startRecording();
                }}
                className="px-3 py-1 ml-2 bg-yellow-500 text-white rounded-lg shadow-md focus:outline-none"
              >
                <CircleStop size={24} />
              </button>
            )}

            {/* End Call Button */}
            <button
              onClick={endCall}
              className="px-3 py-1 ml-2 bg-red-500 text-white rounded-lg shadow-md focus:outline-none"
            >
              <Phone size={24} />
            </button>
          </div>

        </>
      )
      }
    </div >
  );
};

export default RoomPage;

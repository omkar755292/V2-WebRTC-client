import React, { createContext, useState, useEffect, useContext } from 'react';

const PeerContext = createContext();

export const usePeerContext = () => {
    return useContext(PeerContext);
};

export const PeerContextProvider = (props) => {
    const [peer, setPeer] = useState(null);

    useEffect(() => {

        const peerInstance = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:global.stun.twilio.com:3478" }
            ]
        });
        setPeer(peerInstance);

        return () => {
            peerInstance.close();
        };
    }, []);

    const createOffer = async () => {

        try {
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            return offer;
        } catch (error) {
            console.error("Error creating offer: ", error);
        }

    };

    const createAnswer = async (offer) => {

        try {
            await peer.setRemoteDescription(offer);
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            return answer;
        } catch (error) {
            console.error("Error creating answer: ", error);
        }

    };

    const setRemoteAnswer = async (answer) =>{

        try {
            await peer.setRemoteDescription(answer);
        } catch (error) {
            console.error("Error saving answer: ", error);
        }

    }

    const value = { peer, createOffer, createAnswer, setRemoteAnswer };

    return (
        <PeerContext.Provider value={value}>
            {props.children}
        </PeerContext.Provider>
    );
};

import React, { useEffect, useState, useRef } from 'react';

const useMediaStream = () => {
    const [stream, setStream] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isStreamSet = useRef(false);

    const getMediaStream = async () => {
        if (isStreamSet.current) return;

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            setStream(mediaStream);
            setLoading(false);
            isStreamSet.current = true;
        } catch (err) {
            console.error('Error accessing media devices:', err);
            setError(err);
            setLoading(false)
        }
    };

    useEffect(() => {
        getMediaStream();
    }, []);

    return { stream, loading, error };
};

export default useMediaStream;

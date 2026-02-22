import React, { useEffect, useRef } from "react";

const FacialAnalysis = ({ onUpdate }) => {
  const WS_URL = "ws://localhost:8000/ws";

  const videoRef = useRef(null);
  const wsRef = useRef(null);
  const sendTimerRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const captureCanvasRef = useRef(null); // hidden canvas for capture

  const interval = 100; // ms
  let backoff = useRef(500);
  const maxBackoff = 10000;

  // starting camera
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // create hidden canvas for frame capture
        captureCanvasRef.current = document.createElement("canvas");
        captureCanvasRef.current.width = 640;
        captureCanvasRef.current.height = 480;

        connectWebSocket();
      } catch (err) {
        console.error("Camera error:", err.message);
      }
    }
    startCamera();

    return () => {
      stopSending();
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // websocket connection
  const connectWebSocket = () => {
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    )
      return;

    wsRef.current = new WebSocket(WS_URL);

    wsRef.current.onopen = () => {
      backoff.current = 500;
      startSending();
    };

    wsRef.current.onmessage = (ev) => {
      try {
        const obj = JSON.parse(ev.data);
        if (onUpdate) {
          onUpdate({
            eye: obj.eye_direction || "—",
            head: obj.head_direction || "—",
            mouth: obj.mouth_state || "—",
          });
        }
      } catch (e) {
        console.warn("Non-JSON message:", ev.data);
      }
    };

    wsRef.current.onerror = () => {
      console.warn("WebSocket error");
    };

    wsRef.current.onclose = () => {
      stopSending();
      scheduleReconnect();
    };
  };

  // reconnect with backoff
  const scheduleReconnect = () => {
    if (reconnectTimerRef.current) return;
    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      backoff.current = Math.min(maxBackoff, backoff.current * 1.5);
      connectWebSocket();
    }, backoff.current);
  };

  // start sending webcam frames 
  const startSending = () => {
    stopSending();
    sendTimerRef.current = setInterval(sendFrameIfReady, interval);
  };

  // stop sending webcam frames
  const stopSending = () => {
    if (sendTimerRef.current) {
      clearInterval(sendTimerRef.current);
      sendTimerRef.current = null;
    }
  };

  // send frame using websocket
  const sendFrameIfReady = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (!videoRef.current || videoRef.current.readyState < videoRef.current.HAVE_ENOUGH_DATA) return;

    try {
      const canvas = captureCanvasRef.current;
      const ctx = canvas.getContext("2d");

      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
      wsRef.current.send(dataUrl);
    } catch (e) {
      console.warn("sendFrame error", e);
    }
  };

  return (
    <div className="flex justify-center items-center w-full rounded-md">
      <div className="relative w-full max-w-3xl">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-60 object-cover rounded-md"
        />
      </div>
    </div>
  );
};

export default FacialAnalysis;

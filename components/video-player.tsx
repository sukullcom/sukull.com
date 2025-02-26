// components/VideoPlayer.tsx

"use client";

import React from "react";
import ReactPlayer from "react-player/youtube";

interface VideoPlayerProps {
  videoId: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId }) => {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <div className="player-wrapper rounded-xl overflow-hidden mb-4 shadow-lg" style={{ position: "relative", paddingTop: "56.25%" }}>
      <ReactPlayer
        url={videoUrl}
        className="react-player"
        width="100%"
        height="100%"
        style={{ position: "absolute", top: 0, left: 0 }}
        controls
      />
    </div>
  );
};

export default VideoPlayer;

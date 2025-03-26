// types/global.d.ts

export {};

declare global {
  interface Window {
    YT: {
      Player: {
        new (elementId: string, options: {
          videoId?: string;
          playerVars?: Record<string, unknown>;
          events?: Record<string, (event: { target: unknown }) => void>;
        }): {
          loadVideoById: (videoId: string) => void;
          cueVideoById: (videoId: string) => void;
          playVideo: () => void;
          pauseVideo: () => void;
          stopVideo: () => void;
          getPlayerState: () => number;
        };
      };
      PlayerState?: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
  }
}

"use client";

const SAMPLE_VIDEO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

export default function VideoPlayer() {
  return (
    <div className="video-player-wrap relative aspect-video w-full overflow-hidden rounded-xl">
      <video
        className="h-full w-full object-cover"
        src={SAMPLE_VIDEO}
        autoPlay
        muted
        loop
        playsInline
      />
    </div>
  );
}

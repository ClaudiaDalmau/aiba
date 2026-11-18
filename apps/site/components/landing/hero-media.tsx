"use client";
import { useState } from "react";
import Image from "next/image";
import { Play, Pause } from "lucide-react";

type HeroMediaProps = {
  imageSrc: string;
  imageAlt: string;
  videoSrc?: string;
  videoPoster?: string;
};

/**
 * Iter67 — HeroMedia: shows a static image by default, but if `videoSrc`
 * is provided renders an overlaid play button that swaps to <video> on
 * demand. This lets us ship a video demo without forcing every visitor
 * to autoplay heavy media.
 */
export default function HeroMedia({ imageSrc, imageAlt, videoSrc, videoPoster }: HeroMediaProps) {
  const [playing, setPlaying] = useState(false);

  if (!videoSrc) {
    return (
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        priority
        sizes="(min-width: 768px) 55vw, 100vw"
        className="object-cover object-center rounded-2xl"
      />
    );
  }

  if (playing) {
    return (
      <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black">
        <video
          src={videoSrc}
          poster={videoPoster || imageSrc}
          autoPlay
          controls
          playsInline
          className="w-full h-full object-cover"
          onEnded={() => setPlaying(false)}
        />
        <button
          onClick={() => setPlaying(false)}
          aria-label="Pausar demo"
          className="absolute top-3 right-3 h-9 w-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center"
        >
          <Pause className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Image
        src={videoPoster || imageSrc}
        alt={imageAlt}
        fill
        priority
        sizes="(min-width: 768px) 55vw, 100vw"
        className="object-cover object-center rounded-2xl"
      />
      <button
        onClick={() => setPlaying(true)}
        aria-label="Ver demo en vídeo"
        className="absolute inset-0 flex items-center justify-center group"
      >
        <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-white/90 group-hover:bg-white group-hover:scale-110 transition-all shadow-xl flex items-center justify-center">
          <Play className="h-6 w-6 md:h-8 md:w-8 text-violet-600 ml-1" fill="currentColor" />
        </div>
        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap">
          ▶ Ver demo · 45 seg
        </span>
      </button>
    </div>
  );
}

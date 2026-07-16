'use client'
import { useEffect, useRef, useState } from 'react'
import styles from './VoiceNote.module.css'

function formatTime(sec) {
  const s = Math.max(0, Math.round(sec || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export default function VoiceNote({ src, duration }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0-1
  const [currentTime, setCurrentTime] = useState(0);
  const [knownDuration, setKnownDuration] = useState(duration || 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    function onTime() {
      setCurrentTime(audio.currentTime);
      if (audio.duration && Number.isFinite(audio.duration)) {
        setProgress(audio.currentTime / audio.duration);
      }
    }
    function onLoaded() {
      if (audio.duration && Number.isFinite(audio.duration)) setKnownDuration(audio.duration);
    }
    function onEnd() {
      setPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    }
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnd);
    };
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  }

  function seek(e) {
    const audio = audioRef.current;
    if (!audio || !knownDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * knownDuration;
  }

  return (
    <div className={styles.voiceNote}>
      <audio ref={audioRef} src={src} preload="metadata" />
      <button type="button" className={styles.playBtn} onClick={toggle} aria-label={playing ? 'Simamisha' : 'Cheza'}>
        <i className={playing ? 'ri-pause-fill' : 'ri-play-fill'} />
      </button>
      <div className={styles.track} onClick={seek}>
        <div className={styles.fill} style={{ width: `${Math.min(1, progress) * 100}%` }} />
      </div>
      <span className={styles.time}>
        {formatTime(playing || currentTime > 0 ? currentTime : knownDuration)}
      </span>
    </div>
  );
}

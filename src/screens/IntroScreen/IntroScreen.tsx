import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import s from "./IntroScreen.module.scss";

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

interface Props {
  onComplete: () => void;
}

/**
 * 앱 실행 시마다 표시되는 브랜드 인트로 화면.
 * 애니메이션 완료 후 onComplete를 호출해 상위에서 홈 화면으로 전환.
 */
export default function IntroScreen({ onComplete }: Props) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // 2.5초 후 페이드아웃 시작
    const fadeTimer = setTimeout(() => setFading(true), 2500);
    // 페이드아웃(0.4s) 완료 후 홈 전환
    const doneTimer = setTimeout(() => {
      // 네이티브에 인트로 완료 알림
      window.ReactNativeWebView?.postMessage(JSON.stringify({ type: "introComplete" }));
      onComplete();
    }, 2900);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <motion.div
      className={s.screen}
      animate={{ opacity: fading ? 0 : 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.img
        src="/triply-icon.svg"
        className={s.logo}
        alt="Triply"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
      />

      <motion.span
        className={s.title}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.4, ease: "easeOut" }}
      >
        TRIPLY
      </motion.span>
    </motion.div>
  );
}

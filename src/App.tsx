import { lazy, Suspense, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import HomeScreen from "./screens/HomeScreen/HomeScreen";
import IntroScreen from "./screens/IntroScreen/IntroScreen";

// 홈 이외 화면은 lazy — 초기 번들에서 제외해 첫 로드 속도 개선
const CreateScreen = lazy(() => import("./screens/CreateScreen/CreateScreen"));
const TripScreen = lazy(() => import("./screens/TripScreen/TripScreen"));
const SettleScreen = lazy(() => import("./screens/SettleScreen/SettleScreen"));
const HiddenRoomsScreen = lazy(() => import("./screens/HiddenRoomsScreen/HiddenRoomsScreen"));

function RootRoute() {
  // 같은 세션 내 화면 이동 후 홈 복귀 시 인트로가 다시 나오지 않도록 sessionStorage에 유지
  const [introDone, setIntroDone] = useState(
    () => sessionStorage.getItem("triply_intro_done") === "1",
  );

  if (!introDone) {
    return (
      <IntroScreen
        onComplete={() => {
          sessionStorage.setItem("triply_intro_done", "1");
          setIntroDone(true);
        }}
      />
    );
  }

  return (
    <motion.div
      style={{ position: "absolute", inset: 0 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <HomeScreen />
    </motion.div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/create" element={<CreateScreen />} />
          <Route path="/room/:roomId" element={<TripScreen />} />
          <Route path="/room/:roomId/settle" element={<SettleScreen />} />
          <Route path="/hidden" element={<HiddenRoomsScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

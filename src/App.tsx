import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomeScreen from './screens/HomeScreen/HomeScreen';

// 홈 이외 화면은 lazy — 초기 번들에서 제외해 첫 로드 속도 개선
const CreateScreen = lazy(() => import('./screens/CreateScreen/CreateScreen'));
const TripScreen = lazy(() => import('./screens/TripScreen/TripScreen'));
const SettleScreen = lazy(() => import('./screens/SettleScreen/SettleScreen'));
const HiddenRoomsScreen = lazy(() => import('./screens/HiddenRoomsScreen/HiddenRoomsScreen'));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
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

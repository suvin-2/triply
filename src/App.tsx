import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomeScreen from './screens/HomeScreen/HomeScreen';
import CreateScreen from './screens/CreateScreen/CreateScreen';
import TripScreen from './screens/TripScreen/TripScreen';
import SettleScreen from './screens/SettleScreen/SettleScreen';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/create" element={<CreateScreen />} />
        <Route path="/room/:roomId" element={<TripScreen />} />
        <Route path="/room/:roomId/settle" element={<SettleScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

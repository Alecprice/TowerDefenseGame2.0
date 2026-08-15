import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Container from '@mui/material/Container';
import ScrollToTop from './components/utils/ScrollToTop';
import GameErrorBoundary from './components/objects/GameErrorBoundary';
import OfflineStatus from './components/objects/OfflineStatus';
import './components/utils/contentExpansionRuntime';
import 'bootstrap/dist/css/bootstrap.min.css';

const HomePage = lazy(() => import('./components/pages/HomePage'));
const MapSelectPage = lazy(() => import('./components/pages/MapSelectPage'));
const LoginPage = lazy(() => import('./components/pages/LoginPage'));
const GamePage = lazy(() => import('./components/pages/GamePage'));
const GamePageV3 = lazy(() => import('./components/pages/GamePageV3'));
const ScoresPage = lazy(() => import('./components/pages/ScoresPage'));
const UpgradesPage = lazy(() => import('./components/pages/UpgradesPage'));
const AchievementsPage = lazy(() => import('./components/pages/AchievementsPage'));

const RouteFallback = () => <div className="route-loading">Loading...</div>;

const App = () => (
    <GameErrorBoundary>
        <Router>
            <ScrollToTop />
            <Container maxWidth="lg">
                <Suspense fallback={<RouteFallback />}>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/play" element={<MapSelectPage />} />
                        <Route path="/play3" element={<MapSelectPage mode="v3" />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/game" element={<GamePage />} />
                        <Route path="/game3" element={<GamePageV3 />} />
                        <Route path="/scores" element={<ScoresPage />} />
                        <Route path="/upgrades" element={<UpgradesPage />} />
                        <Route path="/achievements" element={<AchievementsPage />} />
                    </Routes>
                </Suspense>
            </Container>
            <OfflineStatus />
        </Router>
    </GameErrorBoundary>
);

export default App;

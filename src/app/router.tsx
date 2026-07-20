import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import RequireAuth from "./RequireAuth";
import HomePage from "../pages/HomePage";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import MagicLinkVerifyPage from "../pages/MagicLinkVerifyPage";
import PrivacyPolicyPage from "../pages/PrivacyPolicyPage";
import DataDeletionPage from "../pages/DataDeletionPage";
import SessionPage from "../pages/SessionPage";
import MovieNightsPage from "../pages/movieNights/MovieNightsPage";
import MovieNightDetailPage from "../pages/movieNights/MovieNightDetailPage";
import MovieDetailPage from "../pages/movies/MovieDetailPage";
import type { MovieDetailLocationState } from "../features/movies/moviePresentation";

function AppRoutes() {
  const location = useLocation();
  const state = location.state as MovieDetailLocationState | null;
  const backgroundLocation = state?.backgroundLocation;

  return (
    <>
      <Routes location={backgroundLocation ?? location}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<LandingPage />} />
        <Route path="/how-it-works" element={<LandingPage />} />
        <Route path="/movie-night-picker" element={<LandingPage />} />
        <Route path="/watch-party-picker" element={<LandingPage />} />
        <Route path="/auth/magic-link/verify" element={<MagicLinkVerifyPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/data-deletion" element={<DataDeletionPage />} />
        <Route path="/delete-data" element={<DataDeletionPage />} />
        <Route
          path="/app"
          element={
            <RequireAuth>
              <HomePage />
            </RequireAuth>
          }
        />
        <Route
          path="/app/session"
          element={
            <RequireAuth>
              <SessionPage />
            </RequireAuth>
          }
        />
        <Route
          path="/app/groups/:groupId/movie-nights"
          element={
            <RequireAuth>
              <MovieNightsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/app/groups/:groupId/movie-nights/:sessionId"
          element={
            <RequireAuth>
              <MovieNightDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/app/groups/:groupId/movies/:reference"
          element={
            <RequireAuth>
              <MovieDetailPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {backgroundLocation ? (
        <Routes>
          <Route
            path="/app/groups/:groupId/movies/:reference"
            element={
              <RequireAuth>
                <MovieDetailPage presentation="overlay" />
              </RequireAuth>
            }
          />
        </Routes>
      ) : null}
    </>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

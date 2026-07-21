import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { lazy, Suspense, type ReactNode } from "react";
import LazyLoadingState from "../components/LazyLoadingState";
import type { MovieDetailLocationState } from "../features/movies/moviePresentation";
import {
  loadDataDeletionPage,
  loadHomePage,
  loadInsightsPage,
  loadLandingPage,
  loadLoginPage,
  loadMagicLinkVerifyPage,
  loadMovieDetailPage,
  loadMovieNightDetailPage,
  loadMovieNightsPage,
  loadPrivacyPolicyPage,
  loadRequireAuth,
  loadSessionPage,
} from "./routeLoaders";

const RequireAuth = lazy(loadRequireAuth);
const LandingPage = lazy(loadLandingPage);
const LoginPage = lazy(loadLoginPage);
const MagicLinkVerifyPage = lazy(loadMagicLinkVerifyPage);
const PrivacyPolicyPage = lazy(loadPrivacyPolicyPage);
const DataDeletionPage = lazy(loadDataDeletionPage);
const HomePage = lazy(loadHomePage);
const SessionPage = lazy(loadSessionPage);
const MovieNightsPage = lazy(loadMovieNightsPage);
const MovieNightDetailPage = lazy(loadMovieNightDetailPage);
const InsightsPage = lazy(loadInsightsPage);
const MovieDetailPage = lazy(loadMovieDetailPage);

function RouteBoundary({
  children,
  label,
  overlay = false,
}: {
  children: ReactNode;
  label: string;
  overlay?: boolean;
}) {
  return (
    <Suspense fallback={<LazyLoadingState label={label} overlay={overlay} />}>
      {children}
    </Suspense>
  );
}

function ProtectedRoute({
  children,
  loadingLabel,
}: {
  children: ReactNode;
  loadingLabel: string;
}) {
  return (
    <RouteBoundary label={loadingLabel}>
      <RequireAuth>{children}</RequireAuth>
    </RouteBoundary>
  );
}

function LandingRoute() {
  return (
    <RouteBoundary label="Opening Arbiter…">
      <LandingPage />
    </RouteBoundary>
  );
}

function MovieDetailRoute({
  presentation,
}: {
  presentation?: "page" | "overlay";
}) {
  return (
    <RouteBoundary
      label="Opening film details…"
      overlay={presentation === "overlay"}
    >
      <RequireAuth>
        <MovieDetailPage presentation={presentation} />
      </RequireAuth>
    </RouteBoundary>
  );
}

function AppRoutes() {
  const location = useLocation();
  const state = location.state as MovieDetailLocationState | null;
  const backgroundLocation = state?.backgroundLocation;

  return (
    <>
      <Routes location={backgroundLocation ?? location}>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/about" element={<LandingRoute />} />
        <Route path="/how-it-works" element={<LandingRoute />} />
        <Route path="/movie-night-picker" element={<LandingRoute />} />
        <Route path="/watch-party-picker" element={<LandingRoute />} />
        <Route
          path="/auth/magic-link/verify"
          element={
            <RouteBoundary label="Verifying your sign-in…">
              <MagicLinkVerifyPage />
            </RouteBoundary>
          }
        />
        <Route
          path="/login"
          element={
            <RouteBoundary label="Opening sign in…">
              <LoginPage />
            </RouteBoundary>
          }
        />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route
          path="/privacy"
          element={
            <RouteBoundary label="Opening privacy policy…">
              <PrivacyPolicyPage />
            </RouteBoundary>
          }
        />
        <Route
          path="/privacy-policy"
          element={
            <RouteBoundary label="Opening privacy policy…">
              <PrivacyPolicyPage />
            </RouteBoundary>
          }
        />
        <Route
          path="/data-deletion"
          element={
            <RouteBoundary label="Opening data deletion…">
              <DataDeletionPage />
            </RouteBoundary>
          }
        />
        <Route
          path="/delete-data"
          element={
            <RouteBoundary label="Opening data deletion…">
              <DataDeletionPage />
            </RouteBoundary>
          }
        />
        <Route
          path="/app"
          element={
            <ProtectedRoute loadingLabel="Opening your watchlist…">
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/session"
          element={
            <ProtectedRoute loadingLabel="Opening the movie night…">
              <SessionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/groups/:groupId/movie-nights"
          element={
            <ProtectedRoute loadingLabel="Opening movie nights…">
              <MovieNightsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/groups/:groupId/movie-nights/:sessionId"
          element={
            <ProtectedRoute loadingLabel="Opening this movie night…">
              <MovieNightDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/groups/:groupId/insights"
          element={
            <ProtectedRoute loadingLabel="Opening group insights…">
              <InsightsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/groups/:groupId/movies/:reference"
          element={<MovieDetailRoute />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {backgroundLocation ? (
        <Routes>
          <Route
            path="/app/groups/:groupId/movies/:reference"
            element={<MovieDetailRoute presentation="overlay" />}
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

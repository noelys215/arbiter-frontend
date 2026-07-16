import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import RequireAuth from "./RequireAuth";
import HomePage from "../pages/HomePage";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import MagicLinkVerifyPage from "../pages/MagicLinkVerifyPage";
import PrivacyPolicyPage from "../pages/PrivacyPolicyPage";
import DataDeletionPage from "../pages/DataDeletionPage";
import SessionPage from "../pages/SessionPage";
import InvitePage from "../pages/InvitePage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<LandingPage />} />
        <Route path="/how-it-works" element={<LandingPage />} />
        <Route path="/movie-night-picker" element={<LandingPage />} />
        <Route path="/watch-party-picker" element={<LandingPage />} />
        <Route path="/auth/magic-link/verify" element={<MagicLinkVerifyPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/invite/friend/:token" element={<InvitePage type="friend" />} />
        <Route path="/invite/group/:token" element={<InvitePage type="group" />} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

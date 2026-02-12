import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import RequireAuth from "./RequireAuth";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import PrivacyPolicyPage from "../pages/PrivacyPolicyPage";
import DataDeletionPage from "../pages/DataDeletionPage";
import SessionPage from "../pages/SessionPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <RequireAuth>
              <Navigate to="/app" replace />
            </RequireAuth>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
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
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

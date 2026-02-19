import { Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getMe } from "../features/auth/auth.api";

type RequireAuthProps = {
  children: ReactNode;
};

export default function RequireAuth({ children }: RequireAuthProps) {
  const location = useLocation();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#140C0A] text-[#E0B15C]">
        <Spinner color="default" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    );
  }

  return <>{children}</>;
}

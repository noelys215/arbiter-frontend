import { Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { getMe } from "../features/auth/auth.api";
import { broadcastAuthSuccess } from "../features/auth/authHandoff";

type RequireAuthProps = {
  children: ReactNode;
};

export default function RequireAuth({ children }: RequireAuthProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
  });

  useEffect(() => {
    if (!data) return;
    const params = new URLSearchParams(location.search);
    if (params.get("auth") !== "magic-link") return;

    broadcastAuthSuccess("magic-link");
    params.delete("auth");
    const nextSearch = params.toString();
    void navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: true },
    );
  }, [data, location.pathname, location.search, navigate]);

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

import {
  Modal,
  ModalBody,
  ModalContent,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import MovieDetailContent, {
  MovieDetailFailure,
  MovieDetailLoading,
} from "../../features/movies/MovieDetailContent";
import { getMovieDetail, movieQueryKeys } from "../../features/movies/movies.api";
import MovieNightsShell from "../movieNights/MovieNightsShell";

type MovieDetailPageProps = {
  presentation?: "page" | "overlay";
};

export default function MovieDetailPage({
  presentation = "page",
}: MovieDetailPageProps) {
  const { groupId = "", reference = "" } = useParams();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const navigate = useNavigate();
  const detailQuery = useQuery({
    queryKey: movieQueryKeys.detail(groupId, reference, sessionId),
    queryFn: () => getMovieDetail(groupId, reference, sessionId),
    enabled: Boolean(groupId && reference),
  });
  useEffect(() => {
    if (!detailQuery.data) return;
    const previousTitle = document.title;
    const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previousRobots = robots?.content;
    document.title = `${detailQuery.data.title} | Arbiter`;
    if (robots) robots.content = "noindex, nofollow";
    return () => {
      document.title = previousTitle;
      if (robots && previousRobots) robots.content = previousRobots;
    };
  }, [detailQuery.data]);
  const close = () => {
    if (presentation === "overlay") {
      navigate(-1);
      return;
    }
    navigate("/app");
  };
  const content = detailQuery.isPending ? (
    <MovieDetailLoading />
  ) : detailQuery.isError || !detailQuery.data ? (
    <MovieDetailFailure onClose={close} />
  ) : (
    <MovieDetailContent movie={detailQuery.data} onClose={close} compact={presentation === "overlay"} />
  );

  if (presentation === "overlay") {
    return (
      <Modal
        isOpen
        onOpenChange={(isOpen) => {
          if (!isOpen) close();
        }}
        scrollBehavior="inside"
        size="5xl"
        backdrop="opaque"
        classNames={{
          backdrop: "bg-[#080403]/72",
          base: "max-h-[94dvh] overflow-hidden border border-[#E0B15C]/18 bg-[#140C0A] text-[#F7EAD2] sm:rounded-lg",
          closeButton: "z-30 m-3 h-11 w-11 text-[#F7EAD2] hover:bg-[#E0B15C]/10 focus-visible:outline-3 focus-visible:outline-[#F2C16E]",
        }}
        aria-labelledby="movie-detail-heading"
      >
        <ModalContent>
          <ModalBody className="p-0">{content}</ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return <MovieNightsShell>{content}</MovieNightsShell>;
}

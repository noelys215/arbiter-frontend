import { Button } from "@heroui/react";
import DealtCardsModal from "./session/components/DealtCardsModal";
import SessionDeckSection from "./session/components/SessionDeckSection";
import SessionHeader from "./session/components/SessionHeader";
import {
  SessionLoadingState,
  SessionUnavailableState,
} from "./session/components/SessionStates";
import ShortlistModal from "./session/components/ShortlistModal";
import VibeSelectionCard from "./session/components/VibeSelectionCard";
import { useSessionFlow } from "./session/hooks/useSessionFlow";
import SkipLink from "../components/SkipLink";
import { useLocation } from "react-router-dom";
import "./session/SessionPage.css";

export default function SessionPage() {
  const location = useLocation();
  const {
    groups,
    groupsLoading,
    groupsError,
    me,
    selectedGroup,
    resolvedGroupId,

    isGroupLeader,
    activeSessionId,
    endSessionMutation,
    generateDeckMutation,
    shuffleMutation,

    hasSubmittedDeck,
    moodCues,
    moodCuesLoading,
    selectedMoodCueIds,
    customMoodText,
    setCustomMoodText,
    maxRuntime,
    setMaxRuntime,
    availableGenreTags,
    selectedTags,
    sessionContext,

    userLocked,
    sessionPhase,

    deckSectionRef,
    swipeDeckRef,

    sessionStatus,
    winnerWatchlistItemId,
    tieBreakRequired,
    watchPartyUrl,
    watchPartyError,
    completion,
    completionError,
    showLeaderEndedCard,
    showPlaceholderDeck,
    showWaitingCard,
    stackCards,
    deckPhase,
    shuffleSeed,
    currentIndex,
    setCurrentIndex,
    canSwipe,
    canUndoSwipe,
    undoSwipeIsPending,
    localVotes,
    swipedCount,
    totalCards,
    userSecondsLeft,
    showShortlistButton,
    sortedCards,
    isDeckComplete,

    shortlist,
    voteSummaries,
    shortlistModal,
    personalPreviewModal,
    personalPreviewCards,

    handleToggleTag,
    handleToggleMoodCue,
    handleGenerateDeck,
    handleConfirmDeal,
    handleBackToVibeSelection,
    handleSwipe,
    handleUndoSwipe,
    handleProgrammaticSwipe,
    handleShuffleToDecide,
    handleSetWatchPartyUrl,
    handleCompleteSession,
    handleWatchedStatus,
    handleWatchPartyHandoff,
    goHome,
    handleEndSession,
    handleLeaveSession,
    getReadableVote,
    watchPartyMutation,
    completeSessionMutation,
    watchedStatusMutation,
  } = useSessionFlow();

  if (groupsLoading) {
    return <SessionLoadingState />;
  }

  if (groupsError || !groups || groups.length === 0) {
    return <SessionUnavailableState onGoHome={goHome} />;
  }

  const sessionExitAction = activeSessionId ? (
    <Button
      size="sm"
      variant="secondary"
      className="app-danger-button h-10 px-4"
      isPending={isGroupLeader ? endSessionMutation.isPending : false}
      onPress={isGroupLeader ? handleEndSession : handleLeaveSession}
    >
      {isGroupLeader ? "End Session" : "Leave Session"}
    </Button>
  ) : null;

  return (
    <div className="min-h-screen bg-[#140C0A] text-white">
      <SkipLink />
      <SessionHeader
        user={me}
        userName={me?.display_name ?? me?.username ?? "User"}
        userEmail={me?.email ?? ""}
        sessionAction={sessionExitAction}
        onGoHome={goHome}
      />

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6"
      >
        {!hasSubmittedDeck ? (
          <VibeSelectionCard
            selectedGroupName={selectedGroup?.name ?? "Current group"}
            moodCues={moodCues}
            moodCuesLoading={moodCuesLoading}
            selectedMoodCueIds={selectedMoodCueIds}
            onToggleMoodCue={handleToggleMoodCue}
            availableGenreTags={availableGenreTags}
            selectedGenreTags={selectedTags}
            onToggleGenre={handleToggleTag}
            maxRuntime={maxRuntime}
            onMaxRuntimeChange={setMaxRuntime}
            customMoodText={customMoodText}
            onCustomMoodTextChange={setCustomMoodText}
            isGenerating={generateDeckMutation.isPending}
            isGenerateDisabled={
              !resolvedGroupId ||
              userLocked ||
              sessionPhase === "swiping" ||
              (selectedMoodCueIds.length === 0 &&
                selectedTags.length === 0 &&
                maxRuntime === null &&
                customMoodText.trim().length === 0)
            }
            generateLabel={
              generateDeckMutation.isPending
                ? "Dealing…"
                : sessionPhase === "swiping"
                  ? "Deck ready"
                  : "Deal the deck"
            }
            onGenerate={handleGenerateDeck}
          />
        ) : null}

        <SessionDeckSection
          groupId={resolvedGroupId ?? ""}
          sessionId={activeSessionId}
          backgroundLocation={location}
          deckSectionRef={deckSectionRef}
          sessionPhase={sessionPhase}
          sessionStatus={sessionStatus}
          winnerWatchlistItemId={winnerWatchlistItemId}
          tieBreakRequired={tieBreakRequired}
          watchPartyUrl={watchPartyUrl}
          watchPartyError={watchPartyError}
          completion={completion}
          completionError={completionError}
          showLeaderEndedCard={showLeaderEndedCard}
          showPlaceholderDeck={showPlaceholderDeck}
          showWaitingCard={showWaitingCard}
          stackCards={stackCards}
          deckPhase={deckPhase}
          shuffleSeed={shuffleSeed}
          swipeDeckRef={swipeDeckRef}
          currentIndex={currentIndex}
          onCurrentIndexChange={setCurrentIndex}
          onSwipe={handleSwipe}
          canSwipe={canSwipe}
          canUndoSwipe={canUndoSwipe}
          undoSwipeIsPending={undoSwipeIsPending}
          sessionContext={sessionContext}
          localVotes={localVotes}
          onUndoSwipe={handleUndoSwipe}
          onProgrammaticSwipe={handleProgrammaticSwipe}
          swipedCount={swipedCount}
          totalCards={totalCards}
          userSecondsLeft={userSecondsLeft}
          showShortlistButton={showShortlistButton}
          onOpenShortlist={shortlistModal.open}
          isGroupLeader={isGroupLeader}
          onShuffleWinner={handleShuffleToDecide}
          shuffleIsPending={shuffleMutation.isPending}
          watchPartyIsUpdating={watchPartyMutation.isPending}
          onSetWatchPartyUrl={handleSetWatchPartyUrl}
          onCompleteSession={handleCompleteSession}
          onWatchedStatus={handleWatchedStatus}
          onWatchPartyHandoff={handleWatchPartyHandoff}
          completionIsPending={completeSessionMutation.isPending}
          watchedStatusIsPending={watchedStatusMutation.isPending}
          sortedCardsLength={sortedCards.length}
          isDeckComplete={isDeckComplete}
          onGoHome={goHome}
        />
      </main>

      <DealtCardsModal
        isOpen={personalPreviewModal.isOpen}
        onOpenChange={personalPreviewModal.setOpen}
        cards={personalPreviewCards}
        isSubmitting={generateDeckMutation.isPending}
        onBack={handleBackToVibeSelection}
        onContinue={handleConfirmDeal}
      />

      <ShortlistModal
        isOpen={shortlistModal.isOpen}
        onOpenChange={shortlistModal.setOpen}
        shortlist={shortlist}
        voteSummaries={voteSummaries}
        localVotes={localVotes}
        winnerWatchlistItemId={winnerWatchlistItemId}
        getReadableVote={getReadableVote}
      />
    </div>
  );
}

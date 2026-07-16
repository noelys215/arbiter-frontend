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
import "./session/SessionPage.css";

export default function SessionPage() {
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
    vibeInputMode,
    setVibeInputMode,
    availableGenreTags,
    selectedTags,
    aiMoodInput,
    setAiMoodInput,
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
    handleGenerateDeck,
    handleConfirmDeal,
    handleBackToVibeSelection,
    handleSwipe,
    handleUndoSwipe,
    handleProgrammaticSwipe,
    handleShuffleToDecide,
    handleSetWatchPartyUrl,
    goHome,
    handleEndSession,
    handleLeaveSession,
    getReadableVote,
    watchPartyMutation,
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
      variant="bordered"
      className="app-danger-button h-10 px-4"
      isLoading={isGroupLeader ? endSessionMutation.isPending : false}
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
            vibeInputMode={vibeInputMode}
            onVibeInputModeChange={setVibeInputMode}
            availableGenreTags={availableGenreTags}
            selectedTags={selectedTags}
            onToggleTag={handleToggleTag}
            aiMoodInput={aiMoodInput}
            onAiMoodInputChange={setAiMoodInput}
            sessionContext={sessionContext}
            isGenerating={generateDeckMutation.isPending}
            isGenerateDisabled={
              !resolvedGroupId ||
              userLocked ||
              sessionPhase === "swiping" ||
              (selectedTags.length === 0 && aiMoodInput.trim().length === 0)
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
          deckSectionRef={deckSectionRef}
          sessionPhase={sessionPhase}
          sessionStatus={sessionStatus}
          winnerWatchlistItemId={winnerWatchlistItemId}
          tieBreakRequired={tieBreakRequired}
          watchPartyUrl={watchPartyUrl}
          watchPartyError={watchPartyError}
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
          onOpenShortlist={shortlistModal.onOpen}
          isGroupLeader={isGroupLeader}
          onShuffleWinner={handleShuffleToDecide}
          shuffleIsPending={shuffleMutation.isPending}
          watchPartyIsUpdating={watchPartyMutation.isPending}
          onSetWatchPartyUrl={handleSetWatchPartyUrl}
          sortedCardsLength={sortedCards.length}
          isDeckComplete={isDeckComplete}
          onGoHome={goHome}
        />
      </main>

      <DealtCardsModal
        isOpen={personalPreviewModal.isOpen}
        onOpenChange={personalPreviewModal.onOpenChange}
        cards={personalPreviewCards}
        isSubmitting={generateDeckMutation.isPending}
        onBack={handleBackToVibeSelection}
        onContinue={handleConfirmDeal}
      />

      <ShortlistModal
        isOpen={shortlistModal.isOpen}
        onOpenChange={shortlistModal.onOpenChange}
        shortlist={shortlist}
        voteSummaries={voteSummaries}
        localVotes={localVotes}
        winnerWatchlistItemId={winnerWatchlistItemId}
        getReadableVote={getReadableVote}
      />
    </div>
  );
}

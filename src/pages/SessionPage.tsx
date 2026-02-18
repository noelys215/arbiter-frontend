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
import "./session/SessionPage.css";

export default function SessionPage() {
  const {
    groups,
    groupsLoading,
    groupsError,
    me,
    selectedGroup,
    resolvedGroupId,
    setSelectedGroupId,

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
    showLeaderEndedCard,
    showPlaceholderDeck,
    showWaitingCard,
    stackCards,
    deckPhase,
    shuffleSeed,
    currentIndex,
    setCurrentIndex,
    canSwipe,
    localVotes,
    swipedCount,
    totalCards,
    userSecondsLeft,
    showShortlistButton,
    sortedCards,
    isDeckComplete,

    shortlist,
    shortlistModal,
    personalPreviewModal,
    personalPreviewCards,

    handleToggleTag,
    handleGenerateDeck,
    handleConfirmDeal,
    handleBackToVibeSelection,
    handleSwipe,
    handleProgrammaticSwipe,
    handleShuffleToDecide,
    goHome,
    handleEndSession,
    getReadableVote,
  } = useSessionFlow();

  if (groupsLoading) {
    return <SessionLoadingState />;
  }

  if (groupsError || !groups || groups.length === 0) {
    return <SessionUnavailableState onGoHome={goHome} />;
  }

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <SessionHeader
        groups={groups}
        resolvedGroupId={resolvedGroupId}
        onSelectGroupId={setSelectedGroupId}
        userName={me?.display_name ?? me?.username ?? "User"}
        userEmail={me?.email ?? ""}
        isGroupLeader={isGroupLeader}
        activeSessionId={activeSessionId}
        isEndingSession={endSessionMutation.isPending}
        onEndSession={handleEndSession}
        onGoHome={goHome}
      />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
        {!hasSubmittedDeck ? (
          <VibeSelectionCard
            selectedGroupName={selectedGroup?.name ?? "your group"}
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
                ? "Submitting"
                : sessionPhase === "swiping"
                  ? "Deck Ready"
                  : "Deal Your Deck"
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
          sessionContext={sessionContext}
          localVotes={localVotes}
          onProgrammaticSwipe={handleProgrammaticSwipe}
          swipedCount={swipedCount}
          totalCards={totalCards}
          userSecondsLeft={userSecondsLeft}
          showShortlistButton={showShortlistButton}
          onOpenShortlist={shortlistModal.onOpen}
          isGroupLeader={isGroupLeader}
          onShuffleWinner={handleShuffleToDecide}
          shuffleIsPending={shuffleMutation.isPending}
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
        localVotes={localVotes}
        winnerWatchlistItemId={winnerWatchlistItemId}
        getReadableVote={getReadableVote}
      />
    </div>
  );
}

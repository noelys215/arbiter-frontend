import { motion } from "framer-motion";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";

export type SwipeDirection = "left" | "right" | "up";

type SwipeDeckState = {
  index: number;
  direction: SwipeDirection;
};

export type SwipeDeckHandle = {
  swipe: (direction: SwipeDirection) => Promise<boolean>;
};

export type SwipeDeckProps<TCard> = {
  cards: TCard[];
  getCardId: (card: TCard) => string;
  currentIndex: number;
  onCurrentIndexChange: (nextIndex: number) => void;
  onSwipe: (direction: SwipeDirection, card: TCard, cardIndex: number) => void;
  canSwipe?: boolean;
  className?: string;
  renderCard: (params: {
    card: TCard;
    index: number;
    isTopCard: boolean;
    isVisibleCard: boolean;
  }) => ReactNode;
  dragThreshold?: number;
};

const SWIPE_OUT_MS = 220;
const CARD_SWIPE_X = 560;
const CARD_SWIPE_Y = 620;

function toDirection(offsetX: number, offsetY: number, threshold: number) {
  const absX = Math.abs(offsetX);
  const absY = Math.abs(offsetY);

  if (absX < threshold && absY < threshold) {
    return null;
  }

  if (absY > absX && offsetY < -threshold) {
    return "up" as SwipeDirection;
  }

  if (absX >= absY) {
    return offsetX >= 0 ? ("right" as SwipeDirection) : ("left" as SwipeDirection);
  }

  return null;
}

function SwipeDeckInner<TCard>(
  {
    cards,
    getCardId,
    currentIndex,
    onCurrentIndexChange,
    onSwipe,
    canSwipe = true,
    className,
    renderCard,
    dragThreshold = 120,
  }: SwipeDeckProps<TCard>,
  ref: Ref<SwipeDeckHandle>,
) {
  const [swiping, setSwiping] = useState<SwipeDeckState | null>(null);
  const timerRef = useRef<number | null>(null);

  const cleanupTimer = () => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanupTimer();
    };
  }, []);

  const beginSwipe = useCallback((direction: SwipeDirection) => {
    if (!canSwipe || swiping || currentIndex < 0 || currentIndex >= cards.length) {
      return false;
    }

    const topCard = cards[currentIndex];
    if (!topCard) {
      return false;
    }

    setSwiping({ index: currentIndex, direction });

    cleanupTimer();
    timerRef.current = window.setTimeout(() => {
      onSwipe(direction, topCard, currentIndex);
      onCurrentIndexChange(currentIndex - 1);
      setSwiping(null);
      timerRef.current = null;
    }, SWIPE_OUT_MS);

    return true;
  }, [canSwipe, cards, currentIndex, onCurrentIndexChange, onSwipe, swiping]);

  useImperativeHandle(
    ref,
    () => ({
      swipe: async (direction: SwipeDirection) => {
        return beginSwipe(direction);
      },
    }),
    [beginSwipe],
  );

  return (
    <div className={className}>
      {cards.map((card, index) => {
        const isTopCard = index === currentIndex;
        const isVisibleCard = index <= currentIndex;
        const isSwipingCard =
          swiping != null && swiping.index === index && isTopCard;

        const stackDepth = Math.max(0, currentIndex - index);

        const animateTo = isSwipingCard
          ? {
              x:
                swiping.direction === "left"
                  ? -CARD_SWIPE_X
                  : swiping.direction === "right"
                    ? CARD_SWIPE_X
                    : 0,
              y: swiping.direction === "up" ? -CARD_SWIPE_Y : -40,
              rotate:
                swiping.direction === "left"
                  ? -16
                  : swiping.direction === "right"
                    ? 16
                    : 0,
              opacity: 0,
              scale: 0.95,
            }
          : {
              x: 0,
              y: stackDepth * 3,
              rotate: 0,
              opacity: isVisibleCard ? 1 : 0,
              scale: 1 - Math.min(stackDepth, 6) * 0.012,
            };

        return (
          <motion.div
            key={getCardId(card)}
            className="absolute inset-0"
            style={{ zIndex: index + 1, pointerEvents: isTopCard ? "auto" : "none" }}
            drag={canSwipe && isTopCard && !swiping ? true : false}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.6}
            whileDrag={{ scale: 1.02, cursor: "grabbing" }}
            initial={false}
            animate={animateTo}
            transition={
              isSwipingCard
                ? { duration: SWIPE_OUT_MS / 1000, ease: "easeOut" }
                : { type: "spring", stiffness: 420, damping: 34, mass: 0.55 }
            }
            onDragEnd={(_, info) => {
              if (!canSwipe || !isTopCard || swiping) return;
              const direction = toDirection(
                info.offset.x,
                info.offset.y,
                dragThreshold,
              );
              if (!direction) return;
              beginSwipe(direction);
            }}
          >
            {renderCard({
              card,
              index,
              isTopCard,
              isVisibleCard,
            })}
          </motion.div>
        );
      })}
    </div>
  );
}

const SwipeDeck = forwardRef(SwipeDeckInner) as <TCard>(
  props: SwipeDeckProps<TCard> & { ref?: Ref<SwipeDeckHandle> },
) => ReactElement;

export default SwipeDeck;

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { updateAvatar } from "../auth/auth.api";
import type { MeResponse, UpdateAvatarPayload } from "../auth/auth.api";
import ArbiterAvatar from "../../components/ArbiterAvatar";
import {
  AVATAR_COLLECTIONS,
  getAvatarStyleConfig,
} from "./avatarConfig";
import { getDisplayName, makeAvatarSeed } from "./avatarResolver";
import type { AvatarSource, AvatarUser } from "./avatarTypes";

type AvatarSelectorModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  me: MeResponse | undefined;
};

type AvatarOption = {
  id: string;
  style: string;
  seed: string;
};

type AvatarCollectionKey = (typeof AVATAR_COLLECTIONS)[number]["key"];

function getCollectionStyle(collection: AvatarCollectionKey) {
  if (collection === "abstract") {
    return "boring-beam";
  }
  return AVATAR_COLLECTIONS.find((item) => item.key === collection)?.style;
}

function createOptions(collection: AvatarCollectionKey): AvatarOption[] {
  return Array.from({ length: 8 }, () => ({
    id: makeAvatarSeed(),
    style: getCollectionStyle(collection) ?? "notionists",
    seed: makeAvatarSeed(),
  }));
}

function optionUser(option: AvatarOption): AvatarUser {
  return {
    display_name: "Avatar preview",
    avatar_source: "generated",
    avatar_style: option.style,
    avatar_seed: option.seed,
  };
}

function sourceLabel(source: AvatarSource, hasProviderPhoto: boolean) {
  if (source === "generated") return "Generated";
  if (source === "provider") return hasProviderPhoto ? "Google photo" : "Provider photo";
  return "Initials";
}

export default function AvatarSelectorModal({
  isOpen,
  onOpenChange,
  me,
}: AvatarSelectorModalProps) {
  const queryClient = useQueryClient();
  const savedStyle = getAvatarStyleConfig(me?.avatar_style);
  const initialCollection: AvatarCollectionKey =
    savedStyle?.collection ?? "editorial";
  const hasProviderPhoto = Boolean(me?.avatar_url);
  const [source, setSource] = useState<AvatarSource>("generated");
  const [activeCollection, setActiveCollection] = useState(initialCollection);
  const [options, setOptions] = useState<AvatarOption[]>(() =>
    createOptions(initialCollection),
  );
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let isActive = true;
    const currentStyle = getAvatarStyleConfig(me?.avatar_style);
    const collection: AvatarCollectionKey = currentStyle?.collection ?? "editorial";
    const nextOptions = createOptions(collection);
    const currentOption =
      me?.avatar_source === "generated" && currentStyle && me.avatar_seed
        ? {
            id: "current",
            style: currentStyle.value,
            seed: me.avatar_seed,
          }
        : null;

    queueMicrotask(() => {
      if (!isActive) return;
      setSource("generated");
      setActiveCollection(collection);
      setOptions(
        currentOption ? [currentOption, ...nextOptions.slice(1)] : nextOptions,
      );
      setSelectedOptionId(currentOption ? "current" : nextOptions[0]?.id ?? null);
      setSaveError(null);
    });

    return () => {
      isActive = false;
    };
  }, [isOpen, me]);

  const selectedOption = useMemo(
    () => options.find((option) => option.id === selectedOptionId) ?? null,
    [options, selectedOptionId],
  );

  const sourceChoices: AvatarSource[] = hasProviderPhoto
    ? ["generated", "provider", "initials"]
    : ["generated", "initials"];

  const saveMutation = useMutation({
    mutationFn: (payload: UpdateAvatarPayload) => updateAvatar(payload),
    onSuccess: async () => {
      setSaveError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["me"] }),
        queryClient.invalidateQueries({ queryKey: ["groups"] }),
        queryClient.invalidateQueries({ queryKey: ["friends"] }),
        queryClient.invalidateQueries({ queryKey: ["group-detail"] }),
        queryClient.invalidateQueries({ queryKey: ["session-state"] }),
      ]);
      onOpenChange(false);
    },
    onError: () => {
      setSaveError("We couldn't save your avatar. Please try again.");
    },
  });

  const handleCollectionChange = (collection: AvatarCollectionKey) => {
    const nextOptions = createOptions(collection);
    setActiveCollection(collection);
    setOptions(nextOptions);
    setSelectedOptionId(nextOptions[0]?.id ?? null);
    setSource("generated");
    setSaveError(null);
  };

  const handleShuffle = () => {
    const nextOptions = createOptions(activeCollection);
    setOptions(nextOptions);
    setSelectedOptionId(nextOptions[0]?.id ?? null);
    setSource("generated");
    setSaveError(null);
  };

  const handleSave = () => {
    if (source === "generated") {
      if (!selectedOption) return;
      saveMutation.mutate({
        avatar_source: "generated",
        avatar_style: selectedOption.style,
        avatar_seed: selectedOption.seed,
      });
      return;
    }

    saveMutation.mutate({ avatar_source: source });
  };

  const displayName = getDisplayName(me);

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: "border border-[#E0B15C]/20 bg-[#1C110F] text-[#F7F1E3]",
        header: "border-b border-[#E0B15C]/10",
        body: "gap-5 py-5",
        footer: "border-t border-[#E0B15C]/10",
        closeButton:
          "text-[#F5D9A5] hover:bg-[#E0B15C]/10 focus-visible:outline focus-visible:outline-3 focus-visible:outline-[#F2C16E]",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold text-[#F5D9A5]">
                Choose an avatar
              </h2>
              <p className="text-sm font-normal text-[#D9C7A8]">
                Pick one for now. You can change it anytime.
              </p>
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-wrap gap-2" aria-label="Avatar source">
                {sourceChoices.map((choice) => (
                  <Button
                    key={choice}
                    size="sm"
                    variant={source === choice ? "solid" : "bordered"}
                    className={
                      source === choice
                        ? "bg-[#E0B15C] text-[#1C110F]"
                        : "border-[#E0B15C]/35 text-[#E0B15C]"
                    }
                    onPress={() => {
                      setSource(choice);
                      setSaveError(null);
                    }}
                  >
                    {sourceLabel(choice, hasProviderPhoto)}
                  </Button>
                ))}
              </div>

              {source === "generated" ? (
                <>
                  <div
                    className="grid grid-cols-2 gap-2 sm:grid-cols-5"
                    aria-label="Avatar collections"
                  >
                    {AVATAR_COLLECTIONS.map((collection) => (
                      <Button
                        key={collection.key}
                        size="sm"
                        variant={
                          activeCollection === collection.key ? "solid" : "bordered"
                        }
                        className={
                          activeCollection === collection.key
                            ? "bg-[#E0B15C] text-[#1C110F]"
                            : "border-[#E0B15C]/35 text-[#E0B15C]"
                        }
                        onPress={() => handleCollectionChange(collection.key)}
                      >
                        {collection.label}
                      </Button>
                    ))}
                  </div>

                  <div className="grid grid-cols-4 gap-3 sm:grid-cols-4">
                    {options.map((option, index) => {
                      const isSelected = selectedOptionId === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          aria-label={`Choose avatar ${index + 1}`}
                          aria-pressed={isSelected}
                          className={[
                            "relative flex aspect-square min-h-16 items-center justify-center rounded-lg border bg-[#140C0A]/70 transition",
                            "focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#F2C16E]",
                            isSelected
                              ? "border-[#E0B15C] ring-2 ring-[#E0B15C]/45"
                              : "border-[#E0B15C]/15 hover:border-[#E0B15C]/45",
                          ].join(" ")}
                          onClick={() => {
                            setSelectedOptionId(option.id);
                            setSource("generated");
                            setSaveError(null);
                          }}
                        >
                          <ArbiterAvatar
                            user={optionUser(option)}
                            size={56}
                            decorative
                          />
                          {isSelected ? (
                            <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#E0B15C] text-[#1C110F]">
                              <span aria-hidden="true" className="text-xs font-bold">
                                ✓
                              </span>
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>

                  <Button
                    variant="bordered"
                    className="w-fit border-[#E0B15C]/35 text-[#E0B15C]"
                    onPress={handleShuffle}
                  >
                    Shuffle choices
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-4 rounded-xl border border-[#E0B15C]/15 bg-[#22130F] p-4">
                  <ArbiterAvatar
                    user={{
                      ...me,
                      avatar_source: source,
                    }}
                    size={64}
                    isBordered
                  />
                  <div>
                    <p className="font-semibold text-[#F5D9A5]">{displayName}</p>
                    <p className="text-sm text-[#D9C7A8]">
                      {source === "provider"
                        ? "Use your account photo."
                        : "Use your initials."}
                    </p>
                  </div>
                </div>
              )}

              {saveError ? (
                <p className="text-sm text-[#D77B69]" role="alert">
                  {saveError}
                </p>
              ) : null}
            </ModalBody>
            <ModalFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
              <Button
                variant="light"
                className="text-[#D9C7A8] hover:text-white"
                onPress={onClose}
                isDisabled={saveMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#E0B15C] text-[#1C110F]"
                onPress={handleSave}
                isLoading={saveMutation.isPending}
                isDisabled={source === "generated" && !selectedOption}
              >
                Save avatar
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

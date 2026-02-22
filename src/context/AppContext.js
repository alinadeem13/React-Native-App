import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useEffect, useMemo, useState } from "react";
import {
  acceptPartnerInvite,
  deleteMemoryRecord,
  createPartnerInvite,
  deletePlanRecord,
  fetchChallenges,
  fetchMemories,
  fetchNotes,
  fetchPlans,
  fetchProfile,
  fetchPublicProfile,
  upsertMemory,
  saveProfile,
  upsertChallenge,
  upsertNote,
  upsertPlan
} from "../firebase/services";
import { challengeSeed, starterMemories } from "../utils/mockData";

function normalizeMemory(memory) {
  const dateText = memory.dateText || new Date(memory.createdAt || Date.now()).toISOString().slice(0, 10);
  const parsedDate = new Date(dateText);
  const dateMs = Number.isNaN(parsedDate.getTime()) ? Date.now() : parsedDate.getTime();

  return {
    id: memory.id || String(Date.now()),
    title: memory.title || "Untitled Memory",
    details: memory.details || "",
    category: memory.category || "Special",
    mood: memory.mood || "Happy",
    dateText,
    dateMs,
    createdAt: memory.createdAt || Date.now(),
    reactions: {
      heart: memory.reactions?.heart || 0,
      laugh: memory.reactions?.laugh || 0,
      wow: memory.reactions?.wow || 0
    }
  };
}

function buildDefaultState() {
  return {
    profile: {
      yourName: "Ali",
      partnerName: "My Love",
      anniversary: "2022-01-15",
      moodLog: {},
      coupleId: null,
      partnerUserId: null,
      onboardingSeen: false
    },
    notes: [],
    memories: starterMemories.map((memory) => normalizeMemory(memory)),
    plans: [],
    challenges: challengeSeed.map((c) => ({ ...c, done: false })),
    partner: null
  };
}

export const AppContext = createContext(null);

export function AppProvider({ children, userId }) {
  const [state, setState] = useState(buildDefaultState());
  const [hydrated, setHydrated] = useState(false);
  const [ownerId, setOwnerId] = useState(null);
  const [storageKey, setStorageKey] = useState(null);

  useEffect(() => {
    let active = true;

    (async () => {
      const resolvedOwner = userId || "guest";
      const key = `loveverse_state_${resolvedOwner}`;

      if (!active) return;
      setHydrated(false);
      setOwnerId(resolvedOwner);
      setStorageKey(key);
      setState(buildDefaultState());

      try {
        const raw = await AsyncStorage.getItem(key);
        const localState = raw ? JSON.parse(raw) : buildDefaultState();

        let cloudProfile = null;
        let cloudNotes = [];
        let cloudPlans = [];
        let cloudChallenges = [];
        let cloudMemories = [];

        try {
          [cloudProfile, cloudNotes, cloudPlans, cloudChallenges, cloudMemories] = await Promise.all([
            fetchProfile(resolvedOwner),
            fetchNotes(resolvedOwner),
            fetchPlans(resolvedOwner),
            fetchChallenges(resolvedOwner),
            fetchMemories(resolvedOwner)
          ]);
        } catch {
          // Allow offline mode or restrictive Firestore rules.
        }

        if (!active) return;

        const baseChallenges = localState.challenges?.length
          ? localState.challenges
          : buildDefaultState().challenges;

        const mergedChallenges = baseChallenges.map((localChallenge) => {
          const cloudChallenge = cloudChallenges.find((c) => c.challengeId === localChallenge.id);
          return cloudChallenge
            ? {
                ...localChallenge,
                done: !!cloudChallenge.done,
                completedAt: cloudChallenge.completedAt || null
              }
            : localChallenge;
        });

        const mergedProfile = cloudProfile
          ? { ...localState.profile, ...cloudProfile }
          : localState.profile;

        const normalizedLocalMemories = (localState.memories || []).map((memory) =>
          normalizeMemory(memory)
        );
        const normalizedCloudMemories = cloudMemories.map((memory) => normalizeMemory(memory));

        let partner = null;
        if (mergedProfile.partnerUserId) {
          partner = await fetchPublicProfile(mergedProfile.partnerUserId).catch(() => null);
        }

        setState({
          ...localState,
          profile: mergedProfile,
          notes: cloudNotes.length ? cloudNotes : localState.notes,
          plans: cloudPlans.length ? cloudPlans : localState.plans,
          memories: normalizedCloudMemories.length ? normalizedCloudMemories : normalizedLocalMemories,
          challenges: mergedChallenges,
          partner
        });
      } finally {
        if (active) setHydrated(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!hydrated || !storageKey) return;
    AsyncStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, hydrated, storageKey]);

  const actions = useMemo(
    () => ({
      addNote: (text) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        const item = { id: String(Date.now()), text: trimmed, createdAt: Date.now() };
        setState((prev) => ({ ...prev, notes: [item, ...prev.notes] }));

        if (ownerId) upsertNote(ownerId, item).catch(() => {});
      },
      addMemory: (payload) => {
        const title = payload?.title?.trim();
        if (!title) return { ok: false, reason: "title_required" };

        const details = (payload?.details || "").trim();
        const category = payload?.category || "Special";
        const mood = payload?.mood || "Happy";
        const dateText = payload?.dateText || new Date().toISOString().slice(0, 10);
        const dateValue = new Date(dateText);

        if (Number.isNaN(dateValue.getTime())) {
          return { ok: false, reason: "invalid_date" };
        }

        const item = normalizeMemory({
          id: String(Date.now()),
          title,
          details,
          category,
          mood,
          dateText,
          dateMs: dateValue.getTime(),
          createdAt: Date.now(),
          reactions: { heart: 0, laugh: 0, wow: 0 }
        });

        setState((prev) => {
          const exists = prev.memories.some(
            (m) =>
              m.title.trim().toLowerCase() === title.toLowerCase() &&
              m.dateText === dateText &&
              m.details.trim().toLowerCase() === details.toLowerCase()
          );
          if (exists) return prev;

          const nextMemories = [item, ...prev.memories].sort(
            (a, b) => (b.dateMs || b.createdAt || 0) - (a.dateMs || a.createdAt || 0)
          );
          return { ...prev, memories: nextMemories };
        });

        if (ownerId) upsertMemory(ownerId, item).catch(() => {});
        return { ok: true, item };
      },
      deleteMemory: (id) => {
        setState((prev) => ({
          ...prev,
          memories: prev.memories.filter((memory) => memory.id !== id)
        }));
        if (ownerId) deleteMemoryRecord(ownerId, id).catch(() => {});
      },
      reactToMemory: (id, reactionKey) => {
        const allowed = ["heart", "laugh", "wow"];
        if (!allowed.includes(reactionKey)) return;

        let updatedMemory = null;
        setState((prev) => {
          const nextMemories = prev.memories.map((memory) => {
            if (memory.id !== id) return memory;
            const next = {
              ...memory,
              reactions: {
                heart: memory.reactions?.heart || 0,
                laugh: memory.reactions?.laugh || 0,
                wow: memory.reactions?.wow || 0
              }
            };
            next.reactions[reactionKey] += 1;
            updatedMemory = next;
            return next;
          });
          return { ...prev, memories: nextMemories };
        });

        if (ownerId && updatedMemory) upsertMemory(ownerId, updatedMemory).catch(() => {});
      },
      addPlan: (title) => {
        const titleValue = typeof title === "string" ? title : title?.title || "";
        const trimmed = titleValue.trim();
        if (!trimmed) return;

        let newItem = null;
        setState((prev) => {
          const alreadyExists = prev.plans.some(
            (plan) => plan.title.trim().toLowerCase() === trimmed.toLowerCase()
          );
          if (alreadyExists) return prev;

          newItem = {
            id: String(Date.now()),
            title: trimmed,
            createdAt: Date.now(),
            plannedFor:
              typeof title === "string" ? null : title?.plannedFor || null,
            plannedForMs:
              typeof title === "string" || !title?.plannedFor
                ? null
                : new Date(`${title.plannedFor}T00:00:00`).getTime()
          };
          return { ...prev, plans: [newItem, ...prev.plans] };
        });

        if (ownerId && newItem) upsertPlan(ownerId, newItem).catch(() => {});
      },
      deletePlan: (id) => {
        setState((prev) => ({
          ...prev,
          plans: prev.plans.filter((plan) => plan.id !== id)
        }));

        if (ownerId) deletePlanRecord(ownerId, id).catch(() => {});
      },
      toggleChallenge: (id) => {
        let updated = null;

        setState((prev) => {
          const nextChallenges = prev.challenges.map((c) => {
            if (c.id !== id) return c;
            const nextDone = !c.done;
            updated = {
              ...c,
              done: nextDone,
              completedAt: nextDone ? Date.now() : null
            };
            return updated;
          });

          return { ...prev, challenges: nextChallenges };
        });

        if (ownerId && updated) upsertChallenge(ownerId, updated).catch(() => {});
      },
      updateProfile: (patch) => {
        setState((prev) => {
          const nextProfile = { ...prev.profile, ...patch };
          if (ownerId) saveProfile(ownerId, nextProfile).catch(() => {});
          return { ...prev, profile: nextProfile };
        });
      },
      markPartnerOnboardingSeen: () => {
        setState((prev) => {
          const nextProfile = { ...prev.profile, onboardingSeen: true };
          if (ownerId) saveProfile(ownerId, nextProfile).catch(() => {});
          return { ...prev, profile: nextProfile };
        });
      },
      createInviteCode: async () => {
        if (!ownerId) throw new Error("User not available.");
        return createPartnerInvite(ownerId);
      },
      joinByInviteCode: async (code) => {
        if (!ownerId) throw new Error("User not available.");

        const result = await acceptPartnerInvite(code, ownerId);
        const partner = await fetchPublicProfile(result.partnerUserId).catch(() => null);

        setState((prev) => {
          const nextProfile = {
            ...prev.profile,
            coupleId: result.coupleId,
            partnerUserId: result.partnerUserId,
            onboardingSeen: true
          };
          return { ...prev, profile: nextProfile, partner };
        });

        return result;
      }
    }),
    [ownerId]
  );

  return <AppContext.Provider value={{ state, actions, hydrated }}>{children}</AppContext.Provider>;
}

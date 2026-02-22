import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch
} from "firebase/firestore";
import { db } from "./firebaseConfig";

function scopedId(ownerId, id) {
  return `${ownerId}_${id}`;
}

function randomInviteCode(length = 7) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export async function saveProfile(ownerId, profile) {
  await setDoc(
    doc(db, "profiles", ownerId),
    {
      ownerId,
      ...profile,
      updatedAt: Date.now()
    },
    { merge: true }
  );
}

export async function fetchProfile(ownerId) {
  const snapshot = await getDoc(doc(db, "profiles", ownerId));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    yourName: data.yourName,
    partnerName: data.partnerName,
    anniversary: data.anniversary,
    coupleId: data.coupleId || null,
    partnerUserId: data.partnerUserId || null,
    onboardingSeen: data.onboardingSeen ?? false
  };
}

export async function fetchPublicProfile(ownerId) {
  const snapshot = await getDoc(doc(db, "profiles", ownerId));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    userId: ownerId,
    yourName: data.yourName || "Partner",
    partnerName: data.partnerName || "",
    anniversary: data.anniversary || ""
  };
}

export async function createPartnerInvite(ownerId) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = randomInviteCode();
    const ref = doc(db, "partnerInvites", code);
    const existing = await getDoc(ref);
    if (existing.exists()) continue;

    await setDoc(ref, {
      code,
      ownerId,
      status: "active",
      createdAt: Date.now(),
      usedBy: null
    });

    return code;
  }
  throw new Error("Could not generate invite code. Please try again.");
}

export async function acceptPartnerInvite(codeInput, joiningUserId) {
  const code = codeInput.trim().toUpperCase();
  const inviteRef = doc(db, "partnerInvites", code);
  const inviteSnap = await getDoc(inviteRef);

  if (!inviteSnap.exists()) {
    throw new Error("Invalid invite code.");
  }

  const invite = inviteSnap.data();
  if (invite.status !== "active") {
    throw new Error("This invite code is no longer active.");
  }

  if (invite.ownerId === joiningUserId) {
    throw new Error("You cannot join your own invite.");
  }

  const memberA = invite.ownerId;
  const memberB = joiningUserId;
  const sorted = [memberA, memberB].sort();
  const coupleId = `${sorted[0]}_${sorted[1]}`;

  const batch = writeBatch(db);

  batch.set(
    doc(db, "couples", coupleId),
    {
      coupleId,
      members: sorted,
      createdAt: Date.now(),
      inviteCode: code
    },
    { merge: true }
  );

  batch.set(
    doc(db, "profiles", memberA),
    {
      coupleId,
      partnerUserId: memberB,
      onboardingSeen: true,
      updatedAt: Date.now()
    },
    { merge: true }
  );

  batch.set(
    doc(db, "profiles", memberB),
    {
      coupleId,
      partnerUserId: memberA,
      onboardingSeen: true,
      updatedAt: Date.now()
    },
    { merge: true }
  );

  batch.set(
    inviteRef,
    {
      status: "accepted",
      usedBy: joiningUserId,
      acceptedAt: Date.now()
    },
    { merge: true }
  );

  await batch.commit();

  return { coupleId, partnerUserId: memberA };
}

export async function upsertNote(ownerId, note) {
  await setDoc(doc(db, "notes", scopedId(ownerId, note.id)), {
    ownerId,
    ...note
  });
}

export async function fetchNotes(ownerId) {
  const q = query(collection(db, "notes"), where("ownerId", "==", ownerId));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.data().id, ...d.data() }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function upsertPlan(ownerId, plan) {
  await setDoc(doc(db, "plans", scopedId(ownerId, plan.id)), {
    ownerId,
    ...plan
  });
}

export async function deletePlanRecord(ownerId, planId) {
  await deleteDoc(doc(db, "plans", scopedId(ownerId, planId)));
}

export async function fetchPlans(ownerId) {
  const q = query(collection(db, "plans"), where("ownerId", "==", ownerId));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.data().id, ...d.data() }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function upsertChallenge(ownerId, challenge) {
  const id = scopedId(ownerId, challenge.id);
  await setDoc(doc(db, "challenges", id), {
    ownerId,
    challengeId: challenge.id,
    title: challenge.title,
    description: challenge.description,
    points: challenge.points,
    done: challenge.done,
    updatedAt: Date.now()
  });
}

export async function fetchChallenges(ownerId) {
  const q = query(collection(db, "challenges"), where("ownerId", "==", ownerId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data());
}

export async function upsertMemory(ownerId, memory) {
  await setDoc(doc(db, "memories", scopedId(ownerId, memory.id)), {
    ownerId,
    ...memory
  });
}

export async function deleteMemoryRecord(ownerId, memoryId) {
  await deleteDoc(doc(db, "memories", scopedId(ownerId, memoryId)));
}

export async function fetchMemories(ownerId) {
  const q = query(collection(db, "memories"), where("ownerId", "==", ownerId));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.data().id, ...d.data() }))
    .sort((a, b) => (b.dateMs || b.createdAt || 0) - (a.dateMs || a.createdAt || 0));
}

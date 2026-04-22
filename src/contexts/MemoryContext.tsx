import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * The Vault — captured memories + interview answers.
 *
 * Media is stored as a data URL (base64) in localStorage. This is intentional:
 * the app is privacy-first and offline-friendly — no upload, no cloud, no tracking.
 * Trade-off: large videos are clipped to ~10s to keep the vault under quota.
 */

export type MemoryKind = 'photo' | 'video' | 'voice' | 'note';

export interface MemoryTag {
  /** Free-form context: attraction, party member, mood */
  label: string;
  kind: 'place' | 'who' | 'feeling';
}

export interface Memory {
  id: string;
  kind: MemoryKind;
  /** Data URL for media, or the body text for notes */
  payload: string;
  /** What the user (or auto-prompt) said this is */
  caption: string;
  /** Optional structured tags */
  tags: MemoryTag[];
  /** Optional MIME (for media) */
  mime?: string;
  /** Optional duration in ms (for video/voice) */
  durationMs?: number;
  /** ISO ms timestamp */
  at: number;
}

export type InterviewPhase = 'pre' | 'post';

export interface InterviewAnswer {
  id: string;
  phase: InterviewPhase;
  question: string;
  /** 'note' = typed body. 'voice' = data URL. */
  kind: 'note' | 'voice';
  payload: string;
  durationMs?: number;
  at: number;
}

interface MemoryState {
  memories: Memory[];
  interviews: InterviewAnswer[];
  preCompleted: boolean;
  postCompleted: boolean;
  saveMemory: (m: Omit<Memory, 'id' | 'at'> & { at?: number }) => Memory;
  updateMemory: (id: string, patch: Partial<Pick<Memory, 'caption' | 'tags'>>) => void;
  deleteMemory: (id: string) => void;
  saveInterview: (a: Omit<InterviewAnswer, 'id' | 'at'> & { at?: number }) => InterviewAnswer;
  markPhaseComplete: (phase: InterviewPhase) => void;
  resetPhase: (phase: InterviewPhase) => void;
  clearAll: () => void;
}

const Ctx = createContext<MemoryState | null>(null);

const KEY_MEMORIES = 'companion.memories.v1';
const KEY_INTERVIEWS = 'companion.interviews.v1';
const KEY_PRE = 'companion.interview.pre.completed';
const KEY_POST = 'companion.interview.post.completed';

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return (Array.isArray(parsed) || typeof parsed === 'object') ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export const MemoryProvider = ({ children }: { children: ReactNode }) => {
  const [memories, setMemories] = useState<Memory[]>(() =>
    typeof window === 'undefined' ? [] : safeParse<Memory[]>(window.localStorage.getItem(KEY_MEMORIES), [])
  );
  const [interviews, setInterviews] = useState<InterviewAnswer[]>(() =>
    typeof window === 'undefined' ? [] : safeParse<InterviewAnswer[]>(window.localStorage.getItem(KEY_INTERVIEWS), [])
  );
  const [preCompleted, setPreCompleted] = useState<boolean>(() =>
    typeof window === 'undefined' ? false : window.localStorage.getItem(KEY_PRE) === '1'
  );
  const [postCompleted, setPostCompleted] = useState<boolean>(() =>
    typeof window === 'undefined' ? false : window.localStorage.getItem(KEY_POST) === '1'
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY_MEMORIES, JSON.stringify(memories));
    } catch {
      // Quota exceeded — most likely from a large video. Drop the oldest media until we fit.
      try {
        const trimmed = memories.slice(-30);
        window.localStorage.setItem(KEY_MEMORIES, JSON.stringify(trimmed));
      } catch { /* give up — runtime still works */ }
    }
  }, [memories]);

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY_INTERVIEWS, JSON.stringify(interviews));
    } catch { /* ignore */ }
  }, [interviews]);

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY_PRE, preCompleted ? '1' : '0');
      window.localStorage.setItem(KEY_POST, postCompleted ? '1' : '0');
    } catch { /* ignore */ }
  }, [preCompleted, postCompleted]);

  const saveMemory: MemoryState['saveMemory'] = useCallback((m) => {
    const next: Memory = {
      id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      at: m.at ?? Date.now(),
      tags: m.tags ?? [],
      ...m,
    };
    setMemories((prev) => [...prev, next]);
    return next;
  }, []);

  const deleteMemory: MemoryState['deleteMemory'] = useCallback((id) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const updateMemory: MemoryState['updateMemory'] = useCallback((id, patch) => {
    setMemories((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              caption: patch.caption !== undefined ? patch.caption : m.caption,
              tags: patch.tags !== undefined ? patch.tags : m.tags,
            }
          : m
      )
    );
  }, []);

  const saveInterview: MemoryState['saveInterview'] = useCallback((a) => {
    const next: InterviewAnswer = {
      id: `int-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      at: a.at ?? Date.now(),
      ...a,
    };
    setInterviews((prev) => [...prev, next]);
    return next;
  }, []);

  const markPhaseComplete: MemoryState['markPhaseComplete'] = useCallback((phase) => {
    if (phase === 'pre') setPreCompleted(true);
    else setPostCompleted(true);
  }, []);

  const resetPhase: MemoryState['resetPhase'] = useCallback((phase) => {
    if (phase === 'pre') setPreCompleted(false);
    else setPostCompleted(false);
  }, []);

  const clearAll: MemoryState['clearAll'] = useCallback(() => {
    setMemories([]);
    setInterviews([]);
    setPreCompleted(false);
    setPostCompleted(false);
  }, []);

  const value = useMemo(
    () => ({
      memories,
      interviews,
      preCompleted,
      postCompleted,
      saveMemory,
      updateMemory,
      deleteMemory,
      saveInterview,
      markPhaseComplete,
      resetPhase,
      clearAll,
    }),
    [memories, interviews, preCompleted, postCompleted, saveMemory, updateMemory, deleteMemory, saveInterview, markPhaseComplete, resetPhase, clearAll]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useMemoryVault = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useMemoryVault must be used within MemoryProvider');
  return ctx;
};

export const formatMemoryTime = (at: number) =>
  new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

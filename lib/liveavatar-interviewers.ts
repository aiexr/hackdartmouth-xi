import { generatedInterviewers, type InterviewerProfile } from "@/lib/interviewers";

const LIVEAVATAR_API = "https://api.liveavatar.com";
const PUBLIC_AVATAR_PAGE_SIZE = 100;
const MAX_PUBLIC_AVATAR_PAGES = 5;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeToken(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function findAvatarList(payload: unknown): unknown[] {
  const root = asRecord(payload);
  const data = asRecord(root.data);

  const candidates = [
    data.items,
    data.avatars,
    data.results,
    root.items,
    root.avatars,
    root.results,
    root.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function buildDisplayName(
  baseName: string,
  duplicateCount: number,
  defaultVoiceName: string | null,
  avatarId: string,
) {
  if (duplicateCount <= 1) {
    return baseName;
  }

  if (defaultVoiceName) {
    return `${baseName} · ${defaultVoiceName}`;
  }

  return `${baseName} · ${avatarId.slice(0, 4)}`;
}

function ensureUniqueDisplayName(
  candidate: string,
  avatarId: string,
  usedNames: Set<string>,
) {
  if (!usedNames.has(candidate)) {
    usedNames.add(candidate);
    return candidate;
  }

  const suffixedCandidate = `${candidate} · ${avatarId.slice(0, 4)}`;
  if (!usedNames.has(suffixedCandidate)) {
    usedNames.add(suffixedCandidate);
    return suffixedCandidate;
  }

  let duplicateIndex = 2;
  let uniqueCandidate = `${suffixedCandidate} ${duplicateIndex}`;
  while (usedNames.has(uniqueCandidate)) {
    duplicateIndex += 1;
    uniqueCandidate = `${suffixedCandidate} ${duplicateIndex}`;
  }

  usedNames.add(uniqueCandidate);
  return uniqueCandidate;
}

function getVoiceFamilyKey(defaultVoiceName: string | null) {
  if (!defaultVoiceName) {
    return null;
  }

  return normalizeToken(defaultVoiceName.split(" - ")[0] ?? defaultVoiceName);
}

function getProviderFamilyKey(providerName: string) {
  const normalized = providerName
    .replace(/\([^)]*\)/g, " ")
    .replace(/\bin\s+[a-z][a-z\s-]*/gi, " ")
    .replace(/\b(sitting|standing|portrait)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const leadingToken = normalized.split(" ")[0] ?? normalized;
  return normalizeToken(leadingToken || providerName);
}

function getAvatarFamilyKey(providerName: string, defaultVoiceName: string | null) {
  return getVoiceFamilyKey(defaultVoiceName) ?? getProviderFamilyKey(providerName);
}

function scoreAvatarVariant(
  providerName: string,
  familyKey: string,
) {
  const normalized = normalizeToken(providerName);
  let score = 0;

  if (normalized === familyKey) {
    score += 14;
  }

  if (normalized.includes("hr")) {
    score += 12;
  }

  if (
    /(lawyer|teacher|doctor|architect|engineer|manager|professional|support|expert|coach|therapist)/.test(
      normalized,
    )
  ) {
    score += 10;
  }

  if (normalized.includes("black suit")) {
    score += 9;
  }

  if (normalized.includes("sitting")) {
    score += 4;
  }

  if (normalized.includes("standing")) {
    score += 3;
  }

  if (normalized.includes("portrait")) {
    score -= 6;
  }

  if (normalized.includes("shirt") || normalized.includes("sweater")) {
    score -= 4;
  }

  score -= normalized.length / 100;

  return score;
}

function greatestCommonDivisor(left: number, right: number): number {
  let a = Math.abs(left);
  let b = Math.abs(right);

  while (b !== 0) {
    const next = a % b;
    a = b;
    b = next;
  }

  return a || 1;
}

function spreadByModulus<T>(items: T[]) {
  if (items.length <= 2) {
    return items;
  }

  let step = Math.floor(items.length / 2) + 1;
  while (greatestCommonDivisor(step, items.length) !== 1) {
    step += 1;
  }

  return Array.from({ length: items.length }, (_, position) => {
    const index = (position * step) % items.length;
    return items[index]!;
  });
}

async function fetchPublicAvatarPage(page: number, apiKey: string | undefined) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (apiKey) {
    headers["X-API-KEY"] = apiKey;
  }

  const res = await fetch(
    `${LIVEAVATAR_API}/v1/avatars/public?page=${page}&page_size=${PUBLIC_AVATAR_PAGE_SIZE}`,
    {
      headers,
      next: { revalidate: 3600 },
    },
  );

  if (!res.ok) {
    return null;
  }

  const payload: unknown = await res.json();
  const root = asRecord(payload);
  const data = asRecord(root.data);

  return {
    items: findAvatarList(payload),
    hasNextPage: Boolean(asString(data.next)),
  };
}

export async function getResolvedInterviewers() {
  const apiKey = process.env.HEYGEN_API_KEY;

  try {
    const items: unknown[] = [];

    for (let page = 1; page <= MAX_PUBLIC_AVATAR_PAGES; page += 1) {
      const pageResult = await fetchPublicAvatarPage(page, apiKey);
      if (!pageResult) {
        if (page === 1) {
          return generatedInterviewers;
        }

        break;
      }

      items.push(...pageResult.items);

      if (!pageResult.hasNextPage) {
        break;
      }
    }

    const parsed = items
      .map((item) => {
        const record = asRecord(item);
        const id = asString(record.id);
        const providerName = asString(record.name);
        const previewUrl = asString(record.preview_url);
        const defaultVoiceRecord = asRecord(record.default_voice);
        const defaultVoiceId = asString(defaultVoiceRecord.id);
        const defaultVoiceName = asString(defaultVoiceRecord.name);

        if (!id || !providerName || !previewUrl) {
          return null;
        }

        return {
          id,
          providerName,
          previewUrl,
          defaultVoice: defaultVoiceId
            ? {
                id: defaultVoiceId,
                name: defaultVoiceName,
              }
            : null,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    if (parsed.length === 0) {
      return generatedInterviewers;
    }

    const familyRepresentatives = new Map<string, (typeof parsed)[number]>();
    for (const avatar of parsed) {
      const familyKey = getAvatarFamilyKey(
        avatar.providerName,
        avatar.defaultVoice?.name ?? null,
      );
      const current = familyRepresentatives.get(familyKey);

      if (!current) {
        familyRepresentatives.set(familyKey, avatar);
        continue;
      }

      const currentScore = scoreAvatarVariant(current.providerName, familyKey);
      const candidateScore = scoreAvatarVariant(avatar.providerName, familyKey);

      if (
        candidateScore > currentScore ||
        (candidateScore === currentScore && avatar.providerName.length < current.providerName.length)
      ) {
        familyRepresentatives.set(familyKey, avatar);
      }
    }

    const representativeAvatars = Array.from(familyRepresentatives.values());
    const nameCounts = new Map<string, number>();
    for (const avatar of representativeAvatars) {
      nameCounts.set(avatar.providerName, (nameCounts.get(avatar.providerName) ?? 0) + 1);
    }

    const usedDisplayNames = new Set<string>();
    const resolved = representativeAvatars.map<InterviewerProfile>((avatar) => ({
      id: avatar.id,
      name: ensureUniqueDisplayName(
        buildDisplayName(
          avatar.providerName,
          nameCounts.get(avatar.providerName) ?? 1,
          avatar.defaultVoice?.name ?? null,
          avatar.id,
        ),
        avatar.id,
        usedDisplayNames,
      ),
      role: "AI interviewer",
      avatar: avatar.previewUrl,
      presentation: "unspecified",
      liveAvatar: {
        id: avatar.id,
        name: avatar.providerName,
        previewUrl: avatar.previewUrl,
        defaultVoice: avatar.defaultVoice,
      },
    }));

    resolved.sort((left, right) => left.name.localeCompare(right.name));
    return spreadByModulus(resolved);
  } catch {
    return generatedInterviewers;
  }
}

export async function getResolvedInterviewerById(id: string | null | undefined) {
  const interviewers = await getResolvedInterviewers();

  if (!id) {
    return interviewers[0] ?? null;
  }

  return interviewers.find((interviewer) => interviewer.id === id) ?? interviewers[0] ?? null;
}

export async function getResolvedInterviewerByName(name: string | null | undefined) {
  const interviewers = await getResolvedInterviewers();

  if (!name) {
    return interviewers[0] ?? null;
  }

  return interviewers.find((interviewer) => interviewer.name === name) ?? interviewers[0] ?? null;
}

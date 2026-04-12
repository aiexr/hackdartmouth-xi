export type InterviewerPresentation = "female" | "male" | "unspecified";

export type LiveAvatarOption = {
  id: string;
  name: string;
  previewUrl?: string | null;
  defaultVoice?: {
    id: string;
    name: string | null;
  } | null;
};

export type InterviewerProfile = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  presentation: InterviewerPresentation;
  liveAvatar: LiveAvatarOption;
};

function createInterviewer(
  id: string,
  name: string,
  role: string,
  presentation: InterviewerPresentation,
  previewUrl: string,
  voiceId: string | null,
  voiceName: string | null,
): InterviewerProfile {
  return {
    id,
    name,
    role,
    avatar: previewUrl,
    presentation,
    liveAvatar: {
      id,
      name,
      previewUrl,
      defaultVoice: voiceId
        ? {
            id: voiceId,
            name: voiceName,
          }
        : null,
    },
  };
}

export const generatedInterviewers: InterviewerProfile[] = [
  createInterviewer(
    "513fd1b7-7ef9-466d-9af2-344e51eeb833",
    "Ann",
    "Leadership Coach",
    "female",
    "https://files2.heygen.ai/avatar/v3/75e0a87b7fd94f0981ff398b593dd47f_45570/preview_talk_4.webp",
    "de5574fc-009e-4a01-a881-9919ef8f5a0c",
    "Ann - IA",
  ),
  createInterviewer(
    "7b888024-f8c9-4205-95e1-78ce01497bda",
    "Shawn",
    "Behavioral Coach",
    "male",
    "https://files2.heygen.ai/avatar/v3/db2fb7fd0d044b908395a011166ab22d_45680/preview_target.webp",
    "51afbab6-7af4-473b-95fc-6ce26aac8bb1",
    "Shawn - IA",
  ),
  createInterviewer(
    "0930fd59-c8ad-434d-ad53-b391a1768720",
    "Dexter",
    "Principal Counsel",
    "male",
    "https://files2.heygen.ai/avatar/v3/e20ac0c902184ff793e75ae4e139b7dc_45600/preview_target.webp",
    "b952f553-f7f3-4e52-8625-86b4c415384f",
    "Dexter - Professional",
  ),
  createInterviewer(
    "cd1d101c-9273-431b-8069-63beef736bec",
    "Judy",
    "Recruiting Lead",
    "female",
    "https://files2.heygen.ai/avatar/v3/68fbd9f64a4948baa3c295d35f49b61c_45630/preview_target.webp",
    "4f3b1e99-b580-4f05-9b67-a5f585be0232",
    "Judy - Professional",
  ),
  createInterviewer(
    "65f9e3c9-d48b-4118-b73a-4ae2e3cbb8f0",
    "June",
    "Hiring Manager",
    "female",
    "https://files2.heygen.ai/avatar/v3/74447a27859a456c955e01f21ef18216_45620/preview_talk_1.webp",
    "62bbb4b2-bb26-4727-bc87-cfb2bd4e0cc8",
    "June - Lifelike",
  ),
  createInterviewer(
    "9650a758-1085-4d49-8bf3-f347565ec229",
    "Silas",
    "Talent Partner",
    "male",
    "https://files2.heygen.ai/avatar/v3/582ee8fe072a48fda3bc68241aeff660_45660/preview_target.webp",
    "b139a8fe-7240-4454-ac37-8c68aebcee41",
    "Silas - Lifelike",
  ),
  createInterviewer(
    "64b526e4-741c-43b6-a918-4e40f3261c7a",
    "Bryan",
    "Principal Engineer",
    "male",
    "https://files2.heygen.ai/avatar/v3/33c9ac4aead44dfc8bc0082a35062a70_45580/preview_talk_3.webp",
    "9c8b542a-bf5c-4f4c-9011-75c79a274387",
    "Bryan - Professional",
  ),
  createInterviewer(
    "8175dfc2-7858-49d6-b5fa-0c135d1c4bad",
    "Elenora",
    "Staff Engineer",
    "female",
    "https://files2.heygen.ai/avatar/v3/cbd4a69890a040e6a0d54088e606a559_45610/preview_talk_3.webp",
    "254ffe1e-c89f-430f-8c36-9e7611d310c0",
    "Elenora - Professional",
  ),
  createInterviewer(
    "dd73ea75-1218-4ef3-92ce-606d5f7fbc0a",
    "Wayne",
    "Product Strategist",
    "male",
    "https://files2.heygen.ai/avatar/v3/a3fdb0c652024f79984aaec11ebf2694_34350/preview_target.webp",
    "c2527536-6d1f-4412-a643-53a3497dada9",
    "Wayne Liang",
  ),
];

const interviewerByName = Object.fromEntries(
  generatedInterviewers.map((interviewer) => [interviewer.name, interviewer]),
) as Record<string, InterviewerProfile>;
const interviewerById = Object.fromEntries(
  generatedInterviewers.map((interviewer) => [interviewer.id, interviewer]),
) as Record<string, InterviewerProfile>;

export function getStableInterviewerIndex(seed: string, count: number) {
  if (count <= 0) {
    return 0;
  }

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return hash % count;
}

export function getDefaultInterviewerForSeed(
  seed: string,
  interviewers: InterviewerProfile[] = generatedInterviewers,
) {
  if (interviewers.length === 0) {
    return null;
  }

  return interviewers[getStableInterviewerIndex(seed, interviewers.length)] ?? null;
}

export function getInterviewerById(
  id: string | null | undefined,
  interviewers: InterviewerProfile[] = generatedInterviewers,
) {
  if (!id) {
    return null;
  }

  if (interviewers === generatedInterviewers) {
    return interviewerById[id] ?? null;
  }

  return interviewers.find((interviewer) => interviewer.id === id) ?? null;
}

export function getInterviewerByName(
  name: string | null | undefined,
  interviewers: InterviewerProfile[] = generatedInterviewers,
) {
  if (!name) {
    return null;
  }

  if (interviewers === generatedInterviewers) {
    return interviewerByName[name] ?? null;
  }

  return interviewers.find((interviewer) => interviewer.name === name) ?? null;
}

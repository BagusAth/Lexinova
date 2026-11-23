// Tipe data materi. Mengikuti content/FORMAT.md.

export type ItemType =
  "word" | "phrasal_verb" | "collocation" | "idiom" | "pattern";

export interface Item {
  id: string;
  type: ItemType;
  term: string;
  meaning: string;
  example: string;
  example_id: string;
  cloze: string;
  answer: string;
  note?: string;
}

export interface GrammarPoint {
  id: string;
  title: string;
  explanation: string;
  examples: string[];
  common_mistake: { wrong: string; right: string };
}

export interface Question {
  q: string;
  options: string[];
  answer: number;
  explain?: string;
}

export interface Listening {
  id: string;
  title: string;
  speakers: { name: string; voice: string }[];
  lines: { speaker: string; text: string }[];
  dictation: number[];
  questions: Question[];
}

export interface Reading {
  id: string;
  title: string;
  text: string;
  glossary: { term: string; meaning: string; item_id?: string }[];
  questions: Question[];
}

export interface Writing {
  id: string;
  prompt: string;
  min_words: number;
  max_words: number;
  checklist: string[];
  useful_phrases: string[];
  model_answer: string;
}

export type Speaking =
  | { id: string; mode: "shadowing"; sentences: string[]; focus?: string }
  | {
      id: string;
      mode: "answer";
      prompt: string;
      sample_answer: string;
      focus?: string;
    };

export interface ConversationNode {
  them: string;
  hints?: string[];
  replies?: { match: string[]; next: string; feedback?: string }[];
  fallback?: { next: string; feedback?: string };
  end?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  role_you: string;
  role_them: string;
  start: string;
  nodes: Record<string, ConversationNode>;
}

export interface Unit {
  id: string;
  language: "en" | "ko" | "ja";
  level: string;
  title: string;
  theme: string;
  /** Kunci tujuan/minat (lihat GOALS & INTERESTS di levels.ts) untuk personalisasi. */
  tags?: string[];
  items: Item[];
  grammar: GrammarPoint[];
  listening: Listening[];
  reading: Reading[];
  writing: Writing[];
  speaking: Speaking[];
  conversation: Conversation[];
}

export type Skill =
  "listening" | "writing" | "reading" | "speaking" | "conversation";

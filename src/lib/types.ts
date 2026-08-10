export type Position = "GK" | "DEF" | "MID" | "FWD";

export interface PlayerData {
  id: string;
  game_id: string;
  team_id: string;
  name: string;
  position: Position;
  level: number;
  age: number;
  price: number;
  matches_played: number;
  goals: number;
  assists: number;
  clean_sheets: number;
  is_player_team: boolean;
}

export interface GameData {
  id: string;
  team_name: string;
  difficulty: number;
  budget: number;
  current_week: number;
  season: number;
  created_at: string;
  updated_at: string;
}

export interface MatchData {
  id: string;
  game_id: string;
  week: number;
  season: number;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  played: boolean;
}

export interface StandingData {
  id: string;
  game_id: string;
  season: number;
  team_name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  points: number;
}

export const POSITION_LABELS: Record<Position, string> = {
  GK: "Goalkeeper",
  DEF: "Defender",
  MID: "Midfielder",
  FWD: "Forward",
};

export const POSITION_COLORS: Record<Position, string> = {
  GK: "#f59e0b",
  DEF: "#3b82f6",
  MID: "#10b981",
  FWD: "#ef4444",
};

export const DIFFICULTY_LABELS: Record<number, { label: string; budget: number }> = {
  1: { label: "Easy", budget: 100_000_000 },
  2: { label: "Normal", budget: 10_000_000 },
  3: { label: "Hard", budget: 1_000_000 },
  4: { label: "Very Hard", budget: 100_000 },
  5: { label: "Legendary", budget: 10_000 },
};

export const AI_TEAM_NAMES = [
  "London FC",
  "Madrid United",
  "Berlin Athletic",
  "Paris City",
  "Rome Rovers",
  "Lisbon Sporting",
  "Amsterdam Albion",
  "Vienna Town",
  "Prague Rangers",
];

export const FIRST_NAMES = [
  "James", "Michael", "John", "Robert", "David", "William", "Richard",
  "Joseph", "Thomas", "Charles", "Daniel", "Matthew", "Anthony", "Mark",
  "Steven", "Paul", "Andrew", "Joshua", "Kenneth", "Kevin", "Brian",
  "Luis", "Carlos", "Diego", "Marco", "Andrea", "Pierre", "Klaus",
  "Sven", "Hans", "Pablo", "Rafael", "Nikolai", "Ivan", "Stefan",
];

export const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
  "Davies", "Rodriguez", "Martinez", "Schmidt", "Rossi", "Dubois", "Müller",
  "Andersen", "Larsen", "Silva", "Santos", "Ferreira", "Costa", "Romano",
  "Bianchi", "Weber", "Janssen", "de Vries", "Novak", "Dvořák", "Kowalski",
  "Nowak", "Horvath", "Petrov", "Ivanov", "Olsen", "Eriksson", "Berg",
];

export const WEEKS_PER_SEASON = 18;

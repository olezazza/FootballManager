import {
  FIRST_NAMES,
  LAST_NAMES,
  type Position,
  type PlayerData,
  type MatchData,
} from "./types";

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generatePlayerName(): string {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

export function generatePosition(): Position {
  const positions: Position[] = ["GK", "DEF", "MID", "FWD"];
  const weights = [1, 4, 4, 3];
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < positions.length; i++) {
    r -= weights[i];
    if (r <= 0) return positions[i];
  }
  return "MID";
}

export function generatePrice(level: number, age: number): number {
  const baseByLevel: Record<number, [number, number]> = {
    1: [500, 2000],
    2: [2000, 5000],
    3: [5000, 15000],
    4: [15000, 50000],
    5: [50000, 150000],
  };
  const range = baseByLevel[Math.ceil(level / 20)] || baseByLevel[5];
  const ageMultiplier =
    age <= 23 ? 1.3 : age <= 28 ? 1.0 : age <= 31 ? 0.75 : 0.4;
  return Math.round(randomInt(range[0], range[1]) * ageMultiplier);
}

export function generatePlayerLevel(difficulty: number, isPlayerTeam: boolean): number {
  const base = isPlayerTeam
    ? randomInt(45, 75) + (6 - difficulty) * 2
    : randomInt(40, 78);
  return Math.max(1, Math.min(99, base));
}

export function generatePlayer(
  gameId: string,
  teamId: string,
  isPlayerTeam: boolean,
  difficulty: number = 3,
  highLevelChance: number = 0
): Omit<PlayerData, "id"> {
  const level = Math.random() < highLevelChance
    ? randomInt(75, 92)
    : generatePlayerLevel(difficulty, isPlayerTeam);
  const age = randomInt(17, 35);
  return {
    game_id: gameId,
    team_id: teamId,
    name: generatePlayerName(),
    position: generatePosition(),
    level,
    age,
    price: generatePrice(level, age),
    matches_played: 0,
    goals: 0,
    assists: 0,
    clean_sheets: 0,
    is_player_team: isPlayerTeam,
  };
}

export function generateSquad(
  gameId: string,
  teamId: string,
  isPlayerTeam: boolean,
  difficulty: number = 3,
  highLevelChance: number = 0
): Omit<PlayerData, "id">[] {
  const squad: Omit<PlayerData, "id">[] = [];
  for (let i = 0; i < 20; i++) {
    squad.push(generatePlayer(gameId, teamId, isPlayerTeam, difficulty, highLevelChance));
  }
  return squad;
}

export function generateAiTeamSquad(
  gameId: string,
  teamName: string,
  difficulty: number
): Omit<PlayerData, "id">[] {
  const highLevelChance = 0.1 + (5 - difficulty) * 0.03;
  return generateSquad(gameId, teamName, false, difficulty, highLevelChance);
}

export function teamStrength(players: PlayerData[]): number {
  if (players.length === 0) return 0;
  return players.reduce((sum, p) => sum + p.level, 0) / players.length;
}

export function teamAttackStrength(players: PlayerData[]): number {
  const forwards = players.filter((p) => p.position === "FWD");
  const mids = players.filter((p) => p.position === "MID");
  if (forwards.length === 0 && mids.length === 0) return teamStrength(players);
  const fwdAvg = forwards.length > 0 ? forwards.reduce((s, p) => s + p.level, 0) / forwards.length : 0;
  const midAvg = mids.length > 0 ? mids.reduce((s, p) => s + p.level, 0) / mids.length : 0;
  return fwdAvg * 0.6 + midAvg * 0.4;
}

export function teamDefenseStrength(players: PlayerData[]): number {
  const gks = players.filter((p) => p.position === "GK");
  const defs = players.filter((p) => p.position === "DEF");
  if (gks.length === 0 && defs.length === 0) return teamStrength(players);
  const gkAvg = gks.length > 0 ? gks.reduce((s, p) => s + p.level, 0) / gks.length : 0;
  const defAvg = defs.length > 0 ? defs.reduce((s, p) => s + p.level, 0) / defs.length : 0;
  return gkAvg * 0.3 + defAvg * 0.7;
}

export interface MatchResult {
  home_score: number;
  away_score: number;
  home_scorers: string[];
  away_scorers: string[];
}

export function simulateMatch(
  homePlayers: PlayerData[],
  awayPlayers: PlayerData[],
  _homeTeamName: string,
  _awayTeamName: string
): MatchResult {
  const homeAttack = teamAttackStrength(homePlayers);
  const awayAttack = teamAttackStrength(awayPlayers);
  const homeDefense = teamDefenseStrength(homePlayers);
  const awayDefense = teamDefenseStrength(awayPlayers);

  const homeAdvantage = 3;
  const homeExpected = Math.max(0.3, (homeAttack - awayDefense + homeAdvantage) / 8);
  const awayExpected = Math.max(0.2, (awayAttack - homeDefense) / 8);

  const homeScore = Math.min(7, Math.round(Math.max(0, homeExpected + (Math.random() - 0.5) * 2)));
  const awayScore = Math.min(7, Math.round(Math.max(0, awayExpected + (Math.random() - 0.5) * 2)));

  const homeScorers = pickScorers(homePlayers, homeScore);
  const awayScorers = pickScorers(awayPlayers, awayScore);

  return { home_score: homeScore, away_score: awayScore, home_scorers: homeScorers, away_scorers: awayScorers };
}

function pickScorers(players: PlayerData[], count: number): string[] {
  if (count === 0) return [];
  const scorers: string[] = [];
  const pool = players.filter((p) => p.position === "FWD" || p.position === "MID");
  if (pool.length === 0) return Array(count).fill("Unknown").slice(0, count);

  const weighted: { name: string; weight: number }[] = pool.map((p) => ({
    name: p.name,
    weight: p.position === "FWD" ? p.level : p.level * 0.4,
  }));
  const totalWeight = weighted.reduce((s, w) => s + w.weight, 0);

  for (let i = 0; i < count; i++) {
    let r = Math.random() * totalWeight;
    for (const w of weighted) {
      r -= w.weight;
      if (r <= 0) {
        scorers.push(w.name);
        break;
      }
    }
  }
  return scorers;
}

export function generateFixtures(
  gameId: string,
  season: number,
  teamNames: string[]
): Omit<MatchData, "id">[] {
  const fixtures: Omit<MatchData, "id">[] = [];
  const teams = [...teamNames];
  const n = teams.length;

  if (n % 2 !== 0) teams.push("BYE");

  const rounds = n - 1;
  const halfN = n / 2;

  const arr = [...teams];

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < halfN; i++) {
      const home = arr[i];
      const away = arr[n - 1 - i];
      if (home !== "BYE" && away !== "BYE") {
        const isHome = (round + i) % 2 === 0;
        fixtures.push({
          game_id: gameId,
          week: round + 1,
          season,
          home_team: isHome ? home : away,
          away_team: isHome ? away : home,
          home_score: 0,
          away_score: 0,
          played: false,
        });
      }
    }
    arr.splice(1, 0, arr.pop()!);
  }

  const secondHalf: Omit<MatchData, "id">[] = fixtures.map((f) => ({
    ...f,
    week: f.week + rounds,
    home_team: f.away_team,
    away_team: f.home_team,
  }));

  return [...fixtures, ...secondHalf];
}

export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

export function getLevelColor(level: number): string {
  if (level >= 85) return "#fbbf24";
  if (level >= 75) return "#34d399";
  if (level >= 65) return "#60a5fa";
  if (level >= 50) return "#a78bfa";
  return "#94a3b8";
}

export function getLevelLabel(level: number): string {
  if (level >= 85) return "World Class";
  if (level >= 75) return "Excellent";
  if (level >= 65) return "Good";
  if (level >= 50) return "Average";
  if (level >= 35) return "Weak";
  return "Amateur";
}

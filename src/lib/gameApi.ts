import { supabase } from "./supabase";
import {
  type GameData,
  type PlayerData,
  type MatchData,
  type StandingData,
  AI_TEAM_NAMES,
  DIFFICULTY_LABELS,
  WEEKS_PER_SEASON,
} from "./types";
import {
  generateSquad,
  generateAiTeamSquad,
  simulateMatch,
  generateFixtures,
  generatePlayer,
} from "./engine";

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function createGame(
  teamName: string,
  difficulty: number
): Promise<GameData> {
  const budget = DIFFICULTY_LABELS[difficulty].budget;

  const { data: game, error } = await supabase
    .from("games")
    .insert({
      team_name: teamName,
      difficulty,
      budget,
      current_week: 1,
      season: 1,
    })
    .select()
    .single();

  if (error) throw error;
  if (!game) throw new Error("Failed to create game");

  const gameId = game.id;

  const playerSquad = generateSquad(gameId, teamName, true, difficulty, 0.05);
  const allPlayers: Omit<PlayerData, "id">[] = [...playerSquad];

  for (const aiName of AI_TEAM_NAMES) {
    const aiSquad = generateAiTeamSquad(gameId, aiName, difficulty);
    allPlayers.push(...aiSquad);
  }

  const { error: playersError } = await supabase
    .from("players")
    .insert(allPlayers);
  if (playersError) throw playersError;

  const allTeamNames = [teamName, ...AI_TEAM_NAMES];
  const fixtures = generateFixtures(gameId, 1, allTeamNames);
  const { error: matchesError } = await supabase
    .from("matches")
    .insert(fixtures);
  if (matchesError) throw matchesError;

  const standings: Omit<StandingData, "id">[] = allTeamNames.map((name) => ({
    game_id: gameId,
    season: 1,
    team_name: name,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goals_for: 0,
    goals_against: 0,
    points: 0,
  }));

  const { error: standingsError } = await supabase
    .from("standings")
    .insert(standings);
  if (standingsError) throw standingsError;

  return game;
}

export async function loadGame(): Promise<GameData | null> {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteGame(gameId: string): Promise<void> {
  const { error } = await supabase.from("games").delete().eq("id", gameId);
  if (error) throw error;
}

export async function getPlayersForGame(gameId: string): Promise<PlayerData[]> {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("game_id", gameId);
  if (error) throw error;
  return data || [];
}

export async function getPlayerTeamPlayers(gameId: string): Promise<PlayerData[]> {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("game_id", gameId)
    .eq("is_player_team", true);
  if (error) throw error;
  return data || [];
}

export async function getAiTeamPlayers(gameId: string, teamName: string): Promise<PlayerData[]> {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("game_id", gameId)
    .eq("team_id", teamName)
    .eq("is_player_team", false);
  if (error) throw error;
  return data || [];
}

export async function getAllTeamSquads(gameId: string): Promise<Record<string, PlayerData[]>> {
  const players = await getPlayersForGame(gameId);
  const map: Record<string, PlayerData[]> = {};
  for (const p of players) {
    if (!map[p.team_id]) map[p.team_id] = [];
    map[p.team_id].push(p);
  }
  return map;
}

async function getGameTeamName(gameId: string): Promise<string> {
  const { data, error } = await supabase
    .from("games")
    .select("team_name")
    .eq("id", gameId)
    .maybeSingle();
  if (error) throw error;
  return data?.team_name || "Player Team";
}

export async function buyPlayer(
  gameId: string,
  playerId: string,
  price: number,
  currentBudget: number
): Promise<{ success: boolean; message: string; newBudget?: number }> {
  if (currentBudget < price) {
    return { success: false, message: "Not enough money!" };
  }
  const newBudget = currentBudget - price;
  const teamName = await getGameTeamName(gameId);

  const { error: playerError } = await supabase
    .from("players")
    .update({ is_player_team: true, team_id: teamName })
    .eq("id", playerId);
  if (playerError) throw playerError;

  const { error: budgetError } = await supabase
    .from("games")
    .update({ budget: newBudget, updated_at: new Date().toISOString() })
    .eq("id", gameId);
  if (budgetError) throw budgetError;

  return { success: true, message: "Player signed!", newBudget };
}

export async function sellPlayer(
  gameId: string,
  playerId: string,
  price: number,
  currentBudget: number
): Promise<{ success: boolean; message: string; newBudget?: number }> {
  const newBudget = currentBudget + price;

  const { error: playerError } = await supabase
    .from("players")
    .update({ is_player_team: false, team_id: "Free Agents" })
    .eq("id", playerId);
  if (playerError) throw playerError;

  const { error: budgetError } = await supabase
    .from("games")
    .update({ budget: newBudget, updated_at: new Date().toISOString() })
    .eq("id", gameId);
  if (budgetError) throw budgetError;

  return { success: true, message: "Player sold!", newBudget };
}

export async function trainPlayer(
  playerId: string
): Promise<{ success: boolean; message: string }> {
  const { data: player, error: fetchError } = await supabase
    .from("players")
    .select("*")
    .eq("id", playerId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!player) return { success: false, message: "Player not found" };

  if (player.level >= 99) {
    return { success: false, message: "Player is already at max level" };
  }

  const gain = Math.random() < 0.7 ? randomInt(1, 3) : 0;
  if (gain === 0) {
    return { success: false, message: "Training had no effect this time" };
  }

  const newLevel = Math.min(99, player.level + gain);

  const { error: updateError } = await supabase
    .from("players")
    .update({ level: newLevel })
    .eq("id", playerId);
  if (updateError) throw updateError;

  return {
    success: true,
    message: `${player.name} improved by ${gain} level${gain > 1 ? "s" : ""}! Now at ${newLevel}.`,
  };
}

export async function getMatchesForWeek(
  gameId: string,
  week: number,
  season: number
): Promise<MatchData[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("game_id", gameId)
    .eq("week", week)
    .eq("season", season)
    .order("home_team");
  if (error) throw error;
  return data || [];
}

export async function getPlayedMatches(gameId: string, season: number): Promise<MatchData[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("game_id", gameId)
    .eq("season", season)
    .eq("played", true)
    .order("week", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data || [];
}

export async function getStandings(gameId: string, season: number): Promise<StandingData[]> {
  const { data, error } = await supabase
    .from("standings")
    .select("*")
    .eq("game_id", gameId)
    .eq("season", season)
    .order("points", { ascending: false })
    .order("goals_for", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getGame(gameId: string): Promise<GameData> {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("id", gameId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Game not found");
  return data;
}

export async function simulateWeek(
  gameId: string,
  week: number,
  season: number
): Promise<{ results: MatchData[]; isSeasonEnd: boolean }> {
  const game = await getGame(gameId);
  const matches = await getMatchesForWeek(gameId, week, season);
  const unplayed = matches.filter((m) => !m.played);

  if (unplayed.length === 0) {
    return { results: [], isSeasonEnd: false };
  }

  const allSquads = await getAllTeamSquads(gameId);
  const updatedMatches: MatchData[] = [];
  const allTeamNames = [game.team_name, ...AI_TEAM_NAMES];

  const currentStandings = await getStandings(gameId, season);
  const standingMap: Record<string, StandingData> = {};
  for (const s of currentStandings) {
    standingMap[s.team_name] = { ...s };
  }

  for (const match of unplayed) {
    const homePlayers = allSquads[match.home_team] || [];
    const awayPlayers = allSquads[match.away_team] || [];

    const result = simulateMatch(homePlayers, awayPlayers, match.home_team, match.away_team);

    const { error: matchError } = await supabase
      .from("matches")
      .update({
        home_score: result.home_score,
        away_score: result.away_score,
        played: true,
      })
      .eq("id", match.id);
    if (matchError) throw matchError;

    updatedMatches.push({
      ...match,
      home_score: result.home_score,
      away_score: result.away_score,
      played: true,
    });

    const homeStanding = standingMap[match.home_team];
    const awayStanding = standingMap[match.away_team];

    if (homeStanding) {
      homeStanding.played += 1;
      homeStanding.goals_for += result.home_score;
      homeStanding.goals_against += result.away_score;
      if (result.home_score > result.away_score) {
        homeStanding.won += 1;
        homeStanding.points += 3;
      } else if (result.home_score === result.away_score) {
        homeStanding.drawn += 1;
        homeStanding.points += 1;
      } else {
        homeStanding.lost += 1;
      }
    }

    if (awayStanding) {
      awayStanding.played += 1;
      awayStanding.goals_for += result.away_score;
      awayStanding.goals_against += result.home_score;
      if (result.away_score > result.home_score) {
        awayStanding.won += 1;
        awayStanding.points += 3;
      } else if (result.away_score === result.home_score) {
        awayStanding.drawn += 1;
        awayStanding.points += 1;
      } else {
        awayStanding.lost += 1;
      }
    }

    for (const scorerName of result.home_scorers) {
      const scorer = homePlayers.find((p) => p.name === scorerName);
      if (scorer) {
        await supabase
          .from("players")
          .update({ goals: scorer.goals + 1, matches_played: scorer.matches_played + 1 })
          .eq("id", scorer.id);
      }
    }
    for (const scorerName of result.away_scorers) {
      const scorer = awayPlayers.find((p) => p.name === scorerName);
      if (scorer) {
        await supabase
          .from("players")
          .update({ goals: scorer.goals + 1, matches_played: scorer.matches_played + 1 })
          .eq("id", scorer.id);
      }
    }
  }

  for (const name of allTeamNames) {
    const s = standingMap[name];
    if (s) {
      const { error: sError } = await supabase
        .from("standings")
        .update({
          played: s.played,
          won: s.won,
          drawn: s.drawn,
          lost: s.lost,
          goals_for: s.goals_for,
          goals_against: s.goals_against,
          points: s.points,
        })
        .eq("game_id", gameId)
        .eq("season", season)
        .eq("team_name", name);
      if (sError) throw sError;
    }
  }

  const isSeasonEnd = week >= WEEKS_PER_SEASON;
  const newWeek = isSeasonEnd ? 1 : week + 1;
  const newSeason = isSeasonEnd ? season + 1 : season;

  const { error: gameError } = await supabase
    .from("games")
    .update({
      current_week: newWeek,
      season: newSeason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", gameId);
  if (gameError) throw gameError;

  if (isSeasonEnd) {
    await startNewSeason(gameId, newSeason, game.team_name);
  }

  return { results: updatedMatches, isSeasonEnd };
}

async function startNewSeason(gameId: string, season: number, teamName: string): Promise<void> {
  const allTeamNames = [teamName, ...AI_TEAM_NAMES];
  const fixtures = generateFixtures(gameId, season, allTeamNames);
  const { error: matchesError } = await supabase
    .from("matches")
    .insert(fixtures);
  if (matchesError) throw matchesError;

  const standings: Omit<StandingData, "id">[] = allTeamNames.map((name) => ({
    game_id: gameId,
    season,
    team_name: name,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goals_for: 0,
    goals_against: 0,
    points: 0,
  }));

  const { error: standingsError } = await supabase
    .from("standings")
    .insert(standings);
  if (standingsError) throw standingsError;

  const { data: players, error: playerError } = await supabase
    .from("players")
    .select("*")
    .eq("game_id", gameId)
    .eq("is_player_team", true);
  if (playerError) throw playerError;

  for (const p of players || []) {
    const newAge = p.age + 1;
    const agePenalty = newAge > 30 ? -1 : 0;
    const newLevel = Math.max(1, p.level + agePenalty + (Math.random() < 0.3 ? 1 : 0));
    const newPrice = Math.round(p.price * (newAge > 31 ? 0.85 : 1.0));

    await supabase
      .from("players")
      .update({ age: newAge, level: newLevel, price: newPrice })
      .eq("id", p.id);
  }
}

export async function generateTransferMarket(gameId: string, count: number = 20): Promise<PlayerData[]> {
  const game = await getGame(gameId);

  const { data: freeAgents } = await supabase
    .from("players")
    .select("*")
    .eq("game_id", gameId)
    .eq("team_id", "Free Agents")
    .limit(count);

  if (freeAgents && freeAgents.length >= count) {
    return freeAgents;
  }

  const marketPlayers: Omit<PlayerData, "id">[] = [];
  for (let i = 0; i < count; i++) {
    marketPlayers.push(generatePlayer(gameId, "Free Agents", false, game.difficulty, 0.1));
  }

  const { data: inserted, error } = await supabase
    .from("players")
    .insert(marketPlayers)
    .select();
  if (error) throw error;
  return inserted || [];
}

export async function refreshMarketPlayers(gameId: string): Promise<PlayerData[]> {
  const { error } = await supabase
    .from("players")
    .delete()
    .eq("game_id", gameId)
    .eq("team_id", "Free Agents")
    .eq("is_player_team", false);
  if (error) throw error;

  return generateTransferMarket(gameId, 20);
}

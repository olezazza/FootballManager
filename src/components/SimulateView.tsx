import { useState, useEffect } from "react";
import type { GameData, MatchData } from "../lib/types";
import { WEEKS_PER_SEASON } from "../lib/types";
import { simulateWeek, getMatchesForWeek } from "../lib/gameApi";

interface Props {
  game: GameData;
  onWeekAdvanced: (newWeek: number, newSeason: number) => void;
  onToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function SimulateView({ game, onWeekAdvanced, onToast }: Props) {
  const [weekMatches, setWeekMatches] = useState<MatchData[]>([]);
  const [results, setResults] = useState<MatchData[]>([]);
  const [simulating, setSimulating] = useState(false);
  const [hasSimulated, setHasSimulated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setResults([]);
    setHasSimulated(false);
    getMatchesForWeek(game.id, game.current_week, game.season)
      .then((matches) => {
        setWeekMatches(matches);
        const played = matches.filter((m) => m.played);
        if (played.length > 0) {
          setResults(played);
          setHasSimulated(true);
        }
      })
      .catch(() => onToast("Failed to load matches", "error"))
      .finally(() => setLoading(false));
  }, [game.id, game.current_week, game.season]);

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const { isSeasonEnd } = await simulateWeek(game.id, game.current_week, game.season);
      const updated = await getMatchesForWeek(game.id, game.current_week, game.season);
      setWeekMatches(updated);
      setResults(updated.filter((m) => m.played));
      setHasSimulated(true);

      if (isSeasonEnd) {
        onToast("Season complete! A new season has begun.", "success");
        onWeekAdvanced(1, game.season + 1);
      } else {
        onWeekAdvanced(game.current_week + 1, game.season);
      }
    } catch {
      onToast("Failed to simulate match", "error");
    }
    setSimulating(false);
  };

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: "300px" }}>
        <div className="spinner" />
      </div>
    );
  }

  const playerMatch = results.find(
    (m) => m.home_team === game.team_name || m.away_team === game.team_name
  );

  const playerResult = playerMatch
    ? playerMatch.home_team === game.team_name
      ? playerMatch.home_score > playerMatch.away_score
        ? "win"
        : playerMatch.home_score === playerMatch.away_score
        ? "draw"
        : "loss"
      : playerMatch.away_score > playerMatch.home_score
      ? "win"
      : playerMatch.away_score === playerMatch.home_score
      ? "draw"
      : "loss"
    : null;

  return (
    <div className="simulate-container">
      <div className="simulate-hero">
        <div className="week-display">Matchday</div>
        <div className="week-number">{game.current_week}</div>
        <div className="season-display">Season {game.season} - Week {game.current_week} of {WEEKS_PER_SEASON}</div>
      </div>

      {hasSimulated && results.length > 0 && (
        <>
          {playerMatch && playerResult && (
            <div
              style={{
                display: "inline-block", padding: "12px 32px", borderRadius: "var(--radius-lg)",
                fontWeight: 800, fontSize: "1.5rem", marginBottom: "24px",
                background: playerResult === "win" ? "var(--primary-glow)" : playerResult === "draw" ? "rgba(245, 158, 11, 0.15)" : "rgba(239, 68, 68, 0.15)",
                color: playerResult === "win" ? "var(--primary)" : playerResult === "draw" ? "var(--warning)" : "var(--danger)",
                border: `2px solid ${playerResult === "win" ? "var(--primary)" : playerResult === "draw" ? "var(--warning)" : "var(--danger)"}`,
              }}
            >
              {playerResult === "win" ? "VICTORY" : playerResult === "draw" ? "DRAW" : "DEFEAT"}
              {" - "}
              {playerMatch.home_team === game.team_name
                ? `${playerMatch.home_score} - ${playerMatch.away_score}`
                : `${playerMatch.away_score} - ${playerMatch.home_score}`}
            </div>
          )}

          <div className="card" style={{ textAlign: "left" }}>
            <div className="card-header">
              <div className="card-title">Matchday {game.current_week} Results</div>
            </div>
            <div className="match-results-list">
              {results.map((match) => {
                const isPlayerMatch = match.home_team === game.team_name || match.away_team === game.team_name;
                return (
                  <div key={match.id} className={`result-item ${isPlayerMatch ? "player-match" : ""}`}>
                    <div className="result-teams">
                      <span style={{ flex: 1, textAlign: "right", color: match.home_team === game.team_name ? "var(--primary)" : "inherit" }}>
                        {match.home_team}
                      </span>
                      <span className="result-score">{match.home_score} - {match.away_score}</span>
                      <span style={{ flex: 1, color: match.away_team === game.team_name ? "var(--primary)" : "inherit" }}>
                        {match.away_team}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {!hasSimulated && weekMatches.length > 0 && (
        <div className="card" style={{ textAlign: "left", marginBottom: "24px" }}>
          <div className="card-header">
            <div className="card-title">Upcoming Fixtures</div>
          </div>
          <div className="match-list">
            {weekMatches.map((match) => (
              <div key={match.id} className="match-item unplayed">
                <span className="match-team home" style={match.home_team === game.team_name ? { color: "var(--primary)" } : {}}>
                  {match.home_team}
                </span>
                <span className="match-vs">VS</span>
                <span className="match-team away" style={match.away_team === game.team_name ? { color: "var(--primary)" } : {}}>
                  {match.away_team}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        className="btn btn-primary btn-lg"
        onClick={handleSimulate}
        disabled={simulating || hasSimulated}
        style={{ marginTop: "16px" }}
      >
        {simulating ? "Simulating..." : hasSimulated ? "Week Complete - Advance to Next Week" : `Simulate Matchday ${game.current_week}`}
      </button>

      {hasSimulated && !simulating && (
        <p style={{ color: "var(--text-muted)", marginTop: "16px", fontSize: "0.85rem" }}>
          Switch to the League tab to see the updated standings
        </p>
      )}
    </div>
  );
}

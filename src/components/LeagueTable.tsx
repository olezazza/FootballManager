import { useState, useEffect } from "react";
import type { GameData, StandingData, MatchData } from "../lib/types";
import { getStandings, getPlayedMatches } from "../lib/gameApi";

interface Props {
  game: GameData;
}

export default function LeagueTable({ game }: Props) {
  const [standings, setStandings] = useState<StandingData[]>([]);
  const [recentMatches, setRecentMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStandings(game.id, game.season), getPlayedMatches(game.id, game.season)])
      .then(([stands, matches]) => { setStandings(stands); setRecentMatches(matches); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [game.id, game.season]);

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: "300px" }}>
        <div className="spinner" />
      </div>
    );
  }

  const sorted = [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const aGD = a.goals_for - a.goals_against;
    const bGD = b.goals_for - b.goals_against;
    if (bGD !== aGD) return bGD - aGD;
    return b.goals_for - a.goals_for;
  });

  const playerMatchResults = recentMatches
    .filter((m) => m.home_team === game.team_name || m.away_team === game.team_name)
    .slice(0, 5);

  return (
    <div>
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-header">
          <div className="card-title">League Table - Season {game.season}</div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="league-table">
            <thead>
              <tr>
                <th className="center">Pos</th>
                <th>Team</th>
                <th className="center">P</th>
                <th className="center hide-mobile">W</th>
                <th className="center hide-mobile">D</th>
                <th className="center hide-mobile">L</th>
                <th className="center hide-mobile">GF</th>
                <th className="center hide-mobile">GA</th>
                <th className="center hide-mobile">GD</th>
                <th className="center">Pts</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((team, idx) => {
                const isPlayer = team.team_name === game.team_name;
                const gd = team.goals_for - team.goals_against;
                return (
                  <tr key={team.id} className={isPlayer ? "player-team" : ""}>
                    <td className="pos-cell center">{idx + 1}</td>
                    <td className="team-cell">{team.team_name}</td>
                    <td className="center">{team.played}</td>
                    <td className="center hide-mobile">{team.won}</td>
                    <td className="center hide-mobile">{team.drawn}</td>
                    <td className="center hide-mobile">{team.lost}</td>
                    <td className="center hide-mobile">{team.goals_for}</td>
                    <td className="center hide-mobile">{team.goals_against}</td>
                    <td className="center hide-mobile" style={{ color: gd > 0 ? "var(--primary)" : gd < 0 ? "var(--danger)" : "inherit" }}>
                      {gd > 0 ? "+" : ""}{gd}
                    </td>
                    <td className="points-cell center">{team.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {playerMatchResults.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Your Recent Results</div>
          </div>
          <div className="match-list">
            {playerMatchResults.map((match) => {
              const isHome = match.home_team === game.team_name;
              const myScore = isHome ? match.home_score : match.away_score;
              const oppScore = isHome ? match.away_score : match.home_score;
              const result = myScore > oppScore ? "W" : myScore === oppScore ? "D" : "L";
              const resultClass = result === "W" ? "result-win" : result === "D" ? "result-draw" : "result-loss";
              return (
                <div key={match.id} className="match-item">
                  <span className="match-week">Wk {match.week}</span>
                  <span className="match-team home" style={isHome ? { color: "var(--primary)" } : {}}>{match.home_team}</span>
                  <span className={`match-score ${resultClass}`}>{match.home_score} - {match.away_score}</span>
                  <span className="match-team away" style={!isHome ? { color: "var(--primary)" } : {}}>{match.away_team}</span>
                  <span className={resultClass} style={{ fontWeight: 800, fontSize: "1rem", minWidth: "28px", textAlign: "center" }}>{result}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

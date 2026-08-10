import { useState, useEffect } from "react";
import type { GameData, PlayerData, Position } from "../lib/types";
import { POSITION_LABELS, POSITION_COLORS } from "../lib/types";
import { getPlayerTeamPlayers } from "../lib/gameApi";
import { formatCurrency, getLevelColor, getLevelLabel } from "../lib/engine";

interface Props {
  game: GameData;
  onToast: (msg: string, type?: "success" | "error" | "info") => void;
}

type Filter = "ALL" | Position;

export default function SquadView({ game }: Props) {
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("ALL");

  useEffect(() => {
    getPlayerTeamPlayers(game.id)
      .then(setPlayers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [game.id]);

  const filtered = filter === "ALL" ? players : players.filter((p) => p.position === filter);
  const sorted = [...filtered].sort((a, b) => b.level - a.level);

  const avgLevel = players.length > 0
    ? (players.reduce((s, p) => s + p.level, 0) / players.length).toFixed(1)
    : "0";
  const totalValue = players.reduce((s, p) => s + p.price, 0);
  const topScorer = [...players].sort((a, b) => b.goals - a.goals)[0];

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: "300px" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="squad-stats">
        <div className="stat-card">
          <div className="stat-value">{players.length}</div>
          <div className="stat-label">Squad Size</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{avgLevel}</div>
          <div className="stat-label">Avg Level</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatCurrency(totalValue)}</div>
          <div className="stat-label">Squad Value</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{topScorer && topScorer.goals > 0 ? topScorer.goals : "—"}</div>
          <div className="stat-label">Top Scorer</div>
        </div>
      </div>

      <div className="filter-bar">
        {(["ALL", "GK", "DEF", "MID", "FWD"] as Filter[]).map((f) => (
          <button key={f} className={`filter-chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f === "ALL" ? "All Players" : POSITION_LABELS[f as Position]}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-title">No players in this category</div>
        </div>
      ) : (
        <div className="player-grid">
          {sorted.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      )}
    </div>
  );
}

function PlayerCard({ player }: { player: PlayerData }) {
  const posColor = POSITION_COLORS[player.position];
  const levelColor = getLevelColor(player.level);

  return (
    <div className="player-card" style={{ ["--pos-color" as any]: posColor, ["--level-color" as any]: levelColor }}>
      <div className="pc-header">
        <div className="pc-level">
          <div className="level-num" style={{ color: levelColor }}>{player.level}</div>
          <div className="level-label">{getLevelLabel(player.level)}</div>
        </div>
        <div className="pc-position" style={{ background: posColor }}>{player.position}</div>
      </div>
      <div className="pc-name">{player.name}</div>
      <div className="pc-stats">
        <div className="pc-stat">
          <div className="stat-value">{player.age}</div>
          <div className="stat-label">Age</div>
        </div>
        <div className="pc-stat">
          <div className="stat-value">{player.goals}</div>
          <div className="stat-label">Goals</div>
        </div>
        <div className="pc-stat">
          <div className="stat-value">{player.matches_played}</div>
          <div className="stat-label">Matches</div>
        </div>
      </div>
      <div className="pc-footer">
        <div className="pc-price">{formatCurrency(player.price)}</div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{POSITION_LABELS[player.position]}</div>
      </div>
    </div>
  );
}

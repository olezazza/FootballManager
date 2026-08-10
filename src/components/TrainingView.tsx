import { useState, useEffect } from "react";
import type { GameData, PlayerData } from "../lib/types";
import { getPlayerTeamPlayers, trainPlayer } from "../lib/gameApi";
import { formatCurrency, getLevelColor, getLevelLabel } from "../lib/engine";
import { POSITION_COLORS, POSITION_LABELS } from "../lib/types";

interface Props {
  game: GameData;
  onToast: (msg: string, type?: "success" | "error" | "info") => void;
}

const TRAINING_COST = 50000;

export default function TrainingView({ game, onToast }: Props) {
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [trainingId, setTrainingId] = useState<string | null>(null);

  useEffect(() => {
    getPlayerTeamPlayers(game.id)
      .then(setPlayers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [game.id]);

  const handleTrain = async (player: PlayerData) => {
    setTrainingId(player.id);
    try {
      const result = await trainPlayer(player.id);
      onToast(result.message, result.success ? "success" : "info");
      if (result.success) {
        const updated = await getPlayerTeamPlayers(game.id);
        setPlayers(updated);
      }
    } catch {
      onToast("Training failed", "error");
    }
    setTrainingId(null);
  };

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: "300px" }}>
        <div className="spinner" />
      </div>
    );
  }

  const sorted = [...players].sort((a, b) => b.level - a.level);
  const canAffordTraining = game.budget >= TRAINING_COST;

  return (
    <div className="training-section">
      <div className="card training-info">
        <div className="card-header">
          <div className="card-title">Training Center</div>
        </div>
        <p>
          Send your players to training sessions to improve their level. Each session costs{" "}
          <strong style={{ color: "var(--warning)" }}>{formatCurrency(TRAINING_COST)}</strong> and has
          a chance to boost a player's level by 1-3 points.
        </p>
        <p>
          Younger players tend to develop faster. Players at level 99 cannot improve further.
          Training is not guaranteed to succeed every time.
        </p>
        <div className="training-cost">
          <span className="cost-label">Cost per session:</span>
          <span className="cost-value">{formatCurrency(TRAINING_COST)}</span>
        </div>
        <div className="training-cost">
          <span className="cost-label">Your budget:</span>
          <span className="cost-value" style={{ color: canAffordTraining ? "var(--primary)" : "var(--danger)" }}>
            {formatCurrency(game.budget)}
          </span>
        </div>
        {!canAffordTraining && (
          <p style={{ color: "var(--danger)", fontSize: "0.85rem" }}>
            You don't have enough budget for training. Sell players to fund training sessions.
          </p>
        )}
      </div>

      <div>
        {sorted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <div className="empty-title">No players to train</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {sorted.map((player) => {
              const posColor = POSITION_COLORS[player.position];
              const levelColor = getLevelColor(player.level);
              const canAfford = game.budget >= TRAINING_COST;
              const isMaxLevel = player.level >= 99;
              return (
                <div key={player.id} className="player-card"
                  style={{ ["--pos-color" as any]: posColor, ["--level-color" as any]: levelColor }}>
                  <div className="pc-header">
                    <div className="pc-level">
                      <div className="level-num" style={{ color: levelColor }}>{player.level}</div>
                      <div className="level-label">{getLevelLabel(player.level)}</div>
                    </div>
                    <div className="pc-position" style={{ background: posColor }}>{player.position}</div>
                  </div>
                  <div className="pc-name">{player.name}</div>
                  <div className="pc-stats">
                    <div className="pc-stat"><div className="stat-value">{player.age}</div><div className="stat-label">Age</div></div>
                    <div className="pc-stat"><div className="stat-value">{POSITION_LABELS[player.position]}</div><div className="stat-label">Position</div></div>
                    <div className="pc-stat"><div className="stat-value">{player.goals}</div><div className="stat-label">Goals</div></div>
                  </div>
                  <div className="pc-footer">
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{formatCurrency(TRAINING_COST)}</div>
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={!canAfford || isMaxLevel || trainingId === player.id}
                      onClick={() => handleTrain(player)}
                    >
                      {trainingId === player.id ? "Training..." : isMaxLevel ? "Max Level" : "Train"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

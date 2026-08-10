import { useState, useEffect } from "react";
import type { GameData, PlayerData } from "../lib/types";
import { buyPlayer, sellPlayer, getPlayerTeamPlayers, generateTransferMarket, refreshMarketPlayers } from "../lib/gameApi";
import { formatCurrency, getLevelColor } from "../lib/engine";
import { POSITION_COLORS } from "../lib/types";

interface Props {
  game: GameData;
  onBudgetChange: (newBudget: number) => void;
  onSquadUpdate: () => void;
  onToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function TransferMarket({ game, onBudgetChange, onSquadUpdate, onToast }: Props) {
  const [marketPlayers, setMarketPlayers] = useState<PlayerData[]>([]);
  const [squadPlayers, setSquadPlayers] = useState<PlayerData[]>([]);
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSquad = () => getPlayerTeamPlayers(game.id).then(setSquadPlayers);

  useEffect(() => {
    Promise.all([generateTransferMarket(game.id, 20), loadSquad()])
      .then(([market]) => setMarketPlayers(market))
      .catch(() => onToast("Failed to load market", "error"))
      .finally(() => setLoading(false));
  }, [game.id]);

  const handleBuy = async (player: PlayerData) => {
    try {
      const result = await buyPlayer(game.id, player.id, player.price, game.budget);
      if (result.success) {
        onToast(result.message, "success");
        onBudgetChange(result.newBudget!);
        onSquadUpdate();
        setMarketPlayers((prev) => prev.filter((p) => p.id !== player.id));
        await loadSquad();
      } else {
        onToast(result.message, "error");
      }
    } catch {
      onToast("Transfer failed", "error");
    }
  };

  const handleSell = async (player: PlayerData) => {
    try {
      const result = await sellPlayer(game.id, player.id, player.price, game.budget);
      if (result.success) {
        onToast(result.message, "success");
        onBudgetChange(result.newBudget!);
        onSquadUpdate();
        setMarketPlayers((prev) => [...prev, { ...player, is_player_team: false, team_id: "Free Agents" }]);
        await loadSquad();
      }
    } catch {
      onToast("Sale failed", "error");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const fresh = await refreshMarketPlayers(game.id);
      setMarketPlayers(fresh);
      onToast("Market refreshed with new players!", "info");
    } catch {
      onToast("Failed to refresh market", "error");
    }
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: "300px" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-header">
          <div className="card-title">Transfer Market</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--primary)" }}>
            Budget: {formatCurrency(game.budget)}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button className={`filter-chip ${mode === "buy" ? "active" : ""}`} onClick={() => setMode("buy")}>Buy Players</button>
          <button className={`filter-chip ${mode === "sell" ? "active" : ""}`} onClick={() => setMode("sell")}>Sell Players</button>
          {mode === "buy" && (
            <button className="filter-chip" onClick={handleRefresh} style={{ marginLeft: "auto" }}>
              {refreshing ? "Refreshing..." : "Refresh Market"}
            </button>
          )}
        </div>
      </div>

      {mode === "buy" ? (
        marketPlayers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏪</div>
            <div className="empty-title">No players available on the market</div>
            <p>Try refreshing the market for new signings</p>
          </div>
        ) : (
          <div className="player-grid">
            {marketPlayers.sort((a, b) => b.level - a.level).map((player) => {
              const canAfford = game.budget >= player.price;
              return (
                <div key={player.id} className="player-card"
                  style={{ ["--pos-color" as any]: POSITION_COLORS[player.position], ["--level-color" as any]: getLevelColor(player.level) }}>
                  <div className="pc-header">
                    <div className="pc-level">
                      <div className="level-num" style={{ color: getLevelColor(player.level) }}>{player.level}</div>
                    </div>
                    <div className="pc-position" style={{ background: POSITION_COLORS[player.position] }}>{player.position}</div>
                  </div>
                  <div className="pc-name">{player.name}</div>
                  <div className="pc-stats">
                    <div className="pc-stat"><div className="stat-value">{player.age}</div><div className="stat-label">Age</div></div>
                    <div className="pc-stat"><div className="stat-value">{player.position}</div><div className="stat-label">Pos</div></div>
                  </div>
                  <div className="pc-footer">
                    <div className="pc-price">{formatCurrency(player.price)}</div>
                    <button className="btn btn-primary btn-sm" disabled={!canAfford} onClick={() => handleBuy(player)}>
                      {canAfford ? "Buy" : "Too Expensive"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        squadPlayers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-title">No players in your squad to sell</div>
          </div>
        ) : (
          <div className="player-grid">
            {squadPlayers.sort((a, b) => b.level - a.level).map((player) => (
              <div key={player.id} className="player-card"
                style={{ ["--pos-color" as any]: POSITION_COLORS[player.position], ["--level-color" as any]: getLevelColor(player.level) }}>
                <div className="pc-header">
                  <div className="pc-level">
                    <div className="level-num" style={{ color: getLevelColor(player.level) }}>{player.level}</div>
                  </div>
                  <div className="pc-position" style={{ background: POSITION_COLORS[player.position] }}>{player.position}</div>
                </div>
                <div className="pc-name">{player.name}</div>
                <div className="pc-stats">
                  <div className="pc-stat"><div className="stat-value">{player.age}</div><div className="stat-label">Age</div></div>
                  <div className="pc-stat"><div className="stat-value">{player.goals}</div><div className="stat-label">Goals</div></div>
                </div>
                <div className="pc-footer">
                  <div className="pc-price">{formatCurrency(player.price)}</div>
                  <button className="btn btn-danger btn-sm" onClick={() => handleSell(player)}>Sell</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

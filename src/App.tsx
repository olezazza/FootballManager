import { useState, useEffect, useCallback } from "react";
import type { GameData } from "./lib/types";
import * as api from "./lib/gameApi";
import SetupScreen from "./components/SetupScreen";
import SquadView from "./components/SquadView";
import TransferMarket from "./components/TransferMarket";
import SimulateView from "./components/SimulateView";
import LeagueTable from "./components/LeagueTable";
import TrainingView from "./components/TrainingView";

type Tab = "squad" | "market" | "simulate" | "league" | "training";

export default function App() {
  const [game, setGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("squad");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  const [squadVersion, setSquadVersion] = useState(0);
  const [showNewGameModal, setShowNewGameModal] = useState(false);

  const showToast = useCallback((msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    api.loadGame()
      .then((g) => setGame(g))
      .catch(() => showToast("Failed to load game", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const handleGameCreated = (g: GameData) => {
    setGame(g);
    setTab("squad");
    showToast(`Welcome, ${g.team_name}!`, "success");
  };

  const handleBudgetChange = (newBudget: number) => {
    setGame((prev) => (prev ? { ...prev, budget: newBudget } : prev));
  };

  const handleSquadUpdate = () => {
    setSquadVersion((v) => v + 1);
  };

  const handleWeekAdvanced = (newWeek: number, newSeason: number) => {
    setGame((prev) => (prev ? { ...prev, current_week: newWeek, season: newSeason } : prev));
    setSquadVersion((v) => v + 1);
  };

  const confirmNewGame = async () => {
    if (game) {
      await api.deleteGame(game.id);
    }
    setGame(null);
    setShowNewGameModal(false);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
      </div>
    );
  }

  if (!game) {
    return <SetupScreen onGameCreated={handleGameCreated} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <div className="ball">⚽</div>
          <span>Football Manager</span>
        </div>
        <div className="header-info">
          <div className="header-stat">
            <span className="label">Team</span>
            <span className="value">{game.team_name}</span>
          </div>
          <div className="header-stat">
            <span className="label">Budget</span>
            <span className="value budget">${game.budget.toLocaleString()}</span>
          </div>
          <div className="header-stat">
            <span className="label">Week</span>
            <span className="value">{game.current_week}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowNewGameModal(true)}>
            New Game
          </button>
        </div>
      </header>

      <div className="app-body">
        <div className="tab-bar">
          <button className={`tab ${tab === "squad" ? "active" : ""}`} onClick={() => setTab("squad")}>Stadium</button>
          <button className={`tab ${tab === "market" ? "active" : ""}`} onClick={() => setTab("market")}>Transfers</button>
          <button className={`tab ${tab === "simulate" ? "active" : ""}`} onClick={() => setTab("simulate")}>Play Match</button>
          <button className={`tab ${tab === "league" ? "active" : ""}`} onClick={() => setTab("league")}>League</button>
          <button className={`tab ${tab === "training" ? "active" : ""}`} onClick={() => setTab("training")}>Training</button>
        </div>

        {tab === "squad" && <SquadView key={squadVersion} game={game} onToast={showToast} />}
        {tab === "market" && (
          <TransferMarket game={game} onBudgetChange={handleBudgetChange} onSquadUpdate={handleSquadUpdate} onToast={showToast} />
        )}
        {tab === "simulate" && <SimulateView game={game} onWeekAdvanced={handleWeekAdvanced} onToast={showToast} />}
        {tab === "league" && <LeagueTable game={game} />}
        {tab === "training" && <TrainingView key={squadVersion} game={game} onToast={showToast} />}
      </div>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      {showNewGameModal && (
        <div className="modal-overlay" onClick={() => setShowNewGameModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Start a New Game?</h2>
            <p>Your current club and all progress will be permanently deleted. This cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowNewGameModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmNewGame}>Delete & Start New</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

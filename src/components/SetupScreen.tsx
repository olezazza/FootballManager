import { useState } from "react";
import { createGame } from "../lib/gameApi";
import { DIFFICULTY_LABELS } from "../lib/types";
import type { GameData } from "../lib/types";

interface Props {
  onGameCreated: (game: GameData) => void;
}

export default function SetupScreen({ onGameCreated }: Props) {
  const [teamName, setTeamName] = useState("");
  const [difficulty, setDifficulty] = useState(3);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setError("Please enter a team name");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const game = await createGame(teamName.trim(), difficulty);
      onGameCreated(game);
    } catch {
      setError("Failed to create game. Please try again.");
      setCreating(false);
    }
  };

  return (
    <div className="setup-screen">
      <form className="card setup-card" onSubmit={handleSubmit}>
        <div className="hero-icon">⚽</div>
        <h1>Football Manager</h1>
        <p className="subtitle">Build your dream club, sign players, and chase glory</p>

        <div className="form-group">
          <label className="form-label" htmlFor="teamName">Club Name</label>
          <input
            id="teamName"
            className="form-input"
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g. Riverside United"
            maxLength={30}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Difficulty Level</label>
          <div className="difficulty-grid">
            {Object.entries(DIFFICULTY_LABELS).map(([num, info]) => {
              const n = parseInt(num);
              return (
                <button
                  key={n}
                  type="button"
                  className={`difficulty-option ${difficulty === n ? "active" : ""}`}
                  onClick={() => setDifficulty(n)}
                >
                  <span className="diff-num">{n}</span>
                  <span className="diff-label">{info.label}</span>
                </button>
              );
            })}
          </div>
          <div className="budget-preview">
            <div className="budget-label">Starting Budget</div>
            <div className="budget-value">${DIFFICULTY_LABELS[difficulty].budget.toLocaleString()}</div>
          </div>
        </div>

        {error && (
          <p style={{ color: "var(--danger)", marginBottom: "16px", fontSize: "0.875rem" }}>{error}</p>
        )}

        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={creating}>
          {creating ? "Setting up your club..." : "Start New Game"}
        </button>
      </form>
    </div>
  );
}

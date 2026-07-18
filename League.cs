// League.cs
using System;
using System.Collections.Generic;
using System.Linq;

namespace MyBackendApp
{
    public class League
    {
        private readonly List<Team> teams;
        private readonly Dictionary<Team, int> points;
        private readonly Random random;

        public League(Team playerTeam, List<Team> aiTeams)
        {
            teams = new List<Team>();
            teams.Add(playerTeam);
            teams.AddRange(aiTeams);

            points = new Dictionary<Team, int>();
            random = new Random();

            foreach (var team in teams)
            {
                points[team] = 0;
            }
        }

        public void SimulateSeason()
        {
            Console.WriteLine("Simulating the season...");

            foreach (var team in teams)
            {
                points[team] = 0;
            }

            for (int i = 0; i < teams.Count; i++)
            {
                for (int j = i + 1; j < teams.Count; j++)
                {
                    PlayMatch(teams[i], teams[j]);
                    PlayMatch(teams[j], teams[i]);
                }
            }
            Console.WriteLine("Season simulation complete!");
        }

        private void PlayMatch(Team team1, Team team2)
        {
            double t1Strength = team1.Players.Count > 0 ? team1.Players.Average(p => p.Level) : 0;
            double t2Strength = team2.Players.Count > 0 ? team2.Players.Average(p => p.Level) : 0;

            double t1Performance = t1Strength + (random.NextDouble() * 2 - 1);
            double t2Performance = t2Strength + (random.NextDouble() * 2 - 1);

            if (t1Performance > t2Performance + 0.3)
            {
                points[team1] += 3;
            }
            else if (t2Performance > t1Performance + 0.3)
            {
                points[team2] += 3;
            }
            else
            {
                points[team1] += 1;
                points[team2] += 1;
            }
        }

        public void PrintStandings()
        {
            Console.WriteLine("\n============================================");
            Console.WriteLine("FINAL LEAGUE STANDINGS");
            Console.WriteLine("============================================");

            var sortedStandings = points.OrderByDescending(p => p.Value).ToList();

            for (int i = 0; i < sortedStandings.Count; i++)
            {
                Console.WriteLine($"{i + 1}. {sortedStandings[i].Key.Name.PadRight(20)} | {sortedStandings[i].Value} pts");
            }
            Console.WriteLine("============================================\n");
        }
    }
}
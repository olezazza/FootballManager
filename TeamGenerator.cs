
using System;
using System.Collections.Generic;

namespace MyBackendApp
{
    public class TeamGenerator
    {
        private readonly List<string> botTeamNames = [
            "London FC", "Madrid United", "Berlin Athletic", "Paris City", 
            "Rome Rovers", "Lisbon Sporting", "Amsterdam Albion", "Vienna Town", "Prague Rangers"
        ];
        
        public List<Team> GenerateLeagueTeams(int count)
        {
            List<Team> generatedTeams = new List<Team>();
            PlayerGenerator playerGenerator = new PlayerGenerator();
            Random random = new Random();

            for (int i = 0; i < count; i++)
            {
                string name = i < botTeamNames.Count ? botTeamNames[i] : $"Bot Team {i + 1}";
                Team newTeam = new Team(name, random.Next(1000000, 50000000));

                for (int j = 0; j < 20; j++)
                {
                    newTeam.Players.Add(playerGenerator.GeneratePlayer());
                }

                generatedTeams.Add(newTeam);
            }

            return generatedTeams;
        }
    }
}
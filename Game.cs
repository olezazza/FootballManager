// Game.cs
using System;
using System.Collections.Generic;
using System.Linq;

namespace MyBackendApp
{
    public class Game
    {
        private Team playerTeam;
        private League league;
        private readonly TransferMarket transferMarket;

        public Game()
        {
            transferMarket = new TransferMarket();
        }

        public void Run()
        {
            Console.WriteLine("Welcome to Football Manager");
            InitializeGame();
            Menu();
        }

        private void InitializeGame()
        {
            string teamName = InputValidator.GetStringInput("Enter team name: ");
            int difficulty = InputValidator.GetIntInput("Enter difficulty (1-5): ", 1, 5);
            int budget = GetBudgetFromDifficulty(difficulty);

            playerTeam = new Team(teamName, budget);
            Console.WriteLine($"Hello {teamName} FC, your budget is {budget}$");
            Console.WriteLine("--------------------------------------------------------");

            CreateSquad(playerTeam, 20);
            PrintSquad(playerTeam);
            
            Console.WriteLine("---------------------------------------------");
            double averageScore = playerTeam.Players.Average(p => p.Level);
            Console.WriteLine($"Average squad level is {averageScore:F2}");

            TeamGenerator teamGenerator = new TeamGenerator();
            List<Team> aiTeams = teamGenerator.GenerateLeagueTeams(9);
            league = new League(playerTeam, aiTeams);
        }

        private int GetBudgetFromDifficulty(int difficulty)
        {
            switch (difficulty)
            {
                case 1: return 100000000;
                case 2: return 10000000;
                case 3: return 1000000;
                case 4: return 100000;
                case 5: return 10000;
                default: return 1000000;
            }
        }

        private void CreateSquad(Team team, int squadSize)
        {
            PlayerGenerator playerGenerator = new PlayerGenerator();
            for (int i = 0; i < squadSize; i++)
            {
                team.Players.Add(playerGenerator.GeneratePlayer());
            }
        }

        private void Menu()
        {
            bool quit = false;

            while (!quit)
            {
                Console.WriteLine("--------------------------------------------");
                Console.WriteLine($"Budget: {playerTeam.Budget}$");
                Console.WriteLine("Menu:");
                Console.WriteLine("1. Transfer Market");
                Console.WriteLine("2. Your squad");
                Console.WriteLine("3. Simulate Season");
                Console.WriteLine("4. Quit");

                int menuChoice = InputValidator.GetIntInput("Your choice: ", 1, 4);

                switch (menuChoice)
                {
                    case 1:
                        HandleTransferMarket();
                        break;
                    case 2:
                        PrintSquad(playerTeam);
                        break;
                    case 3:
                        league.SimulateSeason();
                        league.PrintStandings();
                        break;
                    case 4:
                        quit = true;
                        break;
                }
            }
        }

        private void HandleTransferMarket()
        {
            Console.WriteLine("1. Buy");
            Console.WriteLine("2. Sell");
            Console.WriteLine("3. Back");
            
            int choice = InputValidator.GetIntInput("Your choice: ", 1, 3);

            switch (choice)
            {
                case 1:
                    BuyPlayer();
                    break;
                case 2:
                    SellPlayer();
                    break;
                case 3:
                    break;
            }
        }

        private void BuyPlayer()
        {
            List<Player> marketPlayers = transferMarket.CreateMarket(30);
            
            for (int i = 0; i < marketPlayers.Count; i++)
            {
                Console.WriteLine($"{i + 1}. {marketPlayers[i].Name} | Level - {marketPlayers[i].Level} | {marketPlayers[i].Price}$");
            }
            Console.WriteLine($"{marketPlayers.Count + 1}. Cancel");

            Console.WriteLine($"Your budget is {playerTeam.Budget}$");
            int buyChoice = InputValidator.GetIntInput("Which will you buy? ", 1, marketPlayers.Count + 1);

            if (buyChoice == marketPlayers.Count + 1)
            {
                return;
            }

            Player selectedPlayer = marketPlayers[buyChoice - 1];

            if (playerTeam.Budget < selectedPlayer.Price)
            {
                Console.WriteLine("Not enough money!!");
            }
            else
            {
                playerTeam.Budget -= selectedPlayer.Price;
                playerTeam.Players.Add(selectedPlayer);
                Console.WriteLine($"Player bought! New balance: {playerTeam.Budget}$");
            }
        }

        private void SellPlayer()
        {
            if (playerTeam.Players.Count == 0)
            {
                Console.WriteLine("No players in squad to sell.");
                return;
            }

            PrintSquad(playerTeam);
            Console.WriteLine($"{playerTeam.Players.Count + 1}. Cancel");

            Console.WriteLine($"Your budget is {playerTeam.Budget}$");
            int sellChoice = InputValidator.GetIntInput("Which will you sell? ", 1, playerTeam.Players.Count + 1);

            if (sellChoice == playerTeam.Players.Count + 1)
            {
                return;
            }

            Player selectedPlayer = playerTeam.Players[sellChoice - 1];
            playerTeam.Budget += selectedPlayer.Price;
            playerTeam.Players.Remove(selectedPlayer);
            Console.WriteLine($"Player sold! New balance: {playerTeam.Budget}$");
        }

        private void PrintSquad(Team team)
        {
            Console.WriteLine("-----------------------");
            Console.WriteLine("SQUAD: ");
            for (int i = 0; i < team.Players.Count; i++)
            {
                Console.WriteLine($"{i + 1}. {team.Players[i].Name} | Level - {team.Players[i].Level} | {team.Players[i].Price}$");
            }
            Console.WriteLine("-------------------------");
        }
    }
}
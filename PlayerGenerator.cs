
using System;
using System.Collections.Generic;

namespace MyBackendApp
{
    public class PlayerGenerator
    {
        private readonly List<string> firstNames = ["James", "Michael", "John", "Robert", "David", "William", "Richard", "Joseph", "Thomas", "Charles"];
        private readonly List<string> lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davies", "Rodriguez", "Martinez"];
        private readonly Random random = new Random();

        public Player GeneratePlayer()
        {
            string name = $"{firstNames[random.Next(firstNames.Count)]} {lastNames[random.Next(lastNames.Count)]}";
            int level = random.Next(1, 6);
            int price = GeneratePrice(level);
            
            return new Player(name, level, price);
        }

        private int GeneratePrice(int level)
        {
            switch (level)
            {
                case 1: return random.Next(1000, 2001);
                case 2: return random.Next(2000, 3501);
                case 3: return random.Next(3500, 5501);
                case 4: return random.Next(5500, 8001);
                case 5: return random.Next(8000, 12001);
                default: return 1000;
            }
        }
    }
}
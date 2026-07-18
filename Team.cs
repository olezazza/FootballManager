using System;

using System.Collections.Generic;

namespace MyBackendApp
{
    public class Team
    {
        public string Name { get; }
        public int Budget { get; set; }
        public List<Player> Players { get; }

        public Team(string name, int budget)
        {
            Name = name;
            Budget = budget;
            Players = new List<Player>();
        }
    }
}
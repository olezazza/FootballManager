using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;


namespace MyBackendApp
{
    public class Player
    {
        public string Name { get; }
        public int Level { get; }
        public int Price { get; }

        public Player(string name, int level, int price)
        {
            Name = name;
            Level = level;
            Price = price;
        }
    }
}
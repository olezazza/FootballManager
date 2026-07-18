
using System.Collections.Generic;

namespace MyBackendApp
{
    public class TransferMarket
    {
        public List<Player> CreateMarket(int size)
        {
            PlayerGenerator playerGenerator = new PlayerGenerator();
            List<Player> players = new List<Player>();

            for (int i = 0; i < size; i++)
            {
                players.Add(playerGenerator.GeneratePlayer());
            }

            return players;
        }
    }
}
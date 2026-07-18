
using System;

namespace MyBackendApp
{
    public static class InputValidator
    {
        public static int GetIntInput(string prompt, int min = int.MinValue, int max = int.MaxValue)
        {
            int result;
            while (true)
            {
                Console.Write(prompt);
                if (int.TryParse(Console.ReadLine(), out result) && result >= min && result <= max)
                {
                    return result;
                }
                Console.WriteLine("Invalid input.");
            }
        }

        public static string GetStringInput(string prompt)
        {
            string result;
            while (true)
            {
                Console.Write(prompt);
                result = Console.ReadLine()?.Trim() ?? string.Empty;
                if (!string.IsNullOrEmpty(result))
                {
                    return result;
                }
                Console.WriteLine("Invalid input.");
            }
        }
    }
}
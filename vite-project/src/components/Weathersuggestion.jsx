function WeatherSuggestions({ temp, condition, humidity, wind }) {
  let food = "";
  let song = "";
  let precaution = "";
  let activity = "";

  // Hot Weather
  if (temp >= 35) {
    food = "🍉 Watermelon, Lemonade, Coconut Water";
    song = "🎵 Summer Vibes Playlist";
    precaution = "🥤 Stay hydrated and avoid direct sunlight.";
    activity = "🏊 Swimming or indoor activities";
  }

  // Rainy Weather
  else if (
    condition.toLowerCase().includes("rain") ||
    condition.toLowerCase().includes("drizzle")
  ) {
    food = "☕ Tea, Coffee, Pakoras";
    song = "🎵 Rainy Mood Playlist";
    precaution = "☔ Carry an umbrella and wear waterproof footwear.";
    activity = "📚 Read a book or watch a movie";
  }

  // Cold Weather
  else if (temp <= 15) {
    food = "☕ Hot Chocolate, Soup";
    song = "🎵 Cozy Winter Playlist";
    precaution = "🧥 Wear warm clothes.";
    activity = "🔥 Indoor games or café visits";
  }

  // Pleasant Weather
  else {
    food = "🥗 Fresh Salad, Smoothies";
    song = "🎵 Feel Good Playlist";
    precaution = "😎 Enjoy the weather and stay active.";
    activity = "🚶 Evening walk or cycling";
  }

  return (
    <div className="ai-card">
      <h2>🤖 Weather Assistant</h2>

      <p><strong>🍽 Food:</strong> {food}</p>

      <p><strong>🎵 Song Mood:</strong> {song}</p>

      <p><strong>⚠ Precaution:</strong> {precaution}</p>

      <p><strong>🎯 Suggested Activity:</strong> {activity}</p>
    </div>
  );
}

export default WeatherSuggestions;
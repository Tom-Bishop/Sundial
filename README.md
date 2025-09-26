# Sundial Daily Word Wheel

Daily 9-letter word wheel puzzle: find up to 15 valid words (4-9 letters) that all include the center letter.

## Features
* Deterministic daily puzzle (same for all players, changes at local midnight)
* Clickable letter wheel with shuffle of outer letters
* Dark / light mode toggle
* Progress indicator (found / total)
* Hidden word list reveals as you solve (??? placeholders)
* Share button copies your progress snapshot
* Simple local leaderboard (localStorage)

## Rules
1. Words must be 4–9 letters.
2. Every word must include the center letter.
3. Only the 9 given letters may be used; each letter may be used at most as many times as it appears in the wheel (currently all unique).
4. Proper nouns, abbreviations and trivial plurals (simple trailing S) are rejected.

## Development Notes
`words_dictionary.json` supplies the raw word list (large file). Filtering and seeding are deterministic via a linear congruential shuffle.

## Potential Next Improvements
* Add keyboard navigation & focus ring styling.
* Animate discovery (flip a hidden tile when revealed).
* Server-backed leaderboard & daily seed syncing across time zones.
* Progressive Web App (offline caching) + Add To Home Screen.

## License
MIT (adjust if needed).

# Sounds

## Audio behavior

Browsers (especially iOS Safari and Home Screen web apps) block unmuted audio until a tap. **Tap "Tap to load game."** on the black start screen to unlock sound and start the opening track. **Tap "Tap to play."** on the title screen to begin the intro.

Correct answers play a ding; wrong answers play a buzzer (file-based). Keypad taps play a click. Short effects play through the Web Audio API so iPhone can overlap them instead of cutting the previous clip.

## Start & game over soundtrack

**`Hero Immortal.mp3`** is used on the opening screen and on the game over screen.

- **Opening:** The track does not autoplay. **Tap to load game.** starts **`Hero Immortal.mp3`**. **Tap to play.** fades it out while the title fades and the astronaut climbs into the rocket.
- **Game over:** The same file plays (looped) when the game over screen appears and stops when the player clicks "Play Again".

Place **`Hero Immortal.mp3`** in this `sounds/` folder. If it is missing, those screens are simply silent.

## Rocket countdown

**`3 2 1 go_noise-removal_equalized_lower.mp3`** plays during the 3-2-1-GO countdown after the astronaut climb.

Optional engine bed: add **`rocket.mp3`** in this folder. The game fades it in over the first ~0.3 s and out over the last ~0.5 s, then stops it before the launch clip so iOS can play blast-off audio.

If these files are missing, the game still runs; the countdown is simply silent or uses whatever clips are present.

## Blast-off

**`rocket_launch.wav`** plays when the rocket leaves the pad after "GO!".

## Level complete

When the player reaches a planet, the "Great job! Advance to next planet!" screen plays **`newthingget.mp3`**.

If `newthingget.mp3` is missing, the level-complete screen is silent.

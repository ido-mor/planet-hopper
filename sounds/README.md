# Sounds

## Audio behavior

Browsers (especially iOS Safari and Home Screen web apps) block unmuted audio until a tap. **Click or tap "Click to play"** on the intro screen to unlock sound. On some desktop browsers the opening track may start on its own; the same tap still starts the game.

Correct answers play a ding; wrong answers play a buzzer (file-based). Keypad taps play a click.

## Start & game over soundtrack

**`Hero Immortal.mp3`** is used on the opening screen and on the game over screen.

- **Opening:** The page autoplays **`Hero Immortal.mp3`** on the title screen. One **"Click to play"** tap fades the title and starts the intro; the soundtrack fades during the astronaut climb. If a browser blocks autoplay, that same tap starts the music (it will play during the climb). There is no second "Click to begin" step.
- **Game over:** The same file plays (looped) when the game over screen appears and stops when the player clicks "Play Again".

Place **`Hero Immortal.mp3`** in this `sounds/` folder. If it is missing, those screens are simply silent.

## Rocket countdown

**`3 2 1 go_noise-removal_equalized_lower.wav`** plays during the 3-2-1-GO countdown.

Optional engine bed: add **`rocket.mp3`** in this folder. The game fades it in over the first ~0.3 s and out over the last ~0.5 s, then stops it before the launch clip so iOS can play blast-off audio.

If these files are missing, the game still runs; the countdown is simply silent or uses whatever clips are present.

## Blast-off

**`rocket_launch.wav`** plays when the rocket leaves the pad after "GO!". It is primed on the Click to play tap so it can start a few seconds later on iOS.

## Level complete

When the player reaches a planet, the "Great job! Advance to next planet!" screen plays **`newthingget.ogg`**.

If `newthingget.ogg` is missing, the level-complete screen is silent.

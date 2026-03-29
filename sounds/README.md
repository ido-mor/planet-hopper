# Sounds

## Audio behavior

The game unlocks audio after a user gesture. **Click or tap "Click to start"** on the intro screen so that the rocket countdown and answer sounds can play. Correct answers play a ding; wrong answers play a buzzer (these are synthesized—no extra files needed).

## Start & game over soundtrack

**`Hero Immortal.mp3`** is used on the opening screen and on the game over screen. Browsers block audio until the user interacts with the page, so the flow is:

- **Opening:** First click or tap unlocks sound and starts the track (the prompt changes to "Click to begin"). Second click fades out the music and starts the game.
- **Game over:** The same file plays (looped) when the game over screen appears and stops when the player clicks "Play Again".

Place **`Hero Immortal.mp3`** in this `sounds/` folder. If it is missing, those screens are simply silent.

## Rocket countdown (optional)

To hear the rocket sound during the 3-second countdown, add an MP3 file named:

**`rocket.mp3`**

Place it in this `sounds/` folder. Any short rocket or engine clip (around 3 seconds or loopable) will work. The game fades the volume in over the first ~0.3 s and out over the last ~0.5 s.

If `rocket.mp3` is missing, the game still runs; the countdown is simply silent.

## Level complete

When the player reaches a planet, the "Great job! Advance to next planet!" screen plays **`newthingget.ogg`**

Place it in this `sounds/` folder. Sound’s “Party Blower Sad, Out Of Tune 01”](https://www.epidemicsound.com/sound-effects/tracks/23707b68-bda9-4b2b-8a97-58c49feb7d87/) if you have a license—download it and save as `level-complete.mp3` here.

If `newthingget.ogg` is missing, the level-complete screen is silent.

#!/bin/bash
DIR="public/assets/wedding"
mkdir -p "$DIR/characters"
mkdir -p "$DIR/backgrounds"
mkdir -p "$DIR/events"

# Extract backgrounds
/opt/homebrew/bin/ffmpeg -y -i "$DIR/sample_red.jpg" -vf "scale=1080:1920:flags=lanczos" "$DIR/backgrounds/theme_red.jpg"
/opt/homebrew/bin/ffmpeg -y -i "$DIR/sample_gold.jpg" -vf "scale=1080:1920:flags=lanczos" "$DIR/backgrounds/theme_gold.jpg"
/opt/homebrew/bin/ffmpeg -y -i "$DIR/sample_navy_groom.jpg" -vf "scale=1080:1920:flags=lanczos" "$DIR/backgrounds/theme_navy.jpg"
/opt/homebrew/bin/ffmpeg -y -i "$DIR/sample_pink_kiss.jpg" -vf "scale=1080:1920:flags=lanczos" "$DIR/backgrounds/theme_pink.jpg"
/opt/homebrew/bin/ffmpeg -y -i "$DIR/sample_dongphong.jpg" -vf "scale=1080:1920:flags=lanczos" "$DIR/events/dongphong.jpg"

echo "Backgrounds extracted."

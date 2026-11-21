#!/bin/sh
# A contact sheet of a tour's shots, for checking them by eye: capture/contact.sh <tour> [out.png]
set -e
dir="tours/$1/shots"; out="${2:-tmp/contact-$1.png}"
n=$(ls "$dir"/*.png | wc -l | tr -d ' ')
cols=3; rows=$(( (n + cols - 1) / cols ))
ffmpeg -loglevel error -y -pattern_type glob -i "$dir/*.png" -vf "scale=960:-1,tile=${cols}x${rows}:padding=8:color=white" -frames:v 1 "$out"
ls "$dir"

#!/bin/bash

# Generate iOS icon sizes from the base icon-192.png
# This script requires ImageMagick (install with: apt install imagemagick)

BASE_ICON="public/icon-192.png"

if [ ! -f "$BASE_ICON" ]; then
    echo "Error: Base icon $BASE_ICON not found"
    echo "Creating placeholder icons instead..."
    
    # Create placeholder icons if base icon doesn't exist
    # These are simple colored squares as placeholders
    for size in 120 152 167 180 512; do
        echo "Creating placeholder icon-${size}.png"
        # Create a simple blue square as placeholder
        convert -size ${size}x${size} xc:'#3b82f6' public/icon-${size}.png 2>/dev/null || \
        echo "Note: ImageMagick not installed. Please create icon-${size}.png manually"
    done
    exit 0
fi

echo "Generating iOS icon sizes from $BASE_ICON"

# iOS icon sizes
sizes=(120 152 167 180 512)

for size in "${sizes[@]}"; do
    output="public/icon-${size}.png"
    echo "Creating $output (${size}x${size})"
    convert "$BASE_ICON" -resize ${size}x${size} "$output" 2>/dev/null || \
    echo "Note: ImageMagick not installed. Please create $output manually"
done

echo "Icon generation complete!"
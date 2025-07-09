#!/bin/bash

# Define the target IP to compare against
SAVED_IP="0.0.0.0" # CHANGE TO YOUR LOCAL IP

# Get the current local IP
LOCAL_IP=$(ipconfig getifaddr en0)

# Define the file to update
FILE_PATH="../ui-frontend/public/js/changeImgUrl.js"

SCRIPT_PATH="$0"

# Check if the IPs are the same
# Check if the local IP matches the saved IP
if [ "$LOCAL_IP" = "$SAVED_IP" ]; then
    echo "IP address is the same. No update needed."
else


    # Use sed to replace the IP in the specified line in the file
    sed -i "" "s|var private_ip = '$SAVED_IP';|var private_ip = '$LOCAL_IP';|" "$FILE_PATH"
    sed -i "" "s|SAVED_IP=\"$SAVED_IP\"|SAVED_IP=\"$LOCAL_IP\"|" "$SCRIPT_PATH"

    echo "Updated IP in $FILE_PATH to $LOCAL_IP."
fi
#!/bin/sh
# sh elevendl.sh <itemDir> <lang> <session>/<generation> <X-Goog-Date> <X-Goog-Signature>  → <itemDir>/audio/<lang>.mp3
B="https://storage.googleapis.com/xi-backend/database/workspace/05840d92492443ad9c80c6f9afbd8e01/content_generation"
Q="X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=xi-backend-prod%40xi-labs.iam.gserviceaccount.com%2F20261025%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Expires=7200&X-Goog-SignedHeaders=host"
mkdir -p "$1/audio" && curl -sf -o "$1/audio/$2.mp3" "$B/$3/content.mp3?$Q&X-Goog-Date=$4&X-Goog-Signature=$5" && echo "$1 $2 $(stat -c%s "$1/audio/$2.mp3")" || echo "$1 $2 FAIL"

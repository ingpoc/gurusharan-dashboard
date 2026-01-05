#!/bin/bash
# Intent detection - output simple skill instructions.
# Stays quiet for questions, chat.

set -e

# Get user prompt
USER_PROMPT="${PROMPT:-}"
if [ -z "$USER_PROMPT" ] && [ -p /dev/stdin ]; then
    USER_PROMPT=$(cat)
fi
[ -z "$USER_PROMPT" ] && exit 0

# Intent detection
PROMPT_LOWER=$(echo "$USER_PROMPT" | tr '[:upper:]' '[:lower:]')

# Question patterns - stay quiet
QUESTION_PATTERNS="^(what|how|why|when|where|who|which|can you|could you|would you|explain|describe|tell me)"
if echo "$PROMPT_LOWER" | grep -qE "$QUESTION_PATTERNS"; then
    exit 0
fi

# Slash command - stay quiet
if [[ "$USER_PROMPT" == /* ]]; then
    exit 0
fi

# Action detection - output skill instruction
if echo "$PROMPT_LOWER" | grep -qi "implement\|add feature\|create\|build\|develop\|feature"; then
    echo "Execute: /implementation skill"
elif echo "$PROMPT_LOWER" | grep -qi "test\|verify\|validate"; then
    echo "Execute: /testing skill"
elif echo "$PROMPT_LOWER" | grep -qi "setup\|initialize\|init"; then
    echo "Execute: /initialization skill"
elif echo "$PROMPT_LOWER" | grep -qi "browser\|ui test\|click"; then
    echo "Execute: /browser-testing skill"
else
    exit 0
fi

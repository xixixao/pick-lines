#!/bin/bash

if [ "$1" = "--help" ] || [ "$1" = "help" ]; then
  echo "pick-lines [OPTIONS]"
  echo ""
  echo "select lines with keyboard from standard input"
  echo ""
  echo "    Use up and down arrow keys to select previous and next line"
  echo "    respectively. Hit Enter to mark the line as included. Hit"
  echo "    CTRL-Z or Y to write the selected lines and exit."
  echo "    Hit Q, CTRL-C or Esc to exit without returning any data."
  echo ""
  echo "    Note that underlying is not preserved, rest of ANSI formatting is."
  echo ""
  echo "    For example:"
  echo ""
  echo "        cat lines.txt | pick-lines | filtered.txt"
  echo ""
  echo "    lets the user select lines from lines.txt to be written to"
  echo "    filtered.txt."
  echo ""
  echo "OPTIONS can be any of:"
  echo " --help     shows this help listing"
  exit
fi

# Get path to our node module
SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
  DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done
DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"

INPUT=".___pick-lines-in"
OUTPUT=".___pick-lines-out"

# Use files to interact with Node script
cat - > $INPUT &&

# Actual interactive editing, make sure it works inside of a pipe
>/dev/tty tput smcup && stty -echo </dev/tty && # enter fullscreen
>/dev/tty node "$DIR/index.js" $INPUT $OUTPUT  </dev/tty  &&
>/dev/tty tput rmcup && stty echo </dev/tty && # leave fullscreen

rm $INPUT &&
[[ -e $OUTPUT ]] &&
cat $OUTPUT &&
rm $OUTPUT

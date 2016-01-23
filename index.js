var child_process = require('child_process');
var fs = require('fs');
var os = require('os');
var readline = require('readline');

var keypress = require('keypress');

var eol = require('os').EOL;
var exec = child_process.exec;

var inputFile = process.argv[2];
var outputFile = process.argv[3];

var output;
var cursorLine;
var takeOuts = {};
var trailingNewLine;

fs.readFile(inputFile, {encoding: 'utf8'}, function(error, data) {
  output = data
    // remove underlines
    .replace(/\033\[((?:\d{1,3};)*)4((?:;\d{1,3}))*m/g, function(_, b, a) {
      var before = b || '';
      var after = a || '';
      return '\033[' +
        before.slice(0, before.length - 1) + after.slice(1) + 'm';
    })
    .split('\n');

  trailingNewLine = output[output.length - 1] === '';
  if (trailingNewLine) {
    output.pop();
  }
  cursorLine = 0;
  render();
});

function render() {
  var toRender = output
    .map(function (line, index) {
      var hoverCircle = line === ''
        ? '→'
        : ' ';
      var prefix = takeOuts[index]
        ? '✓'
        : ' ';
      return prefix + (index === cursorLine
        ? hoverCircle + line
          // Add underline at beginning if no color is used
          .replace(/^([^\033])/, '\033[4m$1')
          // Add underline to every color code
          .replace(/\033\[([\d;]+)m/g, '\033[$1;4m')
        : ' ' + line);
    });

  var numLinesToRender = process.stdout.rows;
  var numCharsToRender = process.stdout.columns;
  var to = Math.max(numLinesToRender, cursorLine + 1);
  process.stdout.write(
    '\033[2J' +
    '\033[0f' +
    '\033[0m' +

    toRender
      .slice(to - numLinesToRender, to - 1)
      .map(function (line) {return line.slice(0, numCharsToRender);})
      .join('\033[0m' + eol) +
    eol // ensure last line is empty
  );
}

// make `process.stdin` begin emitting "keypress" events
keypress(process.stdin);

// listen for the "keypress" event
process.stdin.on('keypress', function (ch, key) {
  if (!key) {
    return;
  }

  switch (key.name) {
    case 'up':
      updateLine(-1);
      break;
    case 'down':
      updateLine(1);
      break;
    case 'return':
    case 'enter':
      toggle();
      break;
    case 'y':
    case 'z':
      pick();
      break;
  }
  if (key.ctrl && key.name == 'c'
      || key.name == 'q'
      || key.name == 'escape') {
    process.stdin.pause();
  }
});

process.stdin.setRawMode(true);
process.stdin.resume();

function updateLine(direction) {
  cursorLine = Math.max(0, Math.min(cursorLine + direction, output.length - 1));
  render();
}

function toggle() {
  takeOuts[cursorLine] = !takeOuts[cursorLine];
  render();
}

function pick() {
  process.stdin.pause();
  fs.writeFileSync(outputFile, output.filter(function (line, index) {
    return takeOuts[index];
  }).join(eol) + (trailingNewLine ? '\n' : ''));
}

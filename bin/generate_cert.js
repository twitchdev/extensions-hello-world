// Valiate the command line.
if(process.argv.length < 3) {
  console.log(`usage: node ${process.argv[1]} file_root`);
  process.exit(2);
}

// Spawn the process for the platform.
const { spawn } = require('child_process');
const cmd = process.platform === 'darwin' ?
  spawn('bin/generate_cert.sh', [process.argv[2]]) :
  spawn('cmd.exe', ['/c', 'bin\\generate_cert.cmd', process.argv[2]]);
let output = '';

// Handle process activity.
cmd.stdout.on('data', (data) => {
  output += data.toString();
});
cmd.stderr.on('data', (data) => {
  output += data.toString();
});
cmd.on('exit', (code) => {
  console.log(output);
  if(code) {
    process.exit(code);
  }
});

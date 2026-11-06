#!/usr/bin/env node
// One command: analyse a song, then render a reel.
//   npm run reel -- path/to/song.mp3 [--style HypeDrop|LyricVideo|Glitch|all] [analyzer options]
// Analyzer options: --start 45 --duration 30 --title "Name" --artist "Me" --lyrics
import {spawnSync} from 'node:child_process';
import {basename, extname} from 'node:path';
import {mkdirSync} from 'node:fs';

const args = process.argv.slice(2);
if (!args.length || args[0].startsWith('-')) {
  console.error('usage: npm run reel -- song.mp3 [--style HypeDrop|LyricVideo|Glitch|all] [--start s] [--duration s] [--title t] [--artist a] [--lyrics]');
  process.exit(1);
}
let style = 'HypeDrop';
const si = args.indexOf('--style');
if (si !== -1) { style = args[si + 1]; args.splice(si, 2); }
const extra = [];
const bi = args.indexOf('--browser-executable');
if (bi !== -1) { extra.push(`--browser-executable=${args[bi + 1]}`); args.splice(bi, 2); }

const audio = args[0];
const name = basename(audio, extname(audio));
const py = process.platform === 'win32' ? 'python' : 'python3';
const run = (cmd, a) => {
  const r = spawnSync(cmd, a, {stdio: 'inherit', shell: process.platform === 'win32'});
  if (r.status !== 0) process.exit(r.status ?? 1);
};

run(py, ['analysis/analyze.py', ...args]);
mkdirSync('out', {recursive: true});
const styles = style === 'all' ? ['HypeDrop', 'LyricVideo', 'Glitch'] : [style];
for (const s of styles) {
  run('npx', ['remotion', 'render', s, `out/${name}-${s}.mp4`, `--props=public/songs/${name}.json`, ...extra]);
  console.log(`✓ out/${name}-${s}.mp4`);
}

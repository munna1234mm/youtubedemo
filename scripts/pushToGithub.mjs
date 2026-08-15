import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs';
import path from 'path';

const dir = process.cwd();
const remoteUrl = process.argv[2] || 'https://github.com/munna1234mm/youtubedemo.git';
const token = process.env.GITHUB_TOKEN || process.argv[3];

async function main() {
  console.log('Initializing git repository...');
  await git.init({ fs, dir });

  console.log('Adding files to git staging...');
  // Recursively add all tracked files except gitignored
  async function addDir(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === '.system_generated') {
        continue;
      }
      const fullPath = path.join(currentDir, entry.name);
      const relPath = path.relative(dir, fullPath).replace(/\\/g, '/');
      if (entry.isDirectory()) {
        await addDir(fullPath);
      } else {
        await git.add({ fs, dir, filepath: relPath });
      }
    }
  }

  await addDir(dir);

  console.log('Committing changes...');
  try {
    const sha = await git.commit({
      fs,
      dir,
      message: 'Initial commit: TeleBook - Telegram Social Mini App Full-Stack',
      author: {
        name: 'Developer Munna',
        email: 'developermunna@telebook.app',
      },
    });
    console.log('Committed with SHA:', sha);
  } catch (err) {
    console.log('Commit note:', err.message);
  }

  console.log('Ensuring branch main...');
  try {
    await git.branch({ fs, dir, ref: 'main', checkout: true });
  } catch (e) {
    console.log('Branch note:', e.message);
  }

  console.log(`Setting remote to ${remoteUrl}...`);
  try {
    await git.removeRemote({ fs, dir, remote: 'origin' });
  } catch {}
  await git.addRemote({ fs, dir, remote: 'origin', url: remoteUrl });

  console.log('Pushing to GitHub (main branch)...');
  const pushResult = await git.push({
    fs,
    http,
    dir,
    remote: 'origin',
    ref: 'main',
    force: true,
    onAuth: () => {
      if (token) {
        return { username: token, password: '' };
      }
      return undefined;
    },
  });

  console.log('Push successful:', pushResult);
}

main().catch((err) => {
  console.error('Push failed:', err.message);
  process.exit(1);
});

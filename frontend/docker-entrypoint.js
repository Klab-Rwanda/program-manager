#!/usr/bin/env node

const { spawn } = require('node:child_process')
const env = { ...process.env }

;(async () => {
  // No more rebuilding at runtime; image already contains the build
  await exec(process.argv.slice(2).join(' '))
})().catch(err => {
  console.error(err)
  process.exit(1)
})

function exec(command) {
  const child = spawn(command, { shell: true, stdio: 'inherit', env })
  return new Promise((resolve, reject) => {
    child.on('exit', code => (code === 0 ? resolve() : reject(new Error(`${command} failed rc=${code}`))))
  })
}

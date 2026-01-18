#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function fail(msg){
  console.error('[validate] ' + msg);
  process.exit(1);
}

function checkLessons(){
  const p = path.join(__dirname, '..', 'data', 'lessons.json');
  const raw = fs.readFileSync(p, 'utf8');
  let data;
  try { data = JSON.parse(raw); } catch(e){ fail('data/lessons.json is not valid JSON'); }
  if (typeof data.version !== 'number') fail('lessons.json: missing numeric version');
  if (!Array.isArray(data.lessons)) fail('lessons.json: lessons must be an array');
  for (const l of data.lessons){
    if (typeof l.id !== 'string') fail('lesson missing id');
    if (typeof l.number !== 'number') fail(`lesson ${l.id} missing number`);
    if (typeof l.title !== 'string') fail(`lesson ${l.id} missing title`);
    if (typeof l.minutes !== 'number') fail(`lesson ${l.id} missing minutes`);
    if (!Array.isArray(l.tags)) fail(`lesson ${l.id} missing tags array`);
  }
}

function checkLinks(){
  const projectRoot = path.join(__dirname, '..');
  const files = [
    { path: path.join(projectRoot, 'index.html'), dir: projectRoot },
    { path: path.join(projectRoot, 'parents.html'), dir: projectRoot },
    { path: path.join(projectRoot, 'lessons', 'index.html'), dir: path.join(projectRoot, 'lessons') },
    { path: path.join(projectRoot, 'lessons', 'lesson.html'), dir: path.join(projectRoot, 'lessons') },
  ];
  
  const checked = new Set();
  
  for (const file of files){
    if (!fs.existsSync(file.path)) {
      console.warn(`[validate] Skipping missing file: ${path.relative(projectRoot, file.path)}`);
      continue;
    }
    
    const html = fs.readFileSync(file.path, 'utf8');
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
    
    for (const href of hrefs){
      // Ignore external links and fragments
      if (/^(https?:|mailto:|sms:|#)/i.test(href)) continue;
      
      // Ignore query strings and fragments for existence check
      const cleanHref = href.split('?')[0].split('#')[0];
      if (!cleanHref) continue;
      
      // Resolve relative to the HTML file's directory
      const resolved = path.resolve(file.dir, cleanHref);
      const relativeToProject = path.relative(projectRoot, resolved);
      
      // Skip if already checked
      if (checked.has(relativeToProject)) continue;
      checked.add(relativeToProject);
      
      // Check if file exists
      if (!fs.existsSync(resolved)) {
        fail(`Broken link in ${path.relative(projectRoot, file.path)}: "${href}" -> ${relativeToProject}`);
      }
    }
  }
  
  console.log(`[validate] Checked ${checked.size} unique links`);
}

function main(){
  checkLessons();
  checkLinks();
  console.log('[validate] OK');
}

main();

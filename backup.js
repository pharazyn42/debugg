// Save backup: everything Debugg keeps is in this browser's storage, so clearing site data (or
// Safari's clean-up of sites you haven't visited for a while) would lose it. The backup window
// turns all of it (puzzle progress, XP, streak, the company, sandbox drafts) into one code the
// player can keep somewhere safe, and restores it on any device.
//
// The code is "DEBUGG1." followed by the saved values as base64 (URL-safe) JSON.
window.DebuggBackup = (function(){
  const PREFIX = 'DEBUGG1.';

  function isOurs(key){ return key.startsWith('debugg-'); }

  function toBase64(text){
    const bytes = new TextEncoder().encode(text);
    let bin = '';
    bytes.forEach(b => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function fromBase64(code){
    const b64 = code.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64 + '='.repeat((4 - b64.length % 4) % 4));
    return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
  }

  function makeCode(){
    const data = {};
    Object.keys(localStorage).filter(isOurs).forEach(k => { data[k] = localStorage.getItem(k); });
    return PREFIX + toBase64(JSON.stringify(data));
  }

  // Returns the saved values in a code, or throws with a message the player can read.
  function readCode(code){
    const trimmed = (code || '').replace(/\s+/g, '');
    if(!trimmed.startsWith(PREFIX)) throw new Error('That doesn’t look like a Debugg backup code. It should start with ' + PREFIX);
    let data;
    try{ data = JSON.parse(fromBase64(trimmed.slice(PREFIX.length))); }
    catch(e){ throw new Error('That backup code is incomplete or damaged. Check it was copied in full.'); }
    if(!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('That backup code is damaged.');
    Object.keys(data).forEach(k => {
      if(!isOurs(k) || typeof data[k] !== 'string') throw new Error('That backup code is damaged.');
    });
    // Progress from a version that's been reset (the demo, once v0.1 is out) stays reset.
    if(window.Debugg.isWipedVersion(data['debugg-version'])){
      throw new Error('That backup is from the Debugg demo. Demo progress was reset when v0.1 came out, so it can’t be restored.');
    }
    return data;
  }

  // Replaces everything Debugg has saved in this browser with the backup, then reloads.
  function restore(data){
    if(window.DebuggLtd && window.DebuggLtd.stop) window.DebuggLtd.stop();
    Object.keys(localStorage).filter(isOurs).forEach(k => localStorage.removeItem(k));
    Object.keys(data).forEach(k => localStorage.setItem(k, data[k]));
    location.reload();
  }

  function track(path){
    if(window.DebuggAnalytics) window.DebuggAnalytics.event(path);
  }

  let dialog = null;
  function build(){
    dialog = document.createElement('dialog');
    dialog.className = 'backup';
    dialog.setAttribute('aria-labelledby', 'backupTitle');
    dialog.innerHTML =
      '<h2 id="backupTitle">Back up your progress</h2>' +
      '<p>Debugg saves everything in this browser only. Clearing your browsing data, or not visiting for a while in Safari, can erase it. ' +
      'Keep this code somewhere safe (a note or an email to yourself), and paste it here on any device to get everything back: ' +
      'your puzzles, XP, streak and company.</p>' +
      '<label for="backupCode">Your backup code</label>' +
      '<textarea id="backupCode" readonly rows="4" spellcheck="false"></textarea>' +
      '<div class="backup-actions"><button class="btn-primary" id="backupCopy" type="button">Copy code</button>' +
      '<span class="backup-note" id="backupCopied" role="status"></span></div>' +
      '<label for="restoreCode">Restore from a code</label>' +
      '<textarea id="restoreCode" rows="3" spellcheck="false" placeholder="Paste a backup code"></textarea>' +
      '<p class="backup-error" id="restoreError" role="alert"></p>' +
      '<div class="backup-actions"><button class="btn-ghost" id="restoreBtn" type="button">Restore</button>' +
      '<button class="btn-ghost" id="backupClose" type="button">Close</button></div>';
    document.body.appendChild(dialog);

    const $ = id => dialog.querySelector('#' + id);
    $('backupCopy').addEventListener('click', async () => {
      const box = $('backupCode');
      box.select();
      let ok = false;
      try{ await navigator.clipboard.writeText(box.value); ok = true; }
      catch(e){ ok = document.execCommand && document.execCommand('copy'); }
      $('backupCopied').textContent = ok ? 'Copied.' : 'Select the code and copy it.';
      track('backup/copied');
    });
    $('restoreBtn').addEventListener('click', () => {
      $('restoreError').textContent = '';
      let data;
      try{ data = readCode($('restoreCode').value); }
      catch(e){ $('restoreError').textContent = e.message; return; }
      if(!confirm('Restore this backup? It replaces all Debugg progress in this browser, including any company.')) return;
      track('backup/restored');
      restore(data);
    });
    $('backupClose').addEventListener('click', () => dialog.close());
  }

  function open(){
    if(!dialog) build();
    dialog.querySelector('#backupCode').value = makeCode();
    dialog.querySelector('#backupCopied').textContent = '';
    dialog.querySelector('#restoreError').textContent = '';
    dialog.querySelector('#restoreCode').value = '';
    dialog.showModal();
    track('backup/opened');
  }

  return { open, makeCode, readCode };
})();

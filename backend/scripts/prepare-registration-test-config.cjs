// Local test setup only. Never prints private key values or enables production.
const fs=require('node:fs'),path=require('node:path'),{randomBytes}=require('node:crypto'),{spawnSync}=require('node:child_process');
const backend=path.resolve(__dirname,'..'),target=path.join(backend,'.env');
const ignored=spawnSync('git',['check-ignore','--quiet','backend/.env'],{cwd:path.resolve(backend,'..')});
if(ignored.status!==0)throw new Error('backend/.env must be ignored by git before generating secrets.');
if(!fs.existsSync(target))throw new Error('Create backend/.env from the existing setup first.');
let source=fs.readFileSync(target,'utf8');
function current(name){const line=source.split(/\r?\n/).find(v=>v.startsWith(name+'='));return line?line.slice(name.length+1).trim():'';}
function setMissing(name,value){if(current(name))return;const line=name+'='+value;if(source.split(/\r?\n/).some(v=>v.startsWith(name+'=')))source=source.replace(new RegExp('^'+name+'=.*$','m'),()=>line);else source+='\n'+line;}
const existing=['AUTOGUARDIAN_SEAL_ORIGIN','AUTOGUARDIAN_SEAL_ACTIVE_KEY','AUTOGUARDIAN_SEAL_KEYS_JSON'].map(current);
if(existing.some(Boolean)&&!existing.every(Boolean))throw new Error('Existing seal signing setup is partial. Preserve it and complete all three settings together.');
setMissing('PRODUCTION_OWNER_KEY_HEX',randomBytes(32).toString('hex'));
setMissing('PRODUCTION_EVIDENCE_KEY_HEX',randomBytes(32).toString('hex'));
setMissing('PRODUCTION_EVIDENCE_BUCKET','registration-enrollment-evidence');
if(!existing.some(Boolean)){
  source+='\n# TEST ONLY: reserved placeholder origin; replace before production.\n';
  setMissing('AUTOGUARDIAN_SEAL_ORIGIN','https://seals.autoguardian.invalid');
  setMissing('AUTOGUARDIAN_SEAL_ACTIVE_KEY','test-v1');
  setMissing('AUTOGUARDIAN_SEAL_KEYS_JSON',JSON.stringify({'test-v1':randomBytes(32).toString('hex')}));
}
fs.writeFileSync(target,source.endsWith('\n')?source:source+'\n',{mode:0o600});
console.log('Local registration test keys prepared in ignored backend/.env. Existing values preserved; no production switch or consent changed.');

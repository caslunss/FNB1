const assert=require('node:assert/strict');
(async()=>{
 const {APP_VERSION,APP_RELEASE_DATE}=await import('../src/version.ts');
 const {RELEASE_NOTES}=await import('../src/release-notes.ts');
 const {settingsScreen,SETTINGS_TITLES}=await import('../src/services/settings-navigation.ts');
 assert.equal(RELEASE_NOTES[0].version,APP_VERSION,'A version bump requires current release notes');
 assert.equal(RELEASE_NOTES[0].date,APP_RELEASE_DATE,'Release date must match the version source');
 const versions=new Set();
 for(const release of RELEASE_NOTES){assert(!versions.has(release.version),'Duplicate release');versions.add(release.version);assert.match(release.date,/^\d{4}-\d{2}-\d{2}$/);assert(release.changes.length>0);assert(release.changes.every(change=>change.trim().length>0));}
 assert.equal(settingsScreen('releases',true),'releases');assert.equal(settingsScreen('releases',false),'releases');assert.equal(SETTINGS_TITLES.releases,'Novidades da versão');
 console.log('PASS release notes: current version/date, unique history, nonempty changes and visitor/account access');
})().catch(error=>{console.error(error);process.exitCode=1});

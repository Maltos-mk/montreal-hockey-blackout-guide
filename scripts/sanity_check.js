const fs = require('fs');

const teams = [
  'data/mtl.json',
  'data/tor.json',
  'data/ott.json',
  'data/van.json',
  'data/cgy.json',
  'data/edm.json',
  'data/wpg.json'
];

let allPassed = true;

teams.forEach(file => {
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  const teamId = data.team.id;
  const schedule = data.schedule;
  
  if (schedule.length < 80 || schedule.length > 84) {
    console.error(`❌ [${teamId}] ERROR: Invalid schedule length: ${schedule.length}`);
    allPassed = false;
  }

  const natEN = schedule.filter(g => g.typeEN === 'national');
  const regEN = schedule.filter(g => g.typeEN === 'regional');

  if (natEN.length > 65) {
    console.error(`❌ [${teamId}] ERROR: Too many English National games (${natEN.length}). Logic is likely classifying regional broadcasts as national.`);
    allPassed = false;
  }
  
  if (regEN.length < 15) {
    console.error(`❌ [${teamId}] ERROR: Too few English Regional games (${regEN.length}).`);
    allPassed = false;
  }
  
  // Verify that any game with SNW, SNP, SNE, SNO as its ONLY network is NOT national
  schedule.forEach(g => {
    if (g.typeEN === 'national') {
      const isExclusivelyRegional = (g.netEN === 'Sportsnet West' || g.netEN === 'Sportsnet Pacific' || g.netEN === 'Sportsnet Ontario' || g.netEN === 'Sportsnet East');
      if (isExclusivelyRegional) {
        console.error(`❌ [${teamId}] ERROR: Game ${g.id} on ${g.date} is marked as English National, but only has a single regional network: ${g.netEN}`);
        allPassed = false;
      }
    }
  });

  console.log(`✅ [${teamId}] Passed: ${natEN.length} National (EN), ${regEN.length} Regional (EN)`);
});

if (allPassed) {
  console.log('\n✅ ALL DATA ASSERTIONS PASSED.');
} else {
  console.log('\n❌ DATA INTEGRITY ERRORS DETECTED.');
  process.exit(1);
}

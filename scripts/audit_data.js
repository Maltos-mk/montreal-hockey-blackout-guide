const fs = require('fs');
const path = require('path');
const { runFullDataAudit, formatAuditMarkdown } = require('./lib/data_audit_core');

const ROOT_DIR = path.join(__dirname, '..');

function main() {
  const writeTable = process.argv.includes('--write-table');
  const audit = runFullDataAudit({ rootDir: ROOT_DIR });

  if (writeTable) {
    const outPath = path.join(ROOT_DIR, 'audit_summary.md');
    fs.writeFileSync(outPath, formatAuditMarkdown(audit), 'utf-8');
    console.log(`📋 Wrote incoming data audit summary to ${outPath}`);
  }

  console.log(
    `🔍 Data Audit: US ${audit.usResults.length} teams, CA ${audit.caResults.length} teams, ${audit.zipAudit.totalCoveredPrefixes} US ZIP prefixes.`
  );
  if (audit.warnings.length > 0) {
    audit.warnings.forEach(w => console.warn(`⚠️ ${w}`));
  }

  if (!audit.passed) {
    console.error(`\n❌ DATA AUDIT FAILED (${audit.errors.length} error(s)):`);
    audit.errors.forEach(e => console.error(`   - ${e}`));
    process.exit(1);
  }

  console.log('✅ Incoming data audit passed with 0 errors.');
}

main();

const fs = require('fs');
let yml = fs.readFileSync('.github/workflows/deploy-teams.yml', 'utf-8');

yml = yml.replace(/          # Make sure manifest and favicon exist at root\n          cp manifest\.json build\/\n/g, '');
yml = yml.replace(/          cp manifest\.json build\/\n/g, '');
yml = yml.replace(/          sed -i 's\|\\.\\.\/\\.\\.\/manifest\.json\|manifest\.json\|g' build\/index\.html\n/g, '');

fs.writeFileSync('.github/workflows/deploy-teams.yml', yml);

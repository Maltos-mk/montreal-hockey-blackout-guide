const fs = require('fs');
let yaml = fs.readFileSync('.github/workflows/deploy-teams.yml', 'utf-8');

const mtlSearch = `          # Fix paths to be root-relative for the standalone deployment
          sed -i 's|\\.\\./\\.\\./shared/|shared/|g' build/index.html
          sed -i 's|\\.\\./\\.\\./data/mtl.json|data.json|g' build/index.html`;

const mtlReplace = `          # Fix paths to be root-relative for the standalone deployment
          sed -i 's|\\.\\./\\.\\./shared/|shared/|g' build/index.html
          sed -i 's|\\.\\./\\.\\./data/mtl.json|data.json|g' build/index.html
          
          # Inject cache-busters into HTML assets so PWAs force update
          TIMESTAMP=$(date +%s)
          sed -i "s|shared/app.css|shared/app.css?v=$TIMESTAMP|g" build/index.html
          sed -i "s|shared/app.js|shared/app.js?v=$TIMESTAMP|g" build/index.html
          sed -i "s|blackout.js|blackout.js?v=$TIMESTAMP|g" build/index.html
          sed -i "s|data.json|data.json?v=$TIMESTAMP|g" build/index.html`;

const torSearch = `          # Fix paths
          sed -i 's|\\.\\./\\.\\./shared/|shared/|g' build/index.html
          sed -i 's|\\.\\./\\.\\./data/tor.json|data.json|g' build/index.html`;

const torReplace = `          # Fix paths
          sed -i 's|\\.\\./\\.\\./shared/|shared/|g' build/index.html
          sed -i 's|\\.\\./\\.\\./data/tor.json|data.json|g' build/index.html
          
          # Inject cache-busters into HTML assets so PWAs force update
          TIMESTAMP=$(date +%s)
          sed -i "s|shared/app.css|shared/app.css?v=$TIMESTAMP|g" build/index.html
          sed -i "s|shared/app.js|shared/app.js?v=$TIMESTAMP|g" build/index.html
          sed -i "s|blackout.js|blackout.js?v=$TIMESTAMP|g" build/index.html
          sed -i "s|data.json|data.json?v=$TIMESTAMP|g" build/index.html`;

yaml = yaml.replace(mtlSearch, mtlReplace);
yaml = yaml.replace(torSearch, torReplace);

fs.writeFileSync('.github/workflows/deploy-teams.yml', yaml);

const fs = require('fs');
let data = JSON.parse(fs.readFileSync('data/mtl.json', 'utf8'));

data.team = {
  "id": "OTT",
  "name": "Ottawa Senators",
  "nickname": "Sens",
  "colors": {
    "primary": "#c52032",
    "secondary": "#000000",
    "dark": "#8b1623"
  },
  "marketRegion": {
    "description": "QC, Atlantic Canada, Eastern Ontario",
    "regionCode": "ott_territory"
  }
};

data.schedule.forEach(g => {
  if (g.vs === 'vs Ottawa Senators' || g.vs === 'vs Ottawa Senators (Split Squad)') {
    g.vs = 'vs Montreal Canadiens' + (g.vs.includes('Split') ? ' (Split Squad)' : '');
  }
  if (g.vs === '@ Ottawa Senators' || g.vs === '@ Ottawa Senators (Split Squad)') {
    g.vs = '@ Montreal Canadiens' + (g.vs.includes('Split') ? ' (Split Squad)' : '');
  }

  if (g.netEN === 'TSN2') {
    g.netEN = 'TSN5';
  }
  if (g.netEN === 'Sportsnet East' || g.netEN === 'Sportsnet') {
     // keep it, Ottawa is on SN East/SN
  }
});

fs.writeFileSync('data/ott.json', JSON.stringify(data, null, 2));

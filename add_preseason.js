const fs = require('fs');
const path = './data/tor.json';
const tor = JSON.parse(fs.readFileSync(path, 'utf-8'));

const preseasonGames = [
  {
    "id": "2026010001",
    "date": "Tue, Sep 29, 2026",
    "netEN": "Sportsnet Ontario",
    "netFR": "",
    "type": "regional_tor",
    "iso": "2026-09-29T19:00:00-04:00",
    "phase": "preseason",
    "time": "7:00 PM",
    "vs": "vs Ottawa Senators",
    "venue": "Home Arena",
    "note": "Preseason"
  },
  {
    "id": "2026010002",
    "date": "Thu, Oct 1, 2026",
    "netEN": "TSN4",
    "netFR": "",
    "type": "regional_tor",
    "iso": "2026-10-01T19:00:00-04:00",
    "phase": "preseason",
    "time": "7:00 PM",
    "vs": "@ Montreal Canadiens",
    "venue": "Away Arena",
    "note": "Preseason"
  },
  {
    "id": "2026010003",
    "date": "Sat, Oct 3, 2026",
    "netEN": "Sportsnet",
    "netFR": "",
    "type": "national",
    "iso": "2026-10-03T19:00:00-04:00",
    "phase": "preseason",
    "time": "7:00 PM",
    "vs": "vs Detroit Red Wings",
    "venue": "Home Arena",
    "note": "Preseason"
  },
  {
    "id": "2026010004",
    "date": "Mon, Oct 5, 2026",
    "netEN": "Prime Video",
    "netFR": "",
    "type": "national",
    "iso": "2026-10-05T19:00:00-04:00",
    "phase": "preseason",
    "time": "7:00 PM",
    "vs": "@ Detroit Red Wings",
    "venue": "Away Arena",
    "note": "Preseason"
  },
  {
    "id": "2026010005",
    "date": "Wed, Oct 7, 2026",
    "netEN": "TSN4",
    "netFR": "",
    "type": "regional_tor",
    "iso": "2026-10-07T19:00:00-04:00",
    "phase": "preseason",
    "time": "7:00 PM",
    "vs": "vs Montreal Canadiens",
    "venue": "Home Arena",
    "note": "Preseason"
  }
];

tor.schedule = [...preseasonGames, ...tor.schedule];

fs.writeFileSync(path, JSON.stringify(tor, null, 2));
console.log('Added 5 preseason games. Total length:', tor.schedule.length);

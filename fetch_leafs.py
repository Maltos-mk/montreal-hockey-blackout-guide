import urllib.request
import json
import datetime
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://api-web.nhle.com/v1/club-schedule-season/TOR/20242025"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
response = urllib.request.urlopen(req, context=ctx)
data = json.loads(response.read().decode('utf-8'))

out_games = []

for g in data.get("games", []):
    if g.get("gameType") != 2:
        continue
        
    game_id = str(g["id"])
    game_date = g["startTimeUTC"]
    
    is_home = False
    opponent = ""
    if g["homeTeam"]["abbrev"] == "TOR":
        is_home = True
        opponent = g["awayTeam"]["placeName"]["default"] + " " + g["awayTeam"]["commonName"]["default"]
    else:
        opponent = g["homeTeam"]["placeName"]["default"] + " " + g["homeTeam"]["commonName"]["default"]
        
    tv = g.get("tvBroadcasts", [])
    nets = [t["network"] for t in tv]
    
    netEN = "Unknown"
    netFR = ""
    g_type = "regional_tor"
    
    nets_upper = [n.upper() for n in nets]
    
    if "PRIME" in nets_upper:
        netEN = "Prime"
        g_type = "prime_monday"
    elif "CBC" in nets_upper or "SN" in nets_upper or "CITY" in nets_upper or "SNO" in nets_upper or "SN1" in nets_upper or "SN360" in nets_upper:
        dt = datetime.datetime.strptime(game_date, "%Y-%m-%dT%H:%M:%SZ")
        if dt.weekday() == 5:
            g_type = "national"
            netEN = "Sportsnet/CBC"
        elif "SN" in nets_upper or "SNO" in nets_upper:
            if dt.weekday() == 2:
                g_type = "national"
                netEN = "Sportsnet"
            else:
                g_type = "regional_tor"
                netEN = "Sportsnet Ontario"
    
    if "TSN4" in nets_upper:
        g_type = "regional_tor"
        netEN = "TSN4"
        
    if "RDS" in nets_upper:
        netFR = "RDS"
    elif "TVA SPORTS" in nets_upper:
        netFR = "TVA Sports"
        
    out_games.append({
        "id": game_id,
        "date": game_date,
        "opponent": opponent,
        "isHome": is_home,
        "netEN": netEN,
        "netFR": netFR,
        "type": g_type
    })

out_json = {
  "team": {
    "id": "TOR",
    "name": "Toronto Maple Leafs",
    "nickname": "Leafs"
  },
  "schedule": out_games
}

with open("data/tor.json", "w") as f:
    json.dump(out_json, f, indent=2)

print(f"Saved {len(out_games)} regular season games to data/tor.json")

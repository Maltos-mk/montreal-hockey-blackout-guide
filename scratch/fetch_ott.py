import urllib.request
import json
import datetime

TEAM_ID = "OTT" # NHL uses abbreviation in some APIs, let's just fetch the full club schedule
URL = "https://api-web.nhle.com/v1/club-schedule-season/OTT/20262027"

try:
    with urllib.request.urlopen(URL) as response:
        data = json.loads(response.read().decode())
        
        games = []
        for g in data.get('games', []):
            game_date = g.get('startTimeUTC', '')
            home_team = g.get('homeTeam', {}).get('abbrev', '')
            away_team = g.get('awayTeam', {}).get('abbrev', '')
            
            # Figure out opponent and home/away
            is_home = (home_team == 'OTT')
            opponent = away_team if is_home else home_team
            vs_str = f"vs {opponent}" if is_home else f"@ {opponent}"
            
            # Broadcasters
            tv_broadcasts = g.get('tvBroadcasts', [])
            net_en = []
            net_fr = []
            for b in tv_broadcasts:
                network = b.get('network', '')
                lang = b.get('language', 'EN')
                # Filter out US feeds like ESPN+ if they are regional, etc, but we'll just grab the Canadian ones
                if lang == 'FR':
                    net_fr.append(network)
                elif lang == 'EN':
                    net_en.append(network)
                    
            # Simplify networks for the app
            primary_net_en = ""
            if any("Prime" in n for n in net_en): primary_net_en = "Prime Video"
            elif any("CBC" in n for n in net_en): primary_net_en = "Sportsnet / CBC"
            elif any("Sportsnet" in n for n in net_en): primary_net_en = "Sportsnet"
            elif any("TSN5" in n for n in net_en): primary_net_en = "TSN5"
            else: primary_net_en = net_en[0] if net_en else ""
            
            primary_net_fr = ""
            if any("TVA Sports" in n for n in net_fr): primary_net_fr = "TVA Sports"
            elif any("RDS" in n for n in net_fr): primary_net_fr = "RDS"
            else: primary_net_fr = net_fr[0] if net_fr else ""

            # Classify game type
            game_type = "national"
            if "TSN" in primary_net_en or "RDS" in primary_net_fr:
                game_type = "regional"
            
            # Handle preseason
            if g.get('gameType') == 1:
                game_type = "preseason"
                
            games.append({
                "id": str(g.get('id')),
                "date": game_date,
                "type": game_type,
                "vs": vs_str,
                "netEN": primary_net_en,
                "netFR": primary_net_fr,
                "venue": g.get('venue', {}).get('default', ''),
                "note": "Preseason" if game_type == "preseason" else ""
            })

        # Save to data/ott.json
        with open('data/ott.json', 'w') as f:
            json.dump(games, f, indent=2)
            
        print(f"Successfully saved {len(games)} Ottawa games.")
except Exception as e:
    print(f"Error: {e}")

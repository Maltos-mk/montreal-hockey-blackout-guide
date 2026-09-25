import urllib.request
import json
import datetime
import ssl
import sys

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

teams = {
    "MTL": "data/mtl.json",
    "TOR": "data/tor.json"
}

season = "20262027" # Note: using 20262027 based on current year
changed = False

for abbrev, filepath in teams.items():
    print(f"Checking {abbrev} schedule updates...")
    
    # Try fetching 20262027 first, fallback to 20252026 or 20242025 if 404
    url = f"https://api-web.nhle.com/v1/club-schedule-season/{abbrev}/20262027"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req, context=ctx)
        live_data = json.loads(response.read().decode('utf-8'))
    except Exception as e:
        # Fallback for testing/past seasons since API might not have 2026 loaded if it's early
        url = f"https://api-web.nhle.com/v1/club-schedule-season/{abbrev}/20252026"
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            response = urllib.request.urlopen(req, context=ctx)
            live_data = json.loads(response.read().decode('utf-8'))
        except:
            url = f"https://api-web.nhle.com/v1/club-schedule-season/{abbrev}/20242025"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            response = urllib.request.urlopen(req, context=ctx)
            live_data = json.loads(response.read().decode('utf-8'))

    live_games = {str(g["id"]): g["startTimeUTC"] for g in live_data.get("games", [])}
    
    with open(filepath, "r") as f:
        local_data = json.load(f)
        
    updated = 0
    for g in local_data.get("schedule", []):
        gid = str(g.get("id"))
        if gid in live_games:
            new_utc = live_games[gid]
            
            # Format comparison - we expect our iso to just be the ET representation of new_utc
            dt = datetime.datetime.strptime(new_utc, "%Y-%m-%dT%H:%M:%SZ")
            dt_et = dt - datetime.timedelta(hours=4) # Assuming EDT/EST approx for baseline
            new_iso = dt_et.strftime("%Y-%m-%dT%H:%M:%S-04:00")
            
            # Update if iso changed by more than just timezone offset nuances
            if g.get("iso") != new_iso:
                g["iso"] = new_iso
                # Update time string
                g["time"] = dt_et.strftime("%I:%M %p").lstrip("0")
                g["date"] = dt_et.strftime("%a, %b %d, %Y").replace(" 0", " ")
                updated += 1
                changed = True
                
    if updated > 0:
        with open(filepath, "w") as f:
            json.dump(local_data, f, indent=2)
        print(f"Updated {updated} game times for {abbrev}.")
    else:
        print(f"No time changes detected for {abbrev}.")

if changed:
    sys.exit(0) # Changes made
else:
    sys.exit(0)

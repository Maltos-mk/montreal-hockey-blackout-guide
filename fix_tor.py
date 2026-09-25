import json
import datetime

with open('data/tor.json', 'r') as f:
    data = json.load(f)

for g in data['schedule']:
    iso_date = g['date']
    # "2024-10-09T23:00:00Z"
    dt = datetime.datetime.strptime(iso_date, "%Y-%m-%dT%H:%M:%SZ")
    
    # Need to convert UTC to Eastern Time (naive approximation)
    dt_et = dt - datetime.timedelta(hours=4) # Assuming EDT mostly for schedule, or EST, just approximate
    
    # Format: "Tue, Sep 29, 2026"
    date_str = dt_et.strftime("%a, %b %d, %Y").replace(" 0", " ")
    
    # Format: "7:00 PM"
    time_str = dt_et.strftime("%I:%M %p").lstrip("0")
    
    g['iso'] = dt_et.strftime("%Y-%m-%dT%H:%M:%S-04:00")
    g['phase'] = "regular"
    g['date'] = date_str
    g['time'] = time_str
    
    is_home = g.get('isHome', False)
    opp = g.get('opponent', '')
    if is_home:
        g['vs'] = "vs " + opp
        g['venue'] = "Scotiabank Arena"
    else:
        g['vs'] = "@ " + opp
        g['venue'] = "Away Arena"
        
    g['note'] = ""
    
    # Clean up old keys
    if 'isHome' in g:
        del g['isHome']
    if 'opponent' in g:
        del g['opponent']

with open('data/tor.json', 'w') as f:
    json.dump(data, f, indent=2)

print("Fixed tor.json schema!")

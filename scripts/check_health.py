import urllib.request
import json

def check(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "AirGuard-QA/1.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = resp.read().decode("utf-8")
            print(f"URL: {url} -> Status: {resp.status}")
            try:
                print(json.dumps(json.loads(data), indent=2))
            except Exception:
                print(data[:300])
    except Exception as e:
        print(f"URL: {url} -> FAILED: {e}")

print("=== CHECKING AIRGUARD SERVICE HEALTH ===")
check("http://127.0.0.1:8001/health")
print("\n=== CHECKING SYSTEM HEALTH ===")
check("http://127.0.0.1:8001/api/v1/system-health")
print("\n=== CHECKING FRONTEND ===")
check("http://127.0.0.1:5173/")

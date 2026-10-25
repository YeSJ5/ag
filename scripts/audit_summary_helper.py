import sys
import os
sys.path.insert(0, os.path.join(os.getcwd(), "backend"))

# Disable live tasks during schema inspection
os.environ["RUN_INGESTION"] = "false"
os.environ["RUN_DETECTION"] = "false"

from app.main import app

print("=== AIRGUARD MODULE & ENDPOINT SUMMARY ===")
print("Project Title:", app.title)
print("OpenAPI URL:", app.openapi_url)
print("\n=== REGISTERED API ENDPOINTS ===")
routes = []
for route in app.routes:
    methods = getattr(route, "methods", None)
    path = getattr(route, "path", None)
    name = getattr(route, "name", None)
    if methods:
        routes.append((list(methods), path, name))
    else:
        routes.append((["WEBSOCKET/MOUNT"], path, name))

routes.sort(key=lambda x: x[1])
for methods, path, name in routes:
    methods_str = ",".join(methods)
    print(f"{methods_str:15} | {path:45} | {name}")

print(f"\nTotal endpoints: {len(routes)}")

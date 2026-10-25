import os
import sys

# Ensure backend directory is in sys.path when run from root
backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from backend.tests.test_core import (  # noqa: F401
    TestTC1ValidMessageParsing,
    TestTC2SpoofedMessageDetection,
    TestTC3MalformedAndIncompleteResilience,
)

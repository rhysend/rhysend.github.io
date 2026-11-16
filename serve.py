"""Build and serve the Jekyll site on localhost."""

import argparse
import os
from pathlib import Path
import shutil
import subprocess


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=60511)
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    ruby = shutil.which("ruby")
    if ruby is None:
        parser.exit(1, "Ruby is required to preview this site. See README.md.\n")

    env = os.environ.copy()
    env.pop("JEKYLL_NO_BUNDLER_REQUIRE", None)
    bundle = [ruby, "-S", "bundle"]
    check = subprocess.run(
        [*bundle, "check"], cwd=root, env=env, capture_output=True
    )
    if check.returncode == 0:
        command = [*bundle, "exec", "jekyll"]
    else:
        print("Bundled gems unavailable. Using locally installed Jekyll 3.10.0.", flush=True)
        env["JEKYLL_NO_BUNDLER_REQUIRE"] = "true"
        command = [ruby, "-S", "jekyll", "_3.10.0_"]

    try:
        result = subprocess.run(
            [*command, "serve", "--safe", "--host", "127.0.0.1", "--port", str(args.port)],
            cwd=root,
            env=env,
        )
    except KeyboardInterrupt:
        return 130
    if result.returncode:
        print("Jekyll preview failed. Check the error above and see README.md.", flush=True)
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())

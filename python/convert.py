import json
import os
import re
import argparse
import shutil


def main():
    files = os.listdir(args.emoji_directory)
    assert len(files) > 0

    with open("emoji.json") as f:
        emoji_lsit = json.load(f)

    for filename in files:
        unicode = re.sub(r"\..+$", "", filename)
        if unicode in emoji_lsit:
            if emoji_lsit[unicode]["diversity"] is not None:
                continue
            shortname = emoji_lsit[unicode]["shortname"].replace(":", "")
            shutil.copyfile(
                os.path.join(args.emoji_directory, filename),
                os.path.join(args.output_directory, shortname))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--emoji-directory", "-dir", type=str, required=True)
    parser.add_argument("--output-directory", "-out", type=str, required=True)
    args = parser.parse_args()
    main()
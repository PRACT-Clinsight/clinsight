import os

files_to_update = [
  "c:/Users/xthomk/OneDrive/Antigravity/Monetization/ClinSight-Website/index.html",
  "c:/Users/xthomk/OneDrive/Antigravity/Monetization/ClinSight-Website/explorer/index.html",
  "c:/Users/xthomk/OneDrive/Antigravity/Monetization/ClinSight-Website/jobs/index.html"
]

for p in files_to_update:
  if os.path.exists(p):
    with open(p, "r", encoding="utf-8") as f:
      text = f.read()

    text = text.replace('href="https://clinsight.pract.eu/"', 'href="/"')
    text = text.replace('href="https://clinsight.pract.eu/explorer/"', 'href="/explorer/"')
    text = text.replace('href="https://clinsight.pract.eu/compare/"', 'href="/compare/"')
    text = text.replace('href="https://clinsight.pract.eu/jobs/"', 'href="/jobs/"')
    text = text.replace('href="https://clinsight.pract.eu/trials/', 'href="/trials/')

    with open(p, "w", encoding="utf-8") as f:
      f.write(text)

print("Successfully converted internal links to relative paths across all pages.")

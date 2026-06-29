
import urllib.request, os, time

base = r"C:\Users\Naw\Desktop\Bratton 2\Project\bratton-pt-v2"

remaining = [
    "library_treatments_33","library_treatments_40","library_treatments_41",
    "library_treatments_43","library_treatments_44","library_treatments_45",
    "library_treatments_46","library_treatments_48","library_treatments_56",
    "library_treatments_58","library_treatments_59","library_treatments_60",
    "library_treatments_66","library_treatments_67","library_treatments_68",
    "library_treatments_69","library_treatments_72","library_treatments_73",
    "library_treatments_74","library_treatments_75","library_treatments_76",
    "library_treatments_77","library_treatments_78","library_treatments_79",
    "library_treatments_80","library_treatments_81","library_treatments_85",
    "library_treatments_93","library_treatments_95",
    "library_health","library_nl_all"
]

for i, name in enumerate(remaining):
    time.sleep(10)
    url = f"https://www.brattonphysicaltherapy.com/{name}/"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        resp = urllib.request.urlopen(req, timeout=15)
        html = resp.read().decode("utf-8", errors="ignore")
        fp = os.path.join(base, name, "index.html")
        with open(fp, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"{i+1}/{len(remaining)} {name} ({len(html)}c)")
    except Exception as e:
        print(f"{i+1}/{len(remaining)} {name} FAIL - retry later")

print("Done!")

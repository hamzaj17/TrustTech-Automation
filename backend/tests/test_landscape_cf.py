import requests, base64

url = "https://ai.zenoa.nz"   # your worker URL
headers = {
    "Authorization": "Bearer M6Ap00pTok@n123",
    "Content-Type": "application/json",
}

payload = {
    "prompt": "A cinematic high-resolution retro aesthetic landscape view of a sports car driving into the sunset, 4k digital art",
    "aspect_ratio": "16:9"
}

resp = requests.post(url, json=payload, headers=headers, timeout=120)
print(resp.status_code, resp.headers.get("Content-Type"))
if resp.status_code == 200:
    data = resp.json()
    b64 = data.get("image")
    if b64:
        with open("landscape_widescreen_output.png", "wb") as f:
            f.write(base64.b64decode(b64))
        print("Saved landscape_widescreen_output.png")
    else:
        print("No image field in worker response:", data)
else:
    print("Worker error:", resp.text)
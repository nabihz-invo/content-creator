# python words.py <voice> <rate> <out.json> : synthesize each line, keep mp3 + word timings
import asyncio, json, sys, edge_tts
LINES = [
 "You run more than one warehouse. But can you actually see all of them?",
 "Right now, finding one item means checking spreadsheets, calling branches, and waiting on messages.",
 "Stacko puts every warehouse and branch on one live map. Tap a location, and see what's there, what's low, and what's on the road.",
 "Your team logs a move in seconds, and the truck starts driving on the map.",
 "Your stock, always in sight. Book a meeting with our team.",
]
async def main(voice, rate, out):
    res = []
    for i, line in enumerate(LINES, 1):
        c = edge_tts.Communicate(line, voice, rate=rate, boundary='WordBoundary')
        words, audio = [], bytearray()
        async for ch in c.stream():
            if ch['type'] == 'audio': audio += ch['data']
            elif ch['type'] == 'WordBoundary':
                words.append({'w': ch['text'], 's': ch['offset'] / 1e7, 'e': (ch['offset'] + ch['duration']) / 1e7})
        open(f'l{i}.mp3', 'wb').write(audio)
        res.append({'line': line, 'words': words})
    json.dump(res, open(out, 'w', encoding='utf-8'), indent=1)
asyncio.run(main(*sys.argv[1:4]))

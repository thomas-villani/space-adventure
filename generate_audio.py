#!/usr/bin/env python3
"""Generate TTS audio files using OpenAI's gpt-4o-mini-tts API (Shimmer voice).

Creates .wav files for all spoken text in the space adventure game.
Organizes output into audio/ subdirectories with a manifest JSON for the game to use.
"""

import json
import os
import hashlib
import time
import requests

API_KEY = open('openai-api-key.txt').read().strip().split('=', 1)[1]
API_URL = 'https://api.openai.com/v1/audio/speech'
OUTPUT_DIR = 'audio'

INSTRUCTIONS = (
    "Affect: A friendly, enthusiastic narrator for a children's space exploration game.\n"
    "Tone: Warm, encouraging, and full of wonder — like a favorite teacher.\n"
    "Pacing: Clear and measured, suitable for ages 3-6. Slight pauses between sentences.\n"
    "Emotion: Excitement, curiosity, and encouragement.\n"
    "Pronunciation: Clear and precise. Easy to understand for young children."
)

# ── Pronunciation fixes ──
def fix_pronunciation(text):
    """Apply pronunciation rules before sending to TTS."""
    # Makemake → phonetic
    text = text.replace('Makemake', 'Mak-ee Mak-ee')
    text = text.replace('makemake', 'mak-ee mak-ee')
    # Blanks in quiz questions
    text = text.replace('_____', 'blank')
    text = text.replace('____', 'blank')
    text = text.replace('___', 'blank')
    text = text.replace('__', 'blank')
    # Haumea pronunciation help
    text = text.replace('Haumea', 'How-may-ah')
    # Enceladus
    text = text.replace('Enceladus', 'En-sell-ah-dus')
    # Hi'iaka
    text = text.replace("Hi'iaka", 'Hee-ee-ah-kah')
    return text


def generate_audio(text, filepath):
    """Call OpenAI TTS API and save the wav file."""
    if os.path.exists(filepath):
        print(f"  SKIP (exists): {filepath}")
        return True

    fixed_text = fix_pronunciation(text)

    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json',
    }
    payload = {
        'model': 'gpt-4o-mini-tts',
        'voice': 'shimmer',
        'input': fixed_text,
        'instructions': INSTRUCTIONS,
        'response_format': 'wav',
    }

    for attempt in range(3):
        try:
            resp = requests.post(API_URL, headers=headers, json=payload, timeout=30)
            if resp.status_code == 200:
                os.makedirs(os.path.dirname(filepath), exist_ok=True)
                with open(filepath, 'wb') as f:
                    f.write(resp.content)
                print(f"  OK: {filepath} ({len(resp.content)} bytes)")
                return True
            elif resp.status_code == 429:
                wait = 5 * (attempt + 1)
                print(f"  RATE LIMITED, waiting {wait}s...")
                time.sleep(wait)
            else:
                print(f"  ERROR {resp.status_code}: {resp.text[:200]}")
                if attempt < 2:
                    time.sleep(2)
        except Exception as e:
            print(f"  EXCEPTION: {e}")
            if attempt < 2:
                time.sleep(2)

    return False


def text_to_filename(text, max_len=60):
    """Convert text to a safe filename slug."""
    slug = text.lower()
    slug = slug.replace("'", '').replace('"', '').replace('!', '').replace('?', '')
    slug = slug.replace(',', '').replace('.', '').replace(':', '').replace(';', '')
    slug = slug.replace('(', '').replace(')', '').replace('—', '-').replace('–', '-')
    slug = slug.replace('%', 'pct').replace('°', 'deg')
    slug = ''.join(c if c.isalnum() or c in ' -' else '' for c in slug)
    slug = '-'.join(slug.split())
    if len(slug) > max_len:
        slug = slug[:max_len]
    return slug


# ══════════════════════════════════════════════════════════
# All text entries to generate
# ══════════════════════════════════════════════════════════

DESTINATIONS = [
    {
        'id': 'sun', 'name': 'The Sun',
        'facts': [
            "The Sun is a giant ball of super-hot glowing gas!",
            "The Sun is so big that over 1 million Earths could fit inside it!",
            "The Sun is about 4.6 billion years old — and it's middle-aged!",
            "Light from the Sun takes about 8 minutes to reach Earth!",
            "The Sun's surface is about 5,500 degrees Celsius — that's really hot!",
            "Without the Sun, there would be no life on Earth!",
        ],
        'quizzes': [
            "How many Earths could fit inside the Sun?",
            "How long does sunlight take to reach Earth?",
            "The Sun is a giant ball of _____.",
        ],
    },
    {
        'id': 'mercury', 'name': 'Mercury',
        'facts': [
            "Mercury is the closest planet to the Sun!",
            "A year on Mercury is only 88 Earth days!",
            "Mercury has no atmosphere — no air to breathe!",
            "Mercury is the smallest planet in our solar system!",
            "One day on Mercury lasts 59 Earth days — that's a long day!",
            "Mercury has wrinkles on its surface like a raisin!",
        ],
        'quizzes': [
            "Mercury is the _____ planet to the Sun.",
            "How long is a year on Mercury?",
            "What size is Mercury compared to other planets?",
        ],
    },
    {
        'id': 'venus', 'name': 'Venus',
        'facts': [
            "Venus is the hottest planet in the solar system!",
            "Venus spins backwards compared to most planets!",
            "Venus is sometimes called Earth's twin because they're similar sizes!",
            "A day on Venus is longer than a year on Venus — how silly!",
            "Venus is covered in thick, cloudy skies you can't see through!",
        ],
        'quizzes': [
            "Venus is the _____ planet in the solar system.",
            "Which way does Venus spin?",
            "Venus is sometimes called Earth's _____.",
        ],
    },
    {
        'id': 'earth', 'name': 'Earth',
        'facts': [
            "Earth is our home planet!",
            "Earth is the only planet known to have life!",
            "About 71% of Earth is covered in water!",
            "Earth has one moon that lights up our night sky!",
            "Earth is the only planet not named after a Greek or Roman god!",
            "Earth spins around once every 24 hours — that's one day!",
        ],
        'quizzes': [
            "How much of Earth is covered in water?",
            "Earth is the only planet known to have _____.",
            "How many moons does Earth have?",
        ],
    },
    {
        'id': 'moon', 'name': 'The Moon',
        'facts': [
            "The Moon is Earth's only natural satellite!",
            "Astronauts first walked on the Moon in 1969!",
            "The Moon has no wind, so footprints last forever!",
            "The Moon controls the tides in our oceans!",
            "You can see craters on the Moon with just binoculars!",
            "The Moon is slowly drifting away from Earth — about 1 inch per year!",
        ],
        'quizzes': [
            "What year did people first walk on the Moon?",
            "Why do footprints last forever on the Moon?",
            "What does the Moon help control on Earth?",
        ],
    },
    {
        'id': 'mars', 'name': 'Mars',
        'facts': [
            "Mars is called the Red Planet!",
            "Mars has the tallest mountain in the solar system — Olympus Mons!",
            "Mars has two tiny moons named Phobos and Deimos!",
            "Robots called rovers drive around on Mars taking pictures!",
            "A day on Mars is almost the same length as a day on Earth!",
            "Mars has giant dust storms that can cover the whole planet!",
        ],
        'quizzes': [
            "What color is Mars known for?",
            "What is the tallest mountain in the solar system?",
            "How many moons does Mars have?",
        ],
    },
    {
        'id': 'phobos', 'name': 'Phobos',
        'facts': [
            "Phobos is one of Mars's two tiny moons!",
            "Phobos is shaped like a potato — not round like most moons!",
            "Phobos orbits super close to Mars — closer than any other moon to its planet!",
            "Phobos is slowly getting closer to Mars and might break apart one day!",
            "Phobos has a giant crater called Stickney that takes up almost half its face!",
        ],
        'quizzes': [
            "What shape is Phobos?",
            "Phobos is a moon of which planet?",
            "What is happening to Phobos over time?",
        ],
    },
    {
        'id': 'deimos', 'name': 'Deimos',
        'facts': [
            "Deimos is the smaller of Mars's two moons!",
            "Deimos is one of the smallest moons in the solar system!",
            "Deimos is named after a character in Greek mythology!",
            "Deimos is smooth and covered in a thick layer of dusty soil!",
            "From Mars, Deimos would look like a bright star in the sky!",
        ],
        'quizzes': [
            "Deimos is the _____ of Mars's two moons.",
            "What covers Deimos's surface?",
            "What would Deimos look like from Mars?",
        ],
    },
    {
        'id': 'ceres', 'name': 'Ceres',
        'facts': [
            "Ceres is a dwarf planet in the asteroid belt!",
            "Ceres is the largest object in the asteroid belt!",
            "Ceres might have a hidden ocean of water under its surface!",
            "Ceres has bright, shiny spots made of salt on its surface!",
            "Ceres is round like a ball, which helped it become a dwarf planet!",
        ],
        'quizzes': [
            "Where is Ceres located?",
            "What might be hiding under Ceres's surface?",
            "Ceres is the _____ object in the asteroid belt.",
        ],
    },
    {
        'id': 'vesta', 'name': 'Vesta',
        'facts': [
            "Vesta is one of the largest asteroids in the solar system!",
            "Vesta is so bright you can sometimes see it without a telescope!",
            "Vesta has a giant mountain almost as tall as the tallest mountain on Mars!",
            "A spacecraft called Dawn visited Vesta and took amazing pictures!",
            "Vesta has a huge crater at its south pole from a massive space crash!",
        ],
        'quizzes': [
            "Vesta is one of the largest _____ in the solar system.",
            "What spacecraft visited Vesta?",
            "Can you see Vesta without a telescope?",
        ],
    },
    {
        'id': 'jupiter', 'name': 'Jupiter',
        'facts': [
            "Jupiter is the biggest planet — over 1,000 Earths could fit inside!",
            "Jupiter has a giant storm called the Great Red Spot!",
            "Jupiter has at least 95 moons!",
            "Jupiter spins so fast that a day only lasts about 10 hours!",
            "Jupiter is like a giant ball of gas — it has no solid ground!",
            "The Great Red Spot storm has been raging for over 300 years!",
        ],
        'quizzes': [
            "Jupiter is the _____ planet in the solar system.",
            "What is the Great Red Spot on Jupiter?",
            "How long is a day on Jupiter?",
        ],
    },
    {
        'id': 'io', 'name': 'Io',
        'facts': [
            "Io is the most volcanic place in the solar system!",
            "Io has over 400 active volcanoes!",
            "Io is one of Jupiter's four biggest moons!",
            "Io's volcanoes shoot lava higher than any mountain on Earth!",
            "Io looks yellow and orange like a pizza!",
        ],
        'quizzes': [
            "What is special about Io?",
            "How many active volcanoes does Io have?",
            "What food does Io look like?",
        ],
    },
    {
        'id': 'europa', 'name': 'Europa',
        'facts': [
            "Europa has a giant ocean hidden under its icy surface!",
            "Scientists think Europa might have conditions for life!",
            "Europa is one of the smoothest objects in the solar system!",
            "Europa's ocean might have more water than all of Earth's oceans!",
            "Europa's icy shell is covered in long, criss-crossing cracks!",
        ],
        'quizzes': [
            "What is under Europa's icy surface?",
            "Why are scientists excited about Europa?",
            "Europa's surface is covered in _____.",
        ],
    },
    {
        'id': 'ganymede', 'name': 'Ganymede',
        'facts': [
            "Ganymede is the largest moon in the solar system!",
            "Ganymede is even bigger than the planet Mercury!",
            "Ganymede has its own magnetic field!",
            "Ganymede might have a salty ocean under its surface!",
            "Ganymede is one of Jupiter's four Galilean moons!",
        ],
        'quizzes': [
            "Ganymede is bigger than which planet?",
            "Ganymede is the _____ moon in the solar system.",
            "What special thing does Ganymede have?",
        ],
    },
    {
        'id': 'callisto', 'name': 'Callisto',
        'facts': [
            "Callisto is the most cratered object in the solar system!",
            "Callisto might have a salty ocean deep inside!",
            "Callisto is about the same size as Mercury!",
            "Callisto's surface is super old — billions of years!",
            "Callisto is the farthest of Jupiter's four big moons!",
        ],
        'quizzes': [
            "What covers Callisto's surface?",
            "Callisto is about the same size as _____.",
            "How old is Callisto's surface?",
        ],
    },
    {
        'id': 'saturn', 'name': 'Saturn',
        'facts': [
            "Saturn has the most spectacular rings of any planet!",
            "Saturn is so light it could float in a giant bathtub!",
            "Saturn's rings are made of ice and rock!",
            "Saturn has over 140 moons — more than any other planet!",
            "You could fit 764 Earths inside Saturn!",
            "Saturn's rings stretch out super far but are actually really thin!",
        ],
        'quizzes': [
            "What are Saturn's rings made of?",
            "What would happen if you put Saturn in water?",
            "Saturn has the most _____ of any planet.",
        ],
    },
    {
        'id': 'titan', 'name': 'Titan',
        'facts': [
            "Titan is Saturn's largest moon!",
            "Titan has lakes and rivers — but they're made of liquid methane!",
            "Titan has a thick orange atmosphere!",
            "Titan is the only moon in the solar system with a thick atmosphere!",
            "It actually rains on Titan — but not water, it rains methane!",
        ],
        'quizzes': [
            "What are Titan's lakes made of?",
            "What color is Titan's atmosphere?",
            "What makes Titan special among moons?",
        ],
    },
    {
        'id': 'enceladus', 'name': 'Enceladus',
        'facts': [
            "Enceladus shoots giant geysers of water into space!",
            "Enceladus is one of the shiniest objects in the solar system!",
            "There's a warm ocean hiding under its icy shell!",
            "Enceladus is tiny — you could drive across it in a few hours!",
            "The water geysers help create one of Saturn's rings!",
        ],
        'quizzes': [
            "What does Enceladus shoot into space?",
            "Why is Enceladus so shiny?",
            "What is hiding under Enceladus's icy shell?",
        ],
    },
    {
        'id': 'uranus', 'name': 'Uranus',
        'facts': [
            "Uranus rotates on its side like a rolling ball!",
            "Uranus is an ice giant — very cold!",
            "Uranus has 27 known moons!",
            "Uranus has faint rings that are hard to see!",
            "Uranus is so far away that sunlight takes about 3 hours to reach it!",
            "Uranus looks blue-green because of a gas called methane!",
        ],
        'quizzes': [
            "What is unusual about how Uranus rotates?",
            "How many known moons does Uranus have?",
            "Why does Uranus look blue-green?",
        ],
    },
    {
        'id': 'miranda', 'name': 'Miranda',
        'facts': [
            "Miranda has the tallest cliff in the solar system!",
            "The cliff is called Verona Rupes — it's 20 km tall!",
            "Miranda looks like it was smashed apart and put back together!",
            "Miranda is one of the smallest moons we've visited with a spacecraft!",
            "If you fell off Miranda's cliff, it would take about 12 minutes to hit the bottom!",
        ],
        'quizzes': [
            "What record does Miranda hold?",
            "What is Miranda's famous cliff called?",
            "What does Miranda look like?",
        ],
    },
    {
        'id': 'neptune', 'name': 'Neptune',
        'facts': [
            "Neptune has the fastest winds in the solar system — up to 2,100 km/h!",
            "Neptune is the farthest planet from the Sun!",
            "Neptune is a beautiful deep blue color!",
            "It takes Neptune 165 years to go around the Sun once!",
            "Neptune has 16 known moons!",
            "Neptune is so far away it was discovered using math before anyone saw it!",
        ],
        'quizzes': [
            "Neptune has the fastest _____ in the solar system.",
            "How long does it take Neptune to orbit the Sun?",
            "How was Neptune discovered?",
        ],
    },
    {
        'id': 'triton', 'name': 'Triton',
        'facts': [
            "Triton orbits Neptune backwards!",
            "Triton has geysers that shoot nitrogen gas!",
            "Triton is one of the coldest places in the solar system!",
            "Triton might be a captured dwarf planet from far away!",
            "The temperature on Triton is about -235 degrees Celsius — brrr!",
        ],
        'quizzes': [
            "What is special about Triton's orbit?",
            "What do Triton's geysers shoot out?",
            "Triton might actually be a captured _____.",
        ],
    },
    {
        'id': 'pluto', 'name': 'Pluto',
        'facts': [
            "Pluto used to be the 9th planet — now it's a dwarf planet!",
            "Pluto is smaller than Earth's Moon!",
            "Pluto has a giant heart-shaped glacier on its surface!",
            "Pluto has five moons — the biggest one is Charon!",
            "It takes Pluto 248 years to go around the Sun once!",
            "Pluto is so far away that the Sun looks like a bright star from there!",
        ],
        'quizzes': [
            "What is Pluto classified as?",
            "What shape is the glacier on Pluto?",
            "How long does it take Pluto to orbit the Sun?",
        ],
    },
    {
        'id': 'charon', 'name': 'Charon',
        'facts': [
            "Charon is Pluto's biggest moon!",
            "Charon and Pluto always show the same face to each other!",
            "Charon has a reddish north pole!",
            "Charon is so big compared to Pluto that they dance around each other!",
            "Charon has canyons and cliffs all over its surface!",
        ],
        'quizzes': [
            "Charon is a moon of which dwarf planet?",
            "What color is Charon's north pole?",
            "What do Charon and Pluto always do?",
        ],
    },
    {
        'id': 'arrokoth', 'name': 'Arrokoth',
        'facts': [
            "Arrokoth is shaped like a snowman — two lumps stuck together!",
            "Arrokoth was visited by the New Horizons spacecraft in 2019!",
            "Arrokoth is one of the most distant objects we've ever visited!",
            "Arrokoth is reddish-brown and super cold and icy!",
            "Arrokoth's name means 'sky' in the Powhatan language!",
        ],
        'quizzes': [
            "What shape is Arrokoth?",
            "What spacecraft visited Arrokoth?",
            "What does the name Arrokoth mean?",
        ],
    },
    {
        'id': 'makemake', 'name': 'Makemake',
        'facts': [
            "Makemake is a dwarf planet way out past Neptune!",
            "Makemake is named after the god of creation from Easter Island!",
            "Makemake is one of the reddish-brown objects in the outer solar system!",
            "Makemake has one tiny moon nicknamed MK2!",
            "Makemake is super cold — about minus 240 degrees Celsius!",
        ],
        'quizzes': [
            "Where is Makemake located?",
            "Makemake is named after a god from where?",
            "How many moons does Makemake have?",
        ],
    },
    {
        'id': 'haumea', 'name': 'Haumea',
        'facts': [
            "Haumea spins so fast that it's shaped like an egg!",
            "Haumea is the fastest spinning large object in our solar system!",
            "Haumea has its own rings — very few small objects have rings!",
            "Haumea has two moons named Hi'iaka and Namaka!",
            "Haumea is named after the Hawaiian goddess of childbirth!",
        ],
        'quizzes': [
            "What shape is Haumea?",
            "What makes Haumea special?",
            "Haumea has its own _____.",
        ],
    },
    {
        'id': 'eris', 'name': 'Eris',
        'facts': [
            "Eris is the most massive dwarf planet we know about!",
            "Eris is so far away that it takes over 550 years to orbit the Sun!",
            "Eris has one moon called Dysnomia!",
            "When Eris was discovered, it helped scientists reclassify Pluto!",
            "Eris is named after the Greek goddess of discord!",
        ],
        'quizzes': [
            "Eris is the most _____ dwarf planet.",
            "How long does it take Eris to orbit the Sun?",
            "What happened when Eris was discovered?",
        ],
    },
    {
        'id': 'iss', 'name': 'Space Station',
        'facts': [
            "The Space Station is a real spaceship where astronauts live!",
            "The ISS flies around Earth 16 times every single day!",
            "The Space Station is as big as a football field!",
            "Astronauts on the ISS float around because of microgravity!",
            "The ISS has been in space since 1998 — that's a long time!",
        ],
        'quizzes': [
            "How many times does the ISS orbit Earth each day?",
            "How big is the ISS?",
            "What do astronauts do on the ISS?",
        ],
    },
    {
        'id': 'halley', 'name': "Halley's Comet",
        'facts': [
            "Halley's Comet visits us about every 75 years!",
            "Comets are made of ice, dust, and rock — like a dirty snowball!",
            "When a comet gets close to the Sun, it grows a beautiful glowing tail!",
            "Halley's Comet was last seen from Earth in 1986!",
            "The tail of a comet always points away from the Sun!",
        ],
        'quizzes': [
            "How often does Halley's Comet visit?",
            "What are comets made of?",
            "Which way does a comet's tail point?",
        ],
    },
    {
        'id': 'voyager', 'name': 'Voyager 1',
        'facts': [
            "Voyager 1 is the farthest human-made object from Earth!",
            "Voyager 1 has been traveling through space since 1977!",
            "Voyager carries a golden record with sounds and pictures from Earth!",
            "Voyager 1 has left the solar system and entered interstellar space!",
            "It takes over 22 hours for a message from Voyager to reach Earth!",
        ],
        'quizzes': [
            "When was Voyager 1 launched?",
            "What does Voyager carry?",
            "Voyager 1 is the _____ human-made object from Earth.",
        ],
    },
]

FUN_FACTS = [
    "Did you know astronauts grow up to 2 inches taller in space?",
    "A day on Venus is longer than a year on Venus!",
    "There are more stars in the universe than grains of sand on Earth!",
    "In space, no one can hear you scream — there's no air to carry sound!",
    "The footprints on the Moon will last for millions of years!",
    "A spacesuit costs about $12 million!",
    "Saturn's rings would fit between Earth and the Moon!",
    "Neutron stars are so dense that a teaspoon would weigh a billion tons!",
    "Space smells like seared steak and gunpowder, according to astronauts!",
    "There's a planet made of diamonds called 55 Cancri e!",
    "The Sun is so big that about 1.3 million Earths could fit inside it!",
    "One year on Mercury is only 88 Earth days!",
    "Jupiter's Great Red Spot is a storm that has lasted over 300 years!",
    "You could fit all the other planets between Earth and the Moon!",
    "There is a volcano on Mars called Olympus Mons that is 3 times taller than Mount Everest!",
    "It takes sunlight about 8 minutes to reach Earth!",
    "If you could drive a car to the Sun, it would take about 170 years!",
    "The Moon is slowly drifting away from Earth — about 1.5 inches per year!",
    "Saturn is so light it would float in a giant bathtub!",
    "A year on Neptune lasts 165 Earth years!",
    "The Milky Way galaxy has over 100 billion stars!",
    "Space is completely silent because there are no molecules to carry sound!",
    "Uranus spins on its side, like a rolling ball!",
    "Mars has the tallest mountain and the deepest canyon in the solar system!",
    "There are more trees on Earth than stars in the Milky Way!",
    "The International Space Station orbits Earth every 90 minutes!",
    "Astronauts on the ISS see 16 sunrises and sunsets every day!",
    "Venus is the hottest planet even though Mercury is closer to the Sun!",
    "Pluto is smaller than the United States!",
    "A day on Jupiter lasts only about 10 hours!",
    "The largest known star could fit 5 billion Suns inside it!",
    "Comets are made of ice, dust, and rock — they're like dirty snowballs!",
    "Light from the nearest star takes over 4 years to reach us!",
    "There might be more than 2 trillion galaxies in the universe!",
    "Io, one of Jupiter's moons, has over 400 active volcanoes!",
    "Europa, another moon of Jupiter, might have an ocean under its icy surface!",
    "Titan, Saturn's largest moon, has lakes and rivers of liquid methane!",
    "The Voyager 1 spacecraft is the farthest human-made object from Earth!",
    "Halley's Comet passes by Earth once every 75 to 79 years!",
    "The asteroid belt between Mars and Jupiter has millions of space rocks!",
]

MISSIONS = [
    {'id': 'inner_tour', 'name': 'Inner Planet Tour'},
    {'id': 'gas_giant_express', 'name': 'Gas Giant Express'},
    {'id': 'grand_tour', 'name': 'The Grand Tour'},
    {'id': 'jupiter_moons', 'name': "Jupiter's Big Moons"},
    {'id': 'dwarf_hunter', 'name': 'Dwarf Planet Hunter'},
    {'id': 'ice_worlds', 'name': 'Ice Worlds Explorer'},
    {'id': 'mars_mission', 'name': 'Mars Mission'},
    {'id': 'ring_worlds', 'name': 'Ring World Tour'},
    {'id': 'rocky_road', 'name': 'Rocky Road'},
    {'id': 'alien_taxi', 'name': 'Alien Taxi'},
    {'id': 'care_package', 'name': 'Care Package'},
    {'id': 'ice_delivery', 'name': 'Ice Sample Run'},
    {'id': 'find_voyager', 'name': 'Find Voyager'},
    {'id': 'comet_chase', 'name': 'Comet Chase'},
    {'id': 'edge_of_space', 'name': 'Edge of Space'},
]

# Static UI spoken messages
UI_MESSAGES = {
    'correct': 'Correct! Amazing!',
    'good-try': 'Good try! Keep exploring!',
    'postcard-saved': 'Postcard saved!',
    'wormhole': 'Wormhole!',
    'victory': 'You did it! You explored the whole Solar System!',
    # Mini-game intros
    'mining-intro': 'Shoot the asteroids to mine crystals! Use arrows to move, Space to fire!',
    'moon-bounce-intro': 'Collect the stars!',
    'ring-catcher-intro': 'Catch the rings!',
    'storm-surfer-dodge-lightning': 'Dodge the lightning!',
    'storm-surfer-watch-lava': 'Watch out for lava!',
    'storm-surfer-dodge-ice': 'Dodge the ice shards!',
    'storm-surfer-dodge-rain': 'Dodge the raindrops!',
    'geyser-ride-enceladus': 'Ride the geyser up! Steer left and right to collect crystals!',
    'geyser-ride-miranda': "Fly up Miranda's giant cliff! Steer left and right to collect crystals!",
    'satellite-launch-orbit': 'Launch into orbit!',
    'satellite-launch-probe': 'Launch the probe!',
    'satellite-launch-clouds': 'Launch through the clouds!',
    'satellite-launch-rover': 'Launch the rover!',
    'ice-cracker-intro': 'Crack the ice!',
    # Mini-game completion messages
    'master-miner': 'Master miner!',
    'nice-mining': 'Nice mining!',
    'out-of-this-world': 'Out of this world!',
    'great-bouncing': 'Great bouncing!',
    'amazing-catch': 'Amazing catch!',
    'great-effort': 'Great effort!',
    'storm-master': 'Storm master!',
    'great-surfing': 'Great surfing!',
    'amazing-ride': 'Amazing ride!',
    'great-flying': 'Great flying!',
    'launch-expert': 'Launch expert!',
    'great-launches': 'Great launches!',
    'perfect-cracker': 'Perfect cracker!',
    'great-cracking': 'Great cracking!',
}


def main():
    manifest = {}  # text -> relative file path
    total = 0
    success = 0
    failed = 0

    # ── 1. Planet facts (name + all facts joined, spoken on landing) ──
    print("\n=== Planet landing narrations ===")
    os.makedirs(f'{OUTPUT_DIR}/planets', exist_ok=True)
    for dest in DESTINATIONS:
        did = dest['id']
        full_text = dest['name'] + '. ' + '. '.join(dest['facts'])
        key = f"landing:{did}"
        filename = f"planets/{did}-landing.wav"
        filepath = f"{OUTPUT_DIR}/{filename}"
        print(f"[{did}] Landing narration...")
        total += 1
        if generate_audio(full_text, filepath):
            manifest[key] = filename
            success += 1
        else:
            failed += 1

    # ── 2. Quiz questions ──
    print("\n=== Quiz questions ===")
    os.makedirs(f'{OUTPUT_DIR}/quizzes', exist_ok=True)
    for dest in DESTINATIONS:
        did = dest['id']
        for i, q in enumerate(dest['quizzes']):
            key = f"quiz:{did}:{i}"
            slug = text_to_filename(q, 40)
            filename = f"quizzes/{did}-q{i}-{slug}.wav"
            filepath = f"{OUTPUT_DIR}/{filename}"
            print(f"[{did}] Quiz {i}: {q[:50]}...")
            total += 1
            if generate_audio(q, filepath):
                manifest[key] = filename
                success += 1
            else:
                failed += 1

    # ── 3. "You're visiting X!" (orbit scene) ──
    print("\n=== Orbit visit announcements ===")
    os.makedirs(f'{OUTPUT_DIR}/visits', exist_ok=True)
    for dest in DESTINATIONS:
        did = dest['id']
        text = f"You're visiting {dest['name']}!"
        key = f"visiting:{did}"
        filename = f"visits/{did}-visiting.wav"
        filepath = f"{OUTPUT_DIR}/{filename}"
        print(f"[{did}] Visiting...")
        total += 1
        if generate_audio(text, filepath):
            manifest[key] = filename
            success += 1
        else:
            failed += 1

    # ── 4. "You're near X!" (solar system proximity) ──
    print("\n=== Proximity announcements ===")
    os.makedirs(f'{OUTPUT_DIR}/proximity', exist_ok=True)
    for dest in DESTINATIONS:
        did = dest['id']
        text = f"You're near {dest['name']}!"
        key = f"near:{did}"
        filename = f"proximity/{did}-near.wav"
        filepath = f"{OUTPUT_DIR}/{filename}"
        print(f"[{did}] Near...")
        total += 1
        if generate_audio(text, filepath):
            manifest[key] = filename
            success += 1
        else:
            failed += 1

    # ── 5. Fun facts ──
    print("\n=== Fun facts ===")
    os.makedirs(f'{OUTPUT_DIR}/funfacts', exist_ok=True)
    for i, fact in enumerate(FUN_FACTS):
        key = f"funfact:{i}"
        slug = text_to_filename(fact, 50)
        filename = f"funfacts/{i:02d}-{slug}.wav"
        filepath = f"{OUTPUT_DIR}/{filename}"
        print(f"[{i}] {fact[:50]}...")
        total += 1
        if generate_audio(fact, filepath):
            manifest[key] = filename
            success += 1
        else:
            failed += 1

    # ── 6. Mission completions ──
    print("\n=== Mission completions ===")
    os.makedirs(f'{OUTPUT_DIR}/missions', exist_ok=True)
    for mission in MISSIONS:
        mid = mission['id']
        text = f"Mission complete! {mission['name']}"
        key = f"mission:{mid}"
        filename = f"missions/{mid}-complete.wav"
        filepath = f"{OUTPUT_DIR}/{filename}"
        print(f"[{mid}] {text}")
        total += 1
        if generate_audio(text, filepath):
            manifest[key] = filename
            success += 1
        else:
            failed += 1

    # ── 7. Static UI messages ──
    print("\n=== UI messages ===")
    os.makedirs(f'{OUTPUT_DIR}/ui', exist_ok=True)
    for msg_id, text in UI_MESSAGES.items():
        key = f"ui:{msg_id}"
        filename = f"ui/{msg_id}.wav"
        filepath = f"{OUTPUT_DIR}/{filename}"
        print(f"[{msg_id}] {text}")
        total += 1
        if generate_audio(text, filepath):
            manifest[key] = filename
            success += 1
        else:
            failed += 1

    # ── Write manifest ──
    manifest_path = f'{OUTPUT_DIR}/manifest.json'
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2)

    # ── Build text→file lookup (maps exact spoken text to audio file) ──
    text_lookup = {}

    # Landing narrations (text = "Name. Fact1. Fact2. ...")
    for dest in DESTINATIONS:
        full_text = dest['name'] + '. ' + '. '.join(dest['facts'])
        key = f"landing:{dest['id']}"
        if key in manifest:
            text_lookup[full_text] = manifest[key]

    # Quiz questions (exact question text)
    for dest in DESTINATIONS:
        for i, q in enumerate(dest['quizzes']):
            key = f"quiz:{dest['id']}:{i}"
            if key in manifest:
                text_lookup[q] = manifest[key]

    # Visiting announcements
    for dest in DESTINATIONS:
        text = f"You're visiting {dest['name']}!"
        key = f"visiting:{dest['id']}"
        if key in manifest:
            text_lookup[text] = manifest[key]

    # Proximity announcements
    for dest in DESTINATIONS:
        text = f"You're near {dest['name']}!"
        key = f"near:{dest['id']}"
        if key in manifest:
            text_lookup[text] = manifest[key]

    # Fun facts
    for i, fact in enumerate(FUN_FACTS):
        key = f"funfact:{i}"
        if key in manifest:
            text_lookup[fact] = manifest[key]

    # Mission completions
    for mission in MISSIONS:
        text = f"Mission complete! {mission['name']}"
        key = f"mission:{mission['id']}"
        if key in manifest:
            text_lookup[text] = manifest[key]

    # UI messages
    for msg_id, text in UI_MESSAGES.items():
        key = f"ui:{msg_id}"
        if key in manifest:
            text_lookup[text] = manifest[key]

    lookup_path = f'{OUTPUT_DIR}/text-lookup.json'
    with open(lookup_path, 'w') as f:
        json.dump(text_lookup, f, indent=2)

    print(f"\n{'='*50}")
    print(f"Done! {success}/{total} generated, {failed} failed")
    print(f"Manifest written to {manifest_path}")
    print(f"Text lookup written to {lookup_path} ({len(text_lookup)} entries)")


if __name__ == '__main__':
    main()

// All destinations with compressed cartoon-scale distances
// Distances are from the sun, angles are orbital position
export const DESTINATIONS = [
  // The Sun
  {
    id: 'sun', name: 'The Sun', type: 'star',
    color: 0xFFDD00, size: 8, distance: 0, angle: 0,
    facts: [
      "The Sun is a giant ball of super-hot glowing gas!",
      "The Sun is so big that over 1 million Earths could fit inside it!",
      "The Sun is about 4.6 billion years old — and it's middle-aged!",
      "Light from the Sun takes about 8 minutes to reach Earth!",
      "The Sun's surface is about 5,500 degrees Celsius — that's really hot!",
      "Without the Sun, there would be no life on Earth!",
    ],
    quizzes: [
      {
        question: "How many Earths could fit inside the Sun?",
        options: ["About 100", "Over 1 million", "About 10"],
        correct: 1,
      },
      {
        question: "How long does sunlight take to reach Earth?",
        options: ["1 second", "About 8 minutes", "About 1 hour"],
        correct: 1,
      },
      {
        question: "The Sun is a giant ball of _____.",
        options: ["Rock", "Water", "Hot glowing gas"],
        correct: 2,
      },
    ],
  },

  // Inner planets
  {
    id: 'mercury', name: 'Mercury', type: 'planet',
    color: 0xAAAAAA, size: 1.5, distance: 45, angle: 0.8,
    facts: [
      "Mercury is the closest planet to the Sun!",
      "A year on Mercury is only 88 Earth days!",
      "Mercury has no atmosphere — no air to breathe!",
      "Mercury is the smallest planet in our solar system!",
      "One day on Mercury lasts 59 Earth days — that's a long day!",
      "Mercury has wrinkles on its surface like a raisin!",
    ],
    quizzes: [
      {
        question: "Mercury is the _____ planet to the Sun.",
        options: ["Closest", "Farthest", "Biggest"],
        correct: 0,
      },
      {
        question: "How long is a year on Mercury?",
        options: ["88 Earth days", "365 Earth days", "10 Earth days"],
        correct: 0,
      },
      {
        question: "What size is Mercury compared to other planets?",
        options: ["The biggest", "Medium", "The smallest"],
        correct: 2,
      },
    ],
  },
  {
    id: 'venus', name: 'Venus', type: 'planet',
    color: 0xFFCC66, size: 2.2, distance: 70, angle: 2.1,
    facts: [
      "Venus is the hottest planet in the solar system!",
      "Venus spins backwards compared to most planets!",
      "Venus is sometimes called Earth's twin because they're similar sizes!",
      "A day on Venus is longer than a year on Venus — how silly!",
      "Venus is covered in thick, cloudy skies you can't see through!",
    ],
    quizzes: [
      {
        question: "Venus is the _____ planet in the solar system.",
        options: ["Coldest", "Hottest", "Smallest"],
        correct: 1,
      },
      {
        question: "Which way does Venus spin?",
        options: ["Backwards", "Super fast", "It doesn't spin"],
        correct: 0,
      },
      {
        question: "Venus is sometimes called Earth's _____.",
        options: ["Baby", "Twin", "Cousin"],
        correct: 1,
      },
    ],
  },
  {
    id: 'earth', name: 'Earth', type: 'planet',
    color: 0x4488FF, size: 2.3, distance: 95, angle: 3.8,
    facts: [
      "Earth is our home planet!",
      "Earth is the only planet known to have life!",
      "About 71% of Earth is covered in water!",
      "Earth has one moon that lights up our night sky!",
      "Earth is the only planet not named after a Greek or Roman god!",
      "Earth spins around once every 24 hours — that's one day!",
    ],
    quizzes: [
      {
        question: "How much of Earth is covered in water?",
        options: ["About 20%", "About 50%", "About 71%"],
        correct: 2,
      },
      {
        question: "Earth is the only planet known to have _____.",
        options: ["Rocks", "Life", "Clouds"],
        correct: 1,
      },
      {
        question: "How many moons does Earth have?",
        options: ["None", "One", "Three"],
        correct: 1,
      },
    ],
  },
  {
    id: 'moon', name: 'The Moon', type: 'moon', parent: 'earth',
    color: 0xCCCCCC, size: 0.8, distance: 5, angle: 1.2,
    miniGame: 'moon-bounce',
    facts: [
      "The Moon is Earth's only natural satellite!",
      "Astronauts first walked on the Moon in 1969!",
      "The Moon has no wind, so footprints last forever!",
      "The Moon controls the tides in our oceans!",
      "You can see craters on the Moon with just binoculars!",
      "The Moon is slowly drifting away from Earth — about 1 inch per year!",
    ],
    quizzes: [
      {
        question: "What year did people first walk on the Moon?",
        options: ["1969", "1999", "2005"],
        correct: 0,
      },
      {
        question: "Why do footprints last forever on the Moon?",
        options: ["The ground is sticky", "There is no wind", "It rains glue"],
        correct: 1,
      },
      {
        question: "What does the Moon help control on Earth?",
        options: ["The weather", "The tides", "Gravity"],
        correct: 1,
      },
    ],
  },
  {
    id: 'mars', name: 'Mars', type: 'planet',
    color: 0xDD4422, size: 1.8, distance: 130, angle: 5.2,
    facts: [
      "Mars is called the Red Planet!",
      "Mars has the tallest mountain in the solar system — Olympus Mons!",
      "Mars has two tiny moons named Phobos and Deimos!",
      "Robots called rovers drive around on Mars taking pictures!",
      "A day on Mars is almost the same length as a day on Earth!",
      "Mars has giant dust storms that can cover the whole planet!",
    ],
    quizzes: [
      {
        question: "What color is Mars known for?",
        options: ["Blue", "Green", "Red"],
        correct: 2,
      },
      {
        question: "What is the tallest mountain in the solar system?",
        options: ["Mount Everest", "Olympus Mons", "Moon Mountain"],
        correct: 1,
      },
      {
        question: "How many moons does Mars have?",
        options: ["None", "One", "Two"],
        correct: 2,
      },
    ],
  },
  {
    id: 'phobos', name: 'Phobos', type: 'moon', parent: 'mars',
    color: 0x887766, size: 0.5, distance: 5, angle: 0.8,
    facts: [
      "Phobos is one of Mars's two tiny moons!",
      "Phobos is shaped like a potato — not round like most moons!",
      "Phobos orbits super close to Mars — closer than any other moon to its planet!",
      "Phobos is slowly getting closer to Mars and might break apart one day!",
      "Phobos has a giant crater called Stickney that takes up almost half its face!",
    ],
    quizzes: [
      {
        question: "What shape is Phobos?",
        options: ["Round like a ball", "Like a potato", "Like a cube"],
        correct: 1,
      },
      {
        question: "Phobos is a moon of which planet?",
        options: ["Earth", "Jupiter", "Mars"],
        correct: 2,
      },
      {
        question: "What is happening to Phobos over time?",
        options: ["Getting farther from Mars", "Getting closer to Mars", "Staying the same"],
        correct: 1,
      },
    ],
  },
  {
    id: 'deimos', name: 'Deimos', type: 'moon', parent: 'mars',
    color: 0x998877, size: 0.3, distance: 7, angle: 3.5,
    facts: [
      "Deimos is the smaller of Mars's two moons!",
      "Deimos is one of the smallest moons in the solar system!",
      "Deimos is named after a character in Greek mythology!",
      "Deimos is smooth and covered in a thick layer of dusty soil!",
      "From Mars, Deimos would look like a bright star in the sky!",
    ],
    quizzes: [
      {
        question: "Deimos is the _____ of Mars's two moons.",
        options: ["Bigger", "Smaller", "Brighter"],
        correct: 1,
      },
      {
        question: "What covers Deimos's surface?",
        options: ["Water", "Dusty soil", "Trees"],
        correct: 1,
      },
      {
        question: "What would Deimos look like from Mars?",
        options: ["A bright star", "A big circle", "Invisible"],
        correct: 0,
      },
    ],
  },

  // Asteroid belt
  {
    id: 'ceres', name: 'Ceres', type: 'planet',
    color: 0xBBBBAA, size: 1.2, distance: 170, angle: 3.0,
    miniGame: 'mining',
    facts: [
      "Ceres is a dwarf planet in the asteroid belt!",
      "Ceres is the largest object in the asteroid belt!",
      "Ceres might have a hidden ocean of water under its surface!",
      "Ceres has bright, shiny spots made of salt on its surface!",
      "Ceres is round like a ball, which helped it become a dwarf planet!",
    ],
    quizzes: [
      {
        question: "Where is Ceres located?",
        options: ["Near the Sun", "In the asteroid belt", "Past Neptune"],
        correct: 1,
      },
      {
        question: "What might be hiding under Ceres's surface?",
        options: ["Treasure", "An ocean", "Dinosaurs"],
        correct: 1,
      },
      {
        question: "Ceres is the _____ object in the asteroid belt.",
        options: ["Smallest", "Fastest", "Largest"],
        correct: 2,
      },
    ],
  },

  {
    id: 'vesta', name: 'Vesta', type: 'planet',
    color: 0xBBAAAA, size: 0.9, distance: 160, angle: 1.5,
    miniGame: 'mining',
    facts: [
      "Vesta is one of the largest asteroids in the solar system!",
      "Vesta is so bright you can sometimes see it without a telescope!",
      "Vesta has a giant mountain almost as tall as the tallest mountain on Mars!",
      "A spacecraft called Dawn visited Vesta and took amazing pictures!",
      "Vesta has a huge crater at its south pole from a massive space crash!",
    ],
    quizzes: [
      {
        question: "Vesta is one of the largest _____ in the solar system.",
        options: ["Planets", "Asteroids", "Stars"],
        correct: 1,
      },
      {
        question: "What spacecraft visited Vesta?",
        options: ["Voyager", "Dawn", "Apollo"],
        correct: 1,
      },
      {
        question: "Can you see Vesta without a telescope?",
        options: ["Never", "Sometimes yes!", "Always"],
        correct: 1,
      },
    ],
  },

  // Gas giants
  {
    id: 'jupiter', name: 'Jupiter', type: 'planet',
    color: 0xDD9955, size: 6, distance: 220, angle: 0.5,
    facts: [
      "Jupiter is the biggest planet — over 1,000 Earths could fit inside!",
      "Jupiter has a giant storm called the Great Red Spot!",
      "Jupiter has at least 95 moons!",
      "Jupiter spins so fast that a day only lasts about 10 hours!",
      "Jupiter is like a giant ball of gas — it has no solid ground!",
      "The Great Red Spot storm has been raging for over 300 years!",
    ],
    quizzes: [
      {
        question: "Jupiter is the _____ planet in the solar system.",
        options: ["Smallest", "Biggest", "Hottest"],
        correct: 1,
      },
      {
        question: "What is the Great Red Spot on Jupiter?",
        options: ["A volcano", "A giant storm", "A lake"],
        correct: 1,
      },
      {
        question: "How long is a day on Jupiter?",
        options: ["About 10 hours", "About 24 hours", "About 100 hours"],
        correct: 0,
      },
    ],
  },
  {
    id: 'io', name: 'Io', type: 'moon', parent: 'jupiter',
    color: 0xFFFF44, size: 0.7, distance: 8, angle: 0.5,
    facts: [
      "Io is the most volcanic place in the solar system!",
      "Io has over 400 active volcanoes!",
      "Io is one of Jupiter's four biggest moons!",
      "Io's volcanoes shoot lava higher than any mountain on Earth!",
      "Io looks yellow and orange like a pizza!",
    ],
    quizzes: [
      {
        question: "What is special about Io?",
        options: ["It has rings", "It has lots of volcanoes", "It has oceans"],
        correct: 1,
      },
      {
        question: "How many active volcanoes does Io have?",
        options: ["About 10", "About 100", "Over 400"],
        correct: 2,
      },
      {
        question: "What food does Io look like?",
        options: ["A pizza", "A cookie", "A blueberry"],
        correct: 0,
      },
    ],
  },
  {
    id: 'europa', name: 'Europa', type: 'moon', parent: 'jupiter',
    color: 0xCCDDFF, size: 0.7, distance: 10, angle: 2.0,
    facts: [
      "Europa has a giant ocean hidden under its icy surface!",
      "Scientists think Europa might have conditions for life!",
      "Europa is one of the smoothest objects in the solar system!",
      "Europa's ocean might have more water than all of Earth's oceans!",
      "Europa's icy shell is covered in long, criss-crossing cracks!",
    ],
    quizzes: [
      {
        question: "What is under Europa's icy surface?",
        options: ["Lava", "An ocean", "Diamonds"],
        correct: 1,
      },
      {
        question: "Why are scientists excited about Europa?",
        options: ["It's the biggest moon", "It might have life", "It has rings"],
        correct: 1,
      },
      {
        question: "Europa's surface is covered in _____.",
        options: ["Volcanoes", "Trees", "Cracks in the ice"],
        correct: 2,
      },
    ],
  },
  {
    id: 'ganymede', name: 'Ganymede', type: 'moon', parent: 'jupiter',
    color: 0x998877, size: 0.9, distance: 12, angle: 3.8,
    facts: [
      "Ganymede is the largest moon in the solar system!",
      "Ganymede is even bigger than the planet Mercury!",
      "Ganymede has its own magnetic field!",
      "Ganymede might have a salty ocean under its surface!",
      "Ganymede is one of Jupiter's four Galilean moons!",
    ],
    quizzes: [
      {
        question: "Ganymede is bigger than which planet?",
        options: ["Jupiter", "Earth", "Mercury"],
        correct: 2,
      },
      {
        question: "Ganymede is the _____ moon in the solar system.",
        options: ["Smallest", "Fastest", "Largest"],
        correct: 2,
      },
      {
        question: "What special thing does Ganymede have?",
        options: ["Its own magnetic field", "Its own rings", "Its own moon"],
        correct: 0,
      },
    ],
  },
  {
    id: 'callisto', name: 'Callisto', type: 'moon', parent: 'jupiter',
    color: 0x666677, size: 0.8, distance: 14, angle: 5.5,
    facts: [
      "Callisto is the most cratered object in the solar system!",
      "Callisto might have a salty ocean deep inside!",
      "Callisto is about the same size as Mercury!",
      "Callisto's surface is super old — billions of years!",
      "Callisto is the farthest of Jupiter's four big moons!",
    ],
    quizzes: [
      {
        question: "What covers Callisto's surface?",
        options: ["Water", "Trees", "Craters"],
        correct: 2,
      },
      {
        question: "Callisto is about the same size as _____.",
        options: ["Jupiter", "The Sun", "Mercury"],
        correct: 2,
      },
      {
        question: "How old is Callisto's surface?",
        options: ["Brand new", "Billions of years old", "100 years old"],
        correct: 1,
      },
    ],
  },

  {
    id: 'saturn', name: 'Saturn', type: 'planet',
    color: 0xEEDD88, size: 5, distance: 290, angle: 2.8,
    hasRings: true, ringColor: 0xCCBB88,
    miniGame: 'ring-catcher',
    facts: [
      "Saturn has the most spectacular rings of any planet!",
      "Saturn is so light it could float in a giant bathtub!",
      "Saturn's rings are made of ice and rock!",
      "Saturn has over 140 moons — more than any other planet!",
      "You could fit 764 Earths inside Saturn!",
      "Saturn's rings stretch out super far but are actually really thin!",
    ],
    quizzes: [
      {
        question: "What are Saturn's rings made of?",
        options: ["Fire", "Clouds", "Ice and rock"],
        correct: 2,
      },
      {
        question: "What would happen if you put Saturn in water?",
        options: ["It would sink", "It would float", "It would melt"],
        correct: 1,
      },
      {
        question: "Saturn has the most _____ of any planet.",
        options: ["Volcanoes", "Moons", "Mountains"],
        correct: 1,
      },
    ],
  },
  {
    id: 'titan', name: 'Titan', type: 'moon', parent: 'saturn',
    color: 0xDD9944, size: 0.9, distance: 8, angle: 1.0,
    facts: [
      "Titan is Saturn's largest moon!",
      "Titan has lakes and rivers — but they're made of liquid methane!",
      "Titan has a thick orange atmosphere!",
      "Titan is the only moon in the solar system with a thick atmosphere!",
      "It actually rains on Titan — but not water, it rains methane!",
    ],
    quizzes: [
      {
        question: "What are Titan's lakes made of?",
        options: ["Water", "Liquid methane", "Lava"],
        correct: 1,
      },
      {
        question: "What color is Titan's atmosphere?",
        options: ["Blue", "Orange", "Green"],
        correct: 1,
      },
      {
        question: "What makes Titan special among moons?",
        options: ["It has thick atmosphere", "It has rings", "It glows in the dark"],
        correct: 0,
      },
    ],
  },
  {
    id: 'enceladus', name: 'Enceladus', type: 'moon', parent: 'saturn',
    color: 0xFFFFFF, size: 0.5, distance: 7, angle: 3.5,
    facts: [
      "Enceladus shoots giant geysers of water into space!",
      "Enceladus is one of the shiniest objects in the solar system!",
      "There's a warm ocean hiding under its icy shell!",
      "Enceladus is tiny — you could drive across it in a few hours!",
      "The water geysers help create one of Saturn's rings!",
    ],
    quizzes: [
      {
        question: "What does Enceladus shoot into space?",
        options: ["Fire", "Water geysers", "Rocks"],
        correct: 1,
      },
      {
        question: "Why is Enceladus so shiny?",
        options: ["It's made of gold", "It's covered in ice", "It glows"],
        correct: 1,
      },
      {
        question: "What is hiding under Enceladus's icy shell?",
        options: ["A warm ocean", "A volcano", "A cave"],
        correct: 0,
      },
    ],
  },

  {
    id: 'uranus', name: 'Uranus', type: 'planet',
    color: 0x88CCDD, size: 3.5, distance: 360, angle: 4.5,
    hasRings: true, ringColor: 0x6699AA,
    facts: [
      "Uranus rotates on its side like a rolling ball!",
      "Uranus is an ice giant — very cold!",
      "Uranus has 27 known moons!",
      "Uranus has faint rings that are hard to see!",
      "Uranus is so far away that sunlight takes about 3 hours to reach it!",
      "Uranus looks blue-green because of a gas called methane!",
    ],
    quizzes: [
      {
        question: "What is unusual about how Uranus rotates?",
        options: ["It doesn't rotate", "It rotates on its side", "It rotates super fast"],
        correct: 1,
      },
      {
        question: "How many known moons does Uranus have?",
        options: ["5", "27", "100"],
        correct: 1,
      },
      {
        question: "Why does Uranus look blue-green?",
        options: ["It has oceans", "Because of methane gas", "It's painted"],
        correct: 1,
      },
    ],
  },
  {
    id: 'miranda', name: 'Miranda', type: 'moon', parent: 'uranus',
    color: 0xAABBCC, size: 0.4, distance: 5, angle: 2.0,
    facts: [
      "Miranda has the tallest cliff in the solar system!",
      "The cliff is called Verona Rupes — it's 20 km tall!",
      "Miranda looks like it was smashed apart and put back together!",
      "Miranda is one of the smallest moons we've visited with a spacecraft!",
      "If you fell off Miranda's cliff, it would take about 12 minutes to hit the bottom!",
    ],
    quizzes: [
      {
        question: "What record does Miranda hold?",
        options: ["Biggest moon", "Tallest cliff", "Most volcanoes"],
        correct: 1,
      },
      {
        question: "What is Miranda's famous cliff called?",
        options: ["Verona Rupes", "Grand Canyon", "Moon Mountain"],
        correct: 0,
      },
      {
        question: "What does Miranda look like?",
        options: ["Perfectly smooth", "Smashed apart and put back together", "Covered in water"],
        correct: 1,
      },
    ],
  },

  {
    id: 'neptune', name: 'Neptune', type: 'planet',
    color: 0x3344DD, size: 3.3, distance: 420, angle: 1.2,
    facts: [
      "Neptune has the fastest winds in the solar system — up to 2,100 km/h!",
      "Neptune is the farthest planet from the Sun!",
      "Neptune is a beautiful deep blue color!",
      "It takes Neptune 165 years to go around the Sun once!",
      "Neptune has 16 known moons!",
      "Neptune is so far away it was discovered using math before anyone saw it!",
    ],
    quizzes: [
      {
        question: "Neptune has the fastest _____ in the solar system.",
        options: ["Volcanoes", "Rivers", "Winds"],
        correct: 2,
      },
      {
        question: "How long does it take Neptune to orbit the Sun?",
        options: ["1 year", "20 years", "165 years"],
        correct: 2,
      },
      {
        question: "How was Neptune discovered?",
        options: ["By accident", "Using math", "By a dog"],
        correct: 1,
      },
    ],
  },
  {
    id: 'triton', name: 'Triton', type: 'moon', parent: 'neptune',
    color: 0xCCDDCC, size: 0.7, distance: 6, angle: 4.0,
    facts: [
      "Triton orbits Neptune backwards!",
      "Triton has geysers that shoot nitrogen gas!",
      "Triton is one of the coldest places in the solar system!",
      "Triton might be a captured dwarf planet from far away!",
      "The temperature on Triton is about -235 degrees Celsius — brrr!",
    ],
    quizzes: [
      {
        question: "What is special about Triton's orbit?",
        options: ["It goes backwards", "It's square-shaped", "It stops sometimes"],
        correct: 0,
      },
      {
        question: "What do Triton's geysers shoot out?",
        options: ["Water", "Nitrogen gas", "Lava"],
        correct: 1,
      },
      {
        question: "Triton might actually be a captured _____.",
        options: ["Star", "Comet", "Dwarf planet"],
        correct: 2,
      },
    ],
  },
  {
    id: 'pluto', name: 'Pluto', type: 'planet',
    color: 0xDDCCAA, size: 1.0, distance: 480, angle: 5.0,
    facts: [
      "Pluto used to be the 9th planet — now it's a dwarf planet!",
      "Pluto is smaller than Earth's Moon!",
      "Pluto has a giant heart-shaped glacier on its surface!",
      "Pluto has five moons — the biggest one is Charon!",
      "It takes Pluto 248 years to go around the Sun once!",
      "Pluto is so far away that the Sun looks like a bright star from there!",
    ],
    quizzes: [
      {
        question: "What is Pluto classified as?",
        options: ["A star", "A dwarf planet", "A comet"],
        correct: 1,
      },
      {
        question: "What shape is the glacier on Pluto?",
        options: ["A star", "A heart", "A circle"],
        correct: 1,
      },
      {
        question: "How long does it take Pluto to orbit the Sun?",
        options: ["1 year", "88 years", "248 years"],
        correct: 2,
      },
    ],
  },
  {
    id: 'charon', name: 'Charon', type: 'moon', parent: 'pluto',
    color: 0x999999, size: 0.6, distance: 4, angle: 2.5,
    facts: [
      "Charon is Pluto's biggest moon!",
      "Charon and Pluto always show the same face to each other!",
      "Charon has a reddish north pole!",
      "Charon is so big compared to Pluto that they dance around each other!",
      "Charon has canyons and cliffs all over its surface!",
    ],
    quizzes: [
      {
        question: "Charon is a moon of which dwarf planet?",
        options: ["Ceres", "Pluto", "Eris"],
        correct: 1,
      },
      {
        question: "What color is Charon's north pole?",
        options: ["Blue", "Reddish", "White"],
        correct: 1,
      },
      {
        question: "What do Charon and Pluto always do?",
        options: ["Show the same face to each other", "Crash into each other", "Spin the same way"],
        correct: 0,
      },
    ],
  },

  // Kuiper Belt objects and distant dwarf planets
  {
    id: 'arrokoth', name: 'Arrokoth', type: 'planet',
    color: 0xCC8866, size: 0.6, distance: 450, angle: 3.5,
    facts: [
      "Arrokoth is shaped like a snowman — two lumps stuck together!",
      "Arrokoth was visited by the New Horizons spacecraft in 2019!",
      "Arrokoth is one of the most distant objects we've ever visited!",
      "Arrokoth is reddish-brown and super cold and icy!",
      "Arrokoth's name means 'sky' in the Powhatan language!",
    ],
    quizzes: [
      {
        question: "What shape is Arrokoth?",
        options: ["Round", "Like a snowman", "Like a star"],
        correct: 1,
      },
      {
        question: "What spacecraft visited Arrokoth?",
        options: ["Apollo", "Voyager", "New Horizons"],
        correct: 2,
      },
      {
        question: "What does the name Arrokoth mean?",
        options: ["Star", "Sky", "Moon"],
        correct: 1,
      },
    ],
  },
  {
    id: 'makemake', name: 'Makemake', type: 'planet',
    color: 0xDDAACC, size: 1.0, distance: 465, angle: 2.0,
    facts: [
      "Makemake is a dwarf planet way out past Neptune!",
      "Makemake is named after the god of creation from Easter Island!",
      "Makemake is one of the reddish-brown objects in the outer solar system!",
      "Makemake has one tiny moon nicknamed MK2!",
      "Makemake is super cold — about minus 240 degrees Celsius!",
    ],
    quizzes: [
      {
        question: "Where is Makemake located?",
        options: ["Near the Sun", "Way past Neptune", "Between Earth and Mars"],
        correct: 1,
      },
      {
        question: "Makemake is named after a god from where?",
        options: ["Easter Island", "Greece", "Egypt"],
        correct: 0,
      },
      {
        question: "How many moons does Makemake have?",
        options: ["None", "One", "Ten"],
        correct: 1,
      },
    ],
  },
  {
    id: 'haumea', name: 'Haumea', type: 'planet',
    color: 0xCCDDDD, size: 1.0, distance: 475, angle: 4.2,
    hasRings: true, ringColor: 0x8899AA,
    miniGame: 'ring-catcher',
    facts: [
      "Haumea spins so fast that it's shaped like an egg!",
      "Haumea is the fastest spinning large object in our solar system!",
      "Haumea has its own rings — very few small objects have rings!",
      "Haumea has two moons named Hi'iaka and Namaka!",
      "Haumea is named after the Hawaiian goddess of childbirth!",
    ],
    quizzes: [
      {
        question: "What shape is Haumea?",
        options: ["Round like a ball", "Shaped like an egg", "Square"],
        correct: 1,
      },
      {
        question: "What makes Haumea special?",
        options: ["It glows", "It spins super fast", "It's the biggest"],
        correct: 1,
      },
      {
        question: "Haumea has its own _____.",
        options: ["Atmosphere", "Rings", "Volcanoes"],
        correct: 1,
      },
    ],
  },
  {
    id: 'eris', name: 'Eris', type: 'planet',
    color: 0xEEEEDD, size: 1.1, distance: 500, angle: 0.3,
    facts: [
      "Eris is the most massive dwarf planet we know about!",
      "Eris is so far away that it takes over 550 years to orbit the Sun!",
      "Eris has one moon called Dysnomia!",
      "When Eris was discovered, it helped scientists reclassify Pluto!",
      "Eris is named after the Greek goddess of discord!",
    ],
    quizzes: [
      {
        question: "Eris is the most _____ dwarf planet.",
        options: ["Massive", "Colorful", "Closest to the Sun"],
        correct: 0,
      },
      {
        question: "How long does it take Eris to orbit the Sun?",
        options: ["10 years", "100 years", "Over 550 years"],
        correct: 2,
      },
      {
        question: "What happened when Eris was discovered?",
        options: ["Nothing", "Pluto was reclassified", "A new star was found"],
        correct: 1,
      },
    ],
  },

  // ── Bonus destinations (don't count toward 100% completion) ──
  {
    id: 'iss', name: 'Space Station', type: 'moon', parent: 'earth',
    bonus: true, skipAsteroid: true,
    color: 0xCCCCCC, size: 0.3, distance: 3, angle: 4.5,
    facts: [
      "The Space Station is a real spaceship where astronauts live!",
      "The ISS flies around Earth 16 times every single day!",
      "The Space Station is as big as a football field!",
      "Astronauts on the ISS float around because of microgravity!",
      "The ISS has been in space since 1998 — that's a long time!",
    ],
    quizzes: [
      {
        question: "How many times does the ISS orbit Earth each day?",
        options: ["Once", "16 times", "100 times"],
        correct: 1,
      },
      {
        question: "How big is the ISS?",
        options: ["As big as a car", "As big as a football field", "As big as a city"],
        correct: 1,
      },
      {
        question: "What do astronauts do on the ISS?",
        options: ["Play games all day", "Live and do science", "Sleep all day"],
        correct: 1,
      },
    ],
  },
  {
    id: 'halley', name: "Halley's Comet", type: 'planet',
    bonus: true,
    color: 0xCCDDFF, size: 0.8, distance: 300, angle: 3.5,
    facts: [
      "Halley's Comet visits us about every 75 years!",
      "Comets are made of ice, dust, and rock — like a dirty snowball!",
      "When a comet gets close to the Sun, it grows a beautiful glowing tail!",
      "Halley's Comet was last seen from Earth in 1986!",
      "The tail of a comet always points away from the Sun!",
    ],
    quizzes: [
      {
        question: "How often does Halley's Comet visit?",
        options: ["Every year", "About every 75 years", "Every 1000 years"],
        correct: 1,
      },
      {
        question: "What are comets made of?",
        options: ["Gold", "Ice, dust, and rock", "Fire"],
        correct: 1,
      },
      {
        question: "Which way does a comet's tail point?",
        options: ["Toward the Sun", "Away from the Sun", "Down"],
        correct: 1,
      },
    ],
  },
  {
    id: 'voyager', name: 'Voyager 1', type: 'planet',
    bonus: true, skipAsteroid: true,
    color: 0xDDCC88, size: 0.2, distance: 505, angle: 1.8,
    facts: [
      "Voyager 1 is the farthest human-made object from Earth!",
      "Voyager 1 has been traveling through space since 1977!",
      "Voyager carries a golden record with sounds and pictures from Earth!",
      "Voyager 1 has left the solar system and entered interstellar space!",
      "It takes over 22 hours for a message from Voyager to reach Earth!",
    ],
    quizzes: [
      {
        question: "When was Voyager 1 launched?",
        options: ["1977", "2001", "2020"],
        correct: 0,
      },
      {
        question: "What does Voyager carry?",
        options: ["A flag", "A golden record", "Food"],
        correct: 1,
      },
      {
        question: "Voyager 1 is the _____ human-made object from Earth.",
        options: ["Closest", "Farthest", "Fastest"],
        correct: 1,
      },
    ],
  },
];

// Pre-build a lookup map
export const DESTINATION_MAP = {};
for (const d of DESTINATIONS) {
  DESTINATION_MAP[d.id] = d;
}

// Required destinations (non-bonus) — used for victory condition
export const REQUIRED_DESTINATIONS = DESTINATIONS.filter(d => !d.bonus);

// Get planets (non-moons) for positioning
export const PLANETS = DESTINATIONS.filter(d => d.type === 'planet');
export const MOONS = DESTINATIONS.filter(d => d.type === 'moon');

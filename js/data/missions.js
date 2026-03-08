// Mission definitions for the mission board system
// Each mission has objectives (destination IDs to visit)
// ordered: true means they must be visited in sequence

export const MISSIONS = [
  // ── Route missions (ordered) ──
  {
    id: 'inner_tour',
    name: 'Inner Planet Tour',
    description: 'Visit the inner planets in order from the Sun!',
    objectives: ['mercury', 'venus', 'earth', 'mars'],
    ordered: true,
    reward: 15,
  },
  {
    id: 'gas_giant_express',
    name: 'Gas Giant Express',
    description: 'Tour the gas and ice giants in order!',
    objectives: ['jupiter', 'saturn', 'uranus', 'neptune'],
    ordered: true,
    reward: 20,
  },
  {
    id: 'grand_tour',
    name: 'The Grand Tour',
    description: 'From the Sun to the edge! Visit Sun, Jupiter, Saturn, Neptune, Pluto in order!',
    objectives: ['sun', 'jupiter', 'saturn', 'neptune', 'pluto'],
    ordered: true,
    reward: 25,
  },

  // ── Collection missions (unordered) ──
  {
    id: 'jupiter_moons',
    name: "Jupiter's Big Moons",
    description: "Visit all four of Jupiter's Galilean moons!",
    objectives: ['io', 'europa', 'ganymede', 'callisto'],
    ordered: false,
    reward: 15,
  },
  {
    id: 'dwarf_hunter',
    name: 'Dwarf Planet Hunter',
    description: 'Find all the dwarf planets!',
    objectives: ['ceres', 'pluto', 'makemake', 'eris'],
    ordered: false,
    reward: 20,
  },
  {
    id: 'ice_worlds',
    name: 'Ice Worlds Explorer',
    description: 'Visit the iciest places in the solar system!',
    objectives: ['europa', 'enceladus', 'triton', 'pluto'],
    ordered: false,
    reward: 15,
  },
  {
    id: 'mars_mission',
    name: 'Mars Mission',
    description: 'Explore Mars and both its tiny moons!',
    objectives: ['mars', 'phobos', 'deimos'],
    ordered: false,
    reward: 10,
  },
  {
    id: 'ring_worlds',
    name: 'Ring World Tour',
    description: 'Visit all the planets and dwarf planets with rings!',
    objectives: ['saturn', 'uranus', 'haumea'],
    ordered: false,
    reward: 15,
  },
  {
    id: 'rocky_road',
    name: 'Rocky Road',
    description: 'Visit the rocky planets and asteroids!',
    objectives: ['mercury', 'venus', 'mars', 'vesta', 'ceres'],
    ordered: false,
    reward: 15,
  },

  // ── Delivery missions (ordered, 2 stops) ──
  {
    id: 'alien_taxi',
    name: 'Alien Taxi',
    description: 'Pick up Zorp the alien on Mars and fly to Saturn!',
    objectives: ['mars', 'saturn'],
    ordered: true,
    reward: 15,
  },
  {
    id: 'care_package',
    name: 'Care Package',
    description: 'Deliver supplies from Earth to the Space Station!',
    objectives: ['earth', 'iss'],
    ordered: true,
    reward: 10,
  },
  {
    id: 'ice_delivery',
    name: 'Ice Sample Run',
    description: 'Collect ice from Enceladus and bring it to Titan!',
    objectives: ['enceladus', 'titan'],
    ordered: true,
    reward: 12,
  },

  // ── Discovery missions (single destination) ──
  {
    id: 'find_voyager',
    name: 'Find Voyager',
    description: 'Locate Voyager 1 at the edge of the solar system!',
    objectives: ['voyager'],
    ordered: false,
    reward: 10,
  },
  {
    id: 'comet_chase',
    name: 'Comet Chase',
    description: "Track down Halley's Comet!",
    objectives: ['halley'],
    ordered: false,
    reward: 10,
  },
  {
    id: 'edge_of_space',
    name: 'Edge of Space',
    description: 'Visit Eris, the most distant dwarf planet!',
    objectives: ['eris'],
    ordered: false,
    reward: 10,
  },
];

// Lookup map
export const MISSION_MAP = {};
for (const m of MISSIONS) MISSION_MAP[m.id] = m;

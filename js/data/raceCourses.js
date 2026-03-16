// Race course definitions for Space Race mode
export const RACE_COURSES = [
  {
    id: 'inner-dash',
    name: 'Inner Planets Dash',
    description: 'Race through the 4 inner planets!',
    waypoints: ['mercury', 'venus', 'earth', 'mars'],
  },
  {
    id: 'gas-giants',
    name: 'Gas Giant Tour',
    description: 'Visit the 4 gas and ice giants!',
    waypoints: ['jupiter', 'saturn', 'uranus', 'neptune'],
  },
  {
    id: 'moon-hop',
    name: 'Moon Hopper',
    description: 'Hop between 6 famous moons!',
    waypoints: ['moon', 'io', 'europa', 'titan', 'triton', 'charon'],
  },
  {
    id: 'full-sprint',
    name: 'Full Solar Sprint',
    description: 'Race to all 8 planets in order!',
    waypoints: ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'],
  },
  {
    id: 'dwarf-drag',
    name: 'Dwarf Planet Drag Race',
    description: 'Hit every dwarf planet and KBO!',
    waypoints: ['ceres', 'pluto', 'makemake', 'haumea', 'eris', 'arrokoth'],
  },
  {
    id: 'edge-run',
    name: 'Edge of Space Run',
    description: 'From the Sun to Voyager 1!',
    waypoints: ['sun', 'mars', 'jupiter', 'neptune', 'pluto', 'eris', 'voyager'],
  },
  {
    id: 'random-5',
    name: 'Random 5',
    description: '5 random destinations every time!',
    random: 5,
  },
];

require('dotenv').config();

const { connectDatabase } = require('./config/database');
const TrailRoute = require('./models/trailRoute.model');

const routes = [
  {
    name: 'Montgó Circular',
    slug: 'montgo-circular',
    description: 'Ruta de montaña con vistas al Mediterráneo y tramos técnicos.',
    location: {
      country: 'España',
      region: 'Comunitat Valenciana',
      province: 'Alicante',
      municipality: 'Dénia'
    },
    startPoint: {
      type: 'Point',
      coordinates: [0.1123, 38.8027]
    },
    distanceKm: 14.8,
    elevationGainM: 720,
    elevationLossM: 720,
    difficulty: 'hard',
    surface: ['trail', 'rock', 'dirt'],
    tags: ['mediterraneo', 'montana', 'circular'],
    isPublished: true
  },
  {
    name: 'Sierra Calderona Skyline',
    slug: 'sierra-calderona-skyline',
    description: 'Recorrido largo por pistas y senderos de la Sierra Calderona.',
    location: {
      country: 'España',
      region: 'Comunitat Valenciana',
      province: 'Valencia',
      municipality: 'Serra'
    },
    startPoint: {
      type: 'Point',
      coordinates: [-0.4332, 39.6831]
    },
    distanceKm: 28.4,
    elevationGainM: 1180,
    elevationLossM: 1180,
    difficulty: 'expert',
    surface: ['trail', 'dirt', 'gravel'],
    tags: ['skyline', 'larga-distancia', 'bosque'],
    isPublished: true
  }
];

async function seed() {
  await connectDatabase();
  await TrailRoute.deleteMany({});
  await TrailRoute.insertMany(routes);
  console.log(`Seed completado: ${routes.length} rutas`);
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});

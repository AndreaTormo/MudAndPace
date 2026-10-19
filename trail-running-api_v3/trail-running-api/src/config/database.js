const mongoose = require('mongoose');
const Host = require('../models/host.model');
const Category = require('../models/category.model');
const Location = require('../models/location.model');
const Event = require('../models/event.model');

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI no está definida');
  }

  await mongoose.connect(uri);
  console.log('MongoDB conectado');
}

const oid = (id) => new mongoose.Types.ObjectId(id);

const SEED_DATE = new Date('2026-10-16T10:00:00Z');

const hosts = [
  {
    _id: oid('665a1b2c3d4e5f60718293b5'),
    name: 'Trail Muntanya SCCP',
    description: 'Organizadores de carreras de montaña',
    slug: 'trail-muntanya-sccp',
    contactEmail: 'info@trailmuntanya.com',
    website: 'https://trailmuntanya.com',
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  }
];

const categories = [
  {
    _id: oid('665a1b2c3d4e5f60718293c6'),
    name: 'Ultra Trail',
    slug: 'ultra-trail',
    description: 'Carreras de más de 42 km',
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293c7'),
    name: 'Trail',
    slug: 'trail',
    description: 'Carreras entre 21 y 42 km',
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  }
];

const locations = [
  {
    _id: oid('665a1b2c3d4e5f60718293d7'),
    name: 'Vall de Boí',
    slug: 'vall-de-boi',
    city: 'La Taüll',
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293d8'),
    name: 'Cadí-Moixeró',
    slug: 'cadi-moixero',
    city: "La Seu d'Urgell",
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293d9'),
    name: 'Chamonix',
    slug: 'chamonix',
    city: 'Chamonix',
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293da'),
    name: 'Courmayeur',
    slug: 'courmayeur',
    city: 'Courmayeur',
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293db'),
    name: 'Zegama',
    slug: 'zegama',
    city: 'Zegama',
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293dc'),
    name: 'Zinal',
    slug: 'zinal',
    city: 'Zinal',
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293dd'),
    name: 'Manitou Springs',
    slug: 'manitou-springs',
    city: 'Manitou Springs',
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293de'),
    name: 'Squaw Valley',
    slug: 'squaw-valley',
    city: 'Squaw Valley',
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293df'),
    name: 'Silverton',
    slug: 'silverton',
    city: 'Silverton',
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293e0'),
    name: 'Réunion',
    slug: 'reunion',
    city: 'Saint-Denis',
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  }
];

const events = [
  {
    _id: oid('665a1b2c3d4e5f60718293e8'),
    name: 'Ultra Trail Vall de Boí 2027',
    slug: 'ultra-trail-vall-de-boi-2027',
    description: 'Carrera por los lagos de la Vall de Boí...',
    hostId: oid('665a1b2c3d4e5f60718293b5'),
    categoryId: oid('665a1b2c3d4e5f60718293c6'),
    locationId: oid('665a1b2c3d4e5f60718293d7'),
    startDate: new Date('2027-06-12T07:00:00Z'),
    endDate: new Date('2027-06-12T19:00:00Z'),
    distanceKm: 68.5,
    elevationGain: 4200,
    price: 85.0,
    status: 'published',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293e9'),
    name: 'Trail Cadí-Moixeró 2027',
    slug: 'trail-cadi-moixero-2027',
    description: 'Recorrido por el macizo del Cadí...',
    hostId: oid('665a1b2c3d4e5f60718293b5'),
    categoryId: oid('665a1b2c3d4e5f60718293c7'),
    locationId: oid('665a1b2c3d4e5f60718293d8'),
    startDate: new Date('2027-05-20T08:00:00Z'),
    endDate: new Date('2027-05-20T16:00:00Z'),
    distanceKm: 32.0,
    elevationGain: 2100,
    price: 55.0,
    status: 'draft',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293ea'),
    name: 'OCC Orsières-Champex-Chamonix 2027',
    slug: 'occ-2027',
    description: 'Recorrido de 56 km por el corazón del Mont-Blanc, desde Orsières hasta Chamonix pasando por Champex-Lac.',
    hostId: oid('665a1b2c3d4e5f60718293b5'),
    categoryId: oid('665a1b2c3d4e5f60718293c6'),
    locationId: oid('665a1b2c3d4e5f60718293d9'),
    startDate: new Date('2027-08-28T05:00:00Z'),
    endDate: new Date('2027-08-28T18:00:00Z'),
    distanceKm: 56.0,
    elevationGain: 3500,
    price: 120.0,
    status: 'published',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293eb'),
    name: 'CCC Courmayeur-Champex-Chamonix 2027',
    slug: 'ccc-2027',
    description: '101 km desde Courmayeur hasta Chamonix, recorriendo el Val Ferret y Champex-Lac.',
    hostId: oid('665a1b2c3d4e5f60718293b5'),
    categoryId: oid('665a1b2c3d4e5f60718293c6'),
    locationId: oid('665a1b2c3d4e5f60718293da'),
    startDate: new Date('2027-08-28T12:00:00Z'),
    endDate: new Date('2027-08-29T04:00:00Z'),
    distanceKm: 101.0,
    elevationGain: 6100,
    price: 180.0,
    status: 'published',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293ec'),
    name: 'Zegama-Aizkorri 2027',
    slug: 'zegama-aizkorri-2027',
    description: 'Maratón alpina por el macizo de Aizkorri, con 2.700 m de desnivel positivo.',
    hostId: oid('665a1b2c3d4e5f60718293b5'),
    categoryId: oid('665a1b2c3d4e5f60718293c7'),
    locationId: oid('665a1b2c3d4e5f60718293db'),
    startDate: new Date('2027-05-30T08:00:00Z'),
    endDate: new Date('2027-05-30T16:00:00Z'),
    distanceKm: 42.0,
    elevationGain: 2700,
    price: 65.0,
    status: 'published',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293ed'),
    name: 'Sierre-Zinal 2027',
    slug: 'sierre-zinal-2027',
    description: 'Una de las carreras de montaña más antiguas del mundo, desde Sierre hasta Zinal por los Alpes suizos.',
    hostId: oid('665a1b2c3d4e5f60718293b5'),
    categoryId: oid('665a1b2c3d4e5f60718293c7'),
    locationId: oid('665a1b2c3d4e5f60718293dc'),
    startDate: new Date('2027-08-15T07:00:00Z'),
    endDate: new Date('2027-08-15T15:00:00Z'),
    distanceKm: 31.0,
    elevationGain: 2200,
    price: 75.0,
    status: 'published',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293ee'),
    name: 'Pikes Peak Marathon 2027',
    slug: 'pikes-peak-marathon-2027',
    description: 'Maratón alpina que asciende al Pikes Peak en Colorado, desde Manitou Springs hasta la cumbre.',
    hostId: oid('665a1b2c3d4e5f60718293b5'),
    categoryId: oid('665a1b2c3d4e5f60718293c7'),
    locationId: oid('665a1b2c3d4e5f60718293dd'),
    startDate: new Date('2027-09-20T07:00:00Z'),
    endDate: new Date('2027-09-20T15:00:00Z'),
    distanceKm: 42.0,
    elevationGain: 2400,
    price: 95.0,
    status: 'published',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293ef'),
    name: 'Western States 100 2027',
    slug: 'western-states-100-2027',
    description: 'La ultra trail más famosa del mundo, 161 km desde Squaw Valley hasta Auburn.',
    hostId: oid('665a1b2c3d4e5f60718293b5'),
    categoryId: oid('665a1b2c3d4e5f60718293c6'),
    locationId: oid('665a1b2c3d4e5f60718293de'),
    startDate: new Date('2027-06-27T05:00:00Z'),
    endDate: new Date('2027-06-28T11:00:00Z'),
    distanceKm: 161.0,
    elevationGain: 5500,
    price: 350.0,
    status: 'published',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293f0'),
    name: 'Hardrock 100 2027',
    slug: 'hardrock-100-2027',
    description: '161 km por las Montañas Rocosas de Colorado con 10.000 m de desnivel, una de las carreras más duras del mundo.',
    hostId: oid('665a1b2c3d4e5f60718293b5'),
    categoryId: oid('665a1b2c3d4e5f60718293c6'),
    locationId: oid('665a1b2c3d4e5f60718293df'),
    startDate: new Date('2027-07-18T06:00:00Z'),
    endDate: new Date('2027-07-19T18:00:00Z'),
    distanceKm: 161.0,
    elevationGain: 10000,
    price: 400.0,
    status: 'published',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  },
  {
    _id: oid('665a1b2c3d4e5f60718293f1'),
    name: 'Diagonale des Fous 2027',
    slug: 'diagonale-des-fous-2027',
    description: "170 km por la isla de Réunion con 10.000 m de desnivel, apodada la 'Diagonal de los Locos'.",
    hostId: oid('665a1b2c3d4e5f60718293b5'),
    categoryId: oid('665a1b2c3d4e5f60718293c6'),
    locationId: oid('665a1b2c3d4e5f60718293e0'),
    startDate: new Date('2027-10-15T00:00:00Z'),
    endDate: new Date('2027-10-16T12:00:00Z'),
    distanceKm: 170.0,
    elevationGain: 10000,
    price: 250.0,
    status: 'published',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  }
];

const experiences = [
  {
    _id: oid('665a1b2c3d4e5f60718293f9'),
    eventId: oid('665a1b2c3d4e5f60718293e8'),
    name: 'Pack Alojamiento + Carrera',
    slug: 'pack-alojamiento-carrera',
    description: 'Alojamiento noche anterior + carrera',
    status: 'active',
    isActive: true,
    created_At: SEED_DATE,
    updated_at: SEED_DATE,
    deleted_at: null
  }
];

const eventImages = [
  {
    _id: oid('665a1b2c3d4e5f6071829400'),
    eventId: oid('665a1b2c3d4e5f60718293e8'),
    url: 'https://cdn.example.com/events/vall-boi-2027-cover.jpg',
    alt: 'Corredores en el lago de Sant Maurici',
    isCover: true,
    order: 1,
    created_At: SEED_DATE,
    updated_at: SEED_DATE
  },
  {
    _id: oid('665a1b2c3d4e5f6071829401'),
    eventId: oid('665a1b2c3d4e5f60718293e8'),
    url: 'https://cdn.example.com/events/vall-boi-2027-gallery.jpg',
    alt: 'Vista panorámica de la Vall de Boí',
    isCover: false,
    order: 2,
    created_At: SEED_DATE,
    updated_at: SEED_DATE
  }
];

const experienceImages = [
  {
    _id: oid('665a1b2c3d4e5f6071829411'),
    experienceId: oid('665a1b2c3d4e5f60718293f9'),
    url: 'https://cdn.example.com/experiences/pack-alojamiento.jpg',
    alt: 'Hotel junto a la salida de la carrera',
    isCover: true,
    order: 1,
    created_At: SEED_DATE,
    updated_at: SEED_DATE
  }
];

async function seedDatabase() {
  await Host.deleteMany({});
  await Category.deleteMany({});
  await Location.deleteMany({});
  await Event.deleteMany({});

  await Host.insertMany(hosts, { timestamps: false });
  await Category.insertMany(categories, { timestamps: false });
  await Location.insertMany(locations, { timestamps: false });
  await Event.insertMany(events, { timestamps: false });

  const db = mongoose.connection.db;
  await db.collection('experiences').deleteMany({});
  await db.collection('event_images').deleteMany({});
  await db.collection('experience_images').deleteMany({});
  await db.collection('experiences').insertMany(experiences);
  await db.collection('event_images').insertMany(eventImages);
  await db.collection('experience_images').insertMany(experienceImages);

  await db.collection('experiences').createIndex({ eventId: 1 });
  await db.collection('experiences').createIndex({ slug: 1 }, { unique: true, partialFilterExpression: { deleted_at: null } });
  await db.collection('event_images').createIndex({ eventId: 1, order: 1 });
  await db.collection('event_images').createIndex({ eventId: 1, isCover: 1 });
  await db.collection('experience_images').createIndex({ experienceId: 1, order: 1 });
  await db.collection('experience_images').createIndex({ experienceId: 1, isCover: 1 });

  return {
    hosts: hosts.length,
    categories: categories.length,
    locations: locations.length,
    events: events.length,
    experiences: experiences.length,
    event_images: eventImages.length,
    experience_images: experienceImages.length
  };
}

module.exports = { connectDatabase, seedDatabase };

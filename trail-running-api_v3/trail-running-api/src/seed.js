require('dotenv').config();

const { connectDatabase, seedDatabase } = require('./config/database');

async function seed() {
  await connectDatabase();
  const summary = await seedDatabase();
  console.log('Seed completado:', summary);
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});

import dotenv from 'dotenv'
import { connectToDatabase } from '../utils/db.js'
import { User } from '../models/User.js'
import { Product } from '../models/Product.js'

dotenv.config()

async function run() {
  // Never seed a production database.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run the seed script with NODE_ENV=production')
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL
  const adminPassword = process.env.SEED_ADMIN_PASSWORD

  await connectToDatabase()

  // Admin user (only when credentials are given explicitly, never a default).
  if (adminEmail && adminPassword && adminPassword.length >= 12) {
    const existing = await User.findOne({ email: adminEmail.toLowerCase() })
    if (!existing) {
      const passwordHash = await User.hashPassword(adminPassword)
      await User.create({ email: adminEmail.toLowerCase(), name: 'Admin', passwordHash, role: 'admin' })
      console.log(`Created admin user: ${adminEmail}`)
    } else {
      console.log('Admin user already exists')
    }
  } else {
    console.log('Skipping admin user (set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD, 12+ chars)')
  }

  // Products
  const count = await Product.countDocuments()
  if (count === 0) {
    await Product.insertMany([
      {
        title: 'Minimalist Tee',
        description: 'Super soft cotton tee in a modern cut.',
        price: 24.0,
        images: ['https://images.unsplash.com/photo-1520975693411-b39e99f0725f?q=80&w=800&auto=format&fit=crop'],
        inventory: 100,
        tags: ['apparel']
      },
      {
        title: 'Everyday Hoodie',
        description: 'Cozy fleece hoodie for all seasons.',
        price: 59.0,
        images: ['https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop'],
        inventory: 50,
        tags: ['apparel']
      },
      {
        title: 'Canvas Tote',
        description: 'Durable, eco-friendly tote bag.',
        price: 18.5,
        images: ['https://images.unsplash.com/photo-1547949003-9792a18a2601?q=80&w=800&auto=format&fit=crop'],
        inventory: 200,
        tags: ['accessories']
      }
    ])
    console.log('Seeded demo products')
  } else {
    console.log('Products already seeded')
  }

  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})



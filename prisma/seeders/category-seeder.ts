import 'dotenv/config';
import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const electronicDeviceCategories = [
  // Main Categories
  {
    name: 'Computers & Laptops',
    slug: 'computers-laptops',
    description: 'Desktop computers, laptops, and computer accessories',
    icon: '💻'
  },
  {
    name: 'Smartphones & Tablets',
    slug: 'smartphones-tablets',
    description: 'Mobile phones, tablets, and accessories',
    icon: '📱'
  },
  {
    name: 'Televisions & Home Entertainment',
    slug: 'televisions-home-entertainment',
    description: 'TVs, sound systems, gaming consoles, and streaming devices',
    icon: '📺'
  },
  {
    name: 'Audio & Headphones',
    slug: 'audio-headphones',
    description: 'Headphones, speakers, audio equipment, and music accessories',
    icon: '🎧'
  },
  {
    name: 'Cameras & Photography',
    slug: 'cameras-photography',
    description: 'Digital cameras, DSLRs, mirrorless cameras, and photography equipment',
    icon: '📷'
  },
  {
    name: 'Smart Home & IoT',
    slug: 'smart-home-iot',
    description: 'Smart speakers, home automation, security cameras, and IoT devices',
    icon: '🏠'
  },
  {
    name: 'Wearables & Smartwatches',
    slug: 'wearables-smartwatches',
    description: 'Smartwatches, fitness trackers, and wearable technology',
    icon: '⌚'
  },
  {
    name: 'Gaming & Consoles',
    slug: 'gaming-consoles',
    description: 'Gaming consoles, gaming PCs, gaming chairs, and gaming accessories',
    icon: '🎮'
  },
  {
    name: 'Computer Components',
    slug: 'computer-components',
    description: 'CPUs, GPUs, motherboards, RAM, storage, and PC components',
    icon: '🔧'
  },
  {
    name: 'Networking & WiFi',
    slug: 'networking-wifi',
    description: 'Routers, switches, network cables, and networking equipment',
    icon: '🌐'
  },
  {
    name: 'Printers & Office Equipment',
    slug: 'printers-office-equipment',
    description: 'Printers, scanners, office supplies, and business equipment',
    icon: '🖨️'
  },
  {
    name: 'Cables & Accessories',
    slug: 'cables-accessories',
    description: 'USB cables, power adapters, cases, and electronic accessories',
    icon: '🔌'
  },
  {
    name: 'Power & Batteries',
    slug: 'power-batteries',
    description: 'Power banks, chargers, batteries, and power accessories',
    icon: '🔋'
  },
  {
    name: 'Storage & Memory',
    slug: 'storage-memory',
    description: 'USB drives, external storage, memory cards, and storage solutions',
    icon: '💾'
  },
  {
    name: 'Monitors & Displays',
    slug: 'monitors-displays',
    description: 'Computer monitors, display adapters, and screen accessories',
    icon: '🖥️'
  },
  {
    name: 'Keyboards & Mice',
    slug: 'keyboards-mice',
    description: 'Computer keyboards, mice, input devices, and ergonomic accessories',
    icon: '⌨️'
  },
  {
    name: 'Software & Digital',
    slug: 'software-digital',
    description: 'Operating systems, productivity software, antivirus, and digital products',
    icon: '💿'
  },
  {
    name: 'Drones & RC',
    slug: 'drones-rc',
    description: 'Drones, remote control toys, and aerial photography equipment',
    icon: '🚁'
  },
  {
    name: 'Car Electronics',
    slug: 'car-electronics',
    description: 'Car audio, GPS devices, dash cams, and automotive electronics',
    icon: '🚗'
  },
  {
    name: 'Health & Fitness Tech',
    slug: 'health-fitness-tech',
    description: 'Fitness trackers, health monitors, smart scales, and wellness devices',
    icon: '❤️'
  },
  {
    name: 'Electronic Kits & DIY',
    slug: 'electronic-kits-diy',
    description: 'Electronic kits, development boards, tools, and DIY electronics',
    icon: '⚡'
  }
];

const subCategories = {
  'computers-laptops': [
    { name: 'Laptops', slug: 'laptops' },
    { name: 'Desktop PCs', slug: 'desktop-pcs' },
    { name: 'Gaming Laptops', slug: 'gaming-laptops' },
    { name: 'Workstations', slug: 'workstations' },
    { name: 'Computer Accessories', slug: 'computer-accessories' },
    { name: 'Monitors', slug: 'monitors' },
    { name: 'Keyboards & Mice', slug: 'keyboards-mice-pc' }
  ],
  'smartphones-tablets': [
    { name: 'Smartphones', slug: 'smartphones' },
    { name: 'Tablets', slug: 'tablets' },
    { name: 'Phone Cases', slug: 'phone-cases' },
    { name: 'Chargers & Cables', slug: 'chargers-cables-phone' },
    { name: 'Screen Protectors', slug: 'screen-protectors' },
    { name: 'Mobile Accessories', slug: 'mobile-accessories' }
  ],
  'televisions-home-entertainment': [
    { name: 'LED TVs', slug: 'led-tvs' },
    { name: 'OLED TVs', slug: 'oled-tvs' },
    { name: 'Smart TVs', slug: 'smart-tvs' },
    { name: 'Sound Bars', slug: 'sound-bars' },
    { name: 'Gaming Consoles', slug: 'gaming-consoles-home' },
    { name: 'Streaming Devices', slug: 'streaming-devices' }
  ],
  'audio-headphones': [
    { name: 'Headphones', slug: 'headphones' },
    { name: 'Earbuds', slug: 'earbuds' },
    { name: 'Speakers', slug: 'speakers' },
    { name: 'Audio Systems', slug: 'audio-systems' },
    { name: 'Microphones', slug: 'microphones' },
    { name: 'Audio Accessories', slug: 'audio-accessories' }
  ],
  'cameras-photography': [
    { name: 'DSLR Cameras', slug: 'dslr-cameras' },
    { name: 'Mirrorless Cameras', slug: 'mirrorless-cameras' },
    { name: 'Action Cameras', slug: 'action-cameras' },
    { name: 'Lenses', slug: 'lenses' },
    { name: 'Tripods & Supports', slug: 'tripods-supports' },
    { name: 'Camera Accessories', slug: 'camera-accessories' }
  ],
  'smart-home-iot': [
    { name: 'Smart Speakers', slug: 'smart-speakers' },
    { name: 'Smart Lighting', slug: 'smart-lighting' },
    { name: 'Security Cameras', slug: 'security-cameras' },
    { name: 'Smart Thermostats', slug: 'smart-thermostats' },
    { name: 'Home Automation', slug: 'home-automation' }
  ],
  'wearables-smartwatches': [
    { name: 'Smartwatches', slug: 'smartwatches' },
    { name: 'Fitness Trackers', slug: 'fitness-trackers' },
    { name: 'Smart Rings', slug: 'smart-rings' },
    { name: 'VR/AR Headsets', slug: 'vr-ar-headsets' }
  ],
  'gaming-consoles': [
    { name: 'PlayStation', slug: 'playstation' },
    { name: 'Xbox', slug: 'xbox' },
    { name: 'Nintendo', slug: 'nintendo' },
    { name: 'Gaming PCs', slug: 'gaming-pcs' },
    { name: 'Gaming Chairs', slug: 'gaming-chairs' }
  ],
  'computer-components': [
    { name: 'Graphics Cards', slug: 'graphics-cards' },
    { name: 'Processors (CPUs)', slug: 'processors' },
    { name: 'Motherboards', slug: 'motherboards' },
    { name: 'RAM & Memory', slug: 'ram-memory' },
    { name: 'Storage (SSD/HDD)', slug: 'storage-drives' },
    { name: 'Power Supplies', slug: 'power-supplies' },
    { name: 'Cooling Systems', slug: 'cooling-systems' }
  ],
  'networking-wifi': [
    { name: 'Routers', slug: 'routers' },
    { name: 'Network Switches', slug: 'network-switches' },
    { name: 'WiFi Extenders', slug: 'wifi-extenders' },
    { name: 'Network Cables', slug: 'network-cables' },
    { name: 'Modems & Gateways', slug: 'modems-gateways' }
  ],
  'printers-office-equipment': [
    { name: 'Inkjet Printers', slug: 'inkjet-printers' },
    { name: 'Laser Printers', slug: 'laser-printers' },
    { name: 'All-in-One Printers', slug: 'all-in-one-printers' },
    { name: 'Scanners', slug: 'scanners' },
    { name: 'Office Supplies', slug: 'office-supplies' }
  ],
  'cables-accessories': [
    { name: 'USB Cables', slug: 'usb-cables' },
    { name: 'HDMI Cables', slug: 'hdmi-cables' },
    { name: 'Power Cables', slug: 'power-cables' },
    { name: 'Adapters & Converters', slug: 'adapters-converters' },
    { name: 'Cases & Bags', slug: 'cases-bags' }
  ],
  'power-batteries': [
    { name: 'Power Banks', slug: 'power-banks' },
    { name: 'Phone Chargers', slug: 'phone-chargers' },
    { name: 'Laptop Chargers', slug: 'laptop-chargers' },
    { name: 'Rechargeable Batteries', slug: 'rechargeable-batteries' },
    { name: 'Battery Chargers', slug: 'battery-chargers' }
  ],
  'storage-memory': [
    { name: 'USB Flash Drives', slug: 'usb-flash-drives' },
    { name: 'External Hard Drives', slug: 'external-hard-drives' },
    { name: 'SSD External Storage', slug: 'ssd-external-storage' },
    { name: 'Memory Cards', slug: 'memory-cards' },
    { name: 'Cloud Storage', slug: 'cloud-storage' }
  ],
  'monitors-displays': [
    { name: 'Gaming Monitors', slug: 'gaming-monitors' },
    { name: '4K Monitors', slug: '4k-monitors' },
    { name: 'Ultrawide Monitors', slug: 'ultrawide-monitors' },
    { name: 'Portable Monitors', slug: 'portable-monitors' },
    { name: 'Monitor Accessories', slug: 'monitor-accessories' }
  ],
  'keyboards-mice': [
    { name: 'Mechanical Keyboards', slug: 'mechanical-keyboards' },
    { name: 'Gaming Keyboards', slug: 'gaming-keyboards' },
    { name: 'Wireless Mice', slug: 'wireless-mice' },
    { name: 'Gaming Mice', slug: 'gaming-mice' },
    { name: 'Input Devices', slug: 'input-devices' }
  ],
  'software-digital': [
    { name: 'Operating Systems', slug: 'operating-systems' },
    { name: 'Office Software', slug: 'office-software' },
    { name: 'Antivirus & Security', slug: 'antivirus-security' },
    { name: 'Creative Software', slug: 'creative-software' },
    { name: 'Digital Services', slug: 'digital-services' }
  ],
  'drones-rc': [
    { name: 'Camera Drones', slug: 'camera-drones' },
    { name: 'Racing Drones', slug: 'racing-drones' },
    { name: 'Toy Drones', slug: 'toy-drones' },
    { name: 'Drone Accessories', slug: 'drone-accessories' },
    { name: 'RC Vehicles', slug: 'rc-vehicles' }
  ],
  'car-electronics': [
    { name: 'Car Audio Systems', slug: 'car-audio-systems' },
    { name: 'GPS Navigation', slug: 'gps-navigation' },
    { name: 'Dash Cams', slug: 'dash-cams' },
    { name: 'Car Chargers', slug: 'car-chargers' },
    { name: 'Automotive Electronics', slug: 'automotive-electronics' }
  ],
  'health-fitness-tech': [
    { name: 'Fitness Bands', slug: 'fitness-bands' },
    { name: 'Smart Scales', slug: 'smart-scales' },
    { name: 'Health Monitors', slug: 'health-monitors' },
    { name: 'Sports Tech', slug: 'sports-tech' },
    { name: 'Wellness Devices', slug: 'wellness-devices' }
  ],
  'electronic-kits-diy': [
    { name: 'Arduino Kits', slug: 'arduino-kits' },
    { name: 'Raspberry Pi Kits', slug: 'raspberry-pi-kits' },
    { name: 'Electronic Components', slug: 'electronic-components' },
    { name: 'DIY Tools', slug: 'diy-tools' },
    { name: 'Development Boards', slug: 'development-boards' }
  ]
};

export async function seedCategories() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('🌱 Starting category seeding...');

    // Create main categories first
    const createdCategories = new Map<string, string>();

    for (const category of electronicDeviceCategories) {
      console.log(`📁 Creating main category: ${category.name}`);

      const createdCategory = await prisma.category.upsert({
        where: { slug: category.slug },
        update: { name: category.name },
        create: {
          name: category.name,
          slug: category.slug,
        },
      });

      createdCategories.set(category.slug, createdCategory.id);
      console.log(`✅ Upserted category: ${category.name} (ID: ${createdCategory.id})`);

      // Create subcategories
      const categorySubCategories = subCategories[category.slug as keyof typeof subCategories];
      if (categorySubCategories) {
        for (const subCat of categorySubCategories) {
          console.log(`  📂 Creating subcategory: ${subCat.name}`);

          await prisma.category.upsert({
            where: { slug: subCat.slug },
            update: { name: subCat.name },
            create: {
              name: subCat.name,
              slug: subCat.slug,
              parent: {
                connect: { id: createdCategory.id }
              },
            },
          });

          console.log(`  ✅ Upserted subcategory: ${subCat.name}`);
        }
      }
    }

    console.log(`🎉 Successfully created ${electronicDeviceCategories.length} main categories with ${Object.values(subCategories).flat().length} subcategories`);
    console.log(`📊 Total categories created: ${electronicDeviceCategories.length + Object.values(subCategories).flat().length}`);

    return {
      mainCategories: electronicDeviceCategories.length,
      subCategories: Object.values(subCategories).flat().length,
      total: electronicDeviceCategories.length + Object.values(subCategories).flat().length
    };

  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedCategories()
    .then((result) => {
      console.log('\n📈 Seeding Summary:');
      console.log(`   Main Categories: ${result.mainCategories}`);
      console.log(`   Subcategories: ${result.subCategories}`);
      console.log(`   Total Categories: ${result.total}`);
      console.log('\n🎊 Category seeding completed successfully!');
    })
    .catch((error) => {
      console.error('💥 Category seeding failed:', error);
      process.exit(1);
    });
}

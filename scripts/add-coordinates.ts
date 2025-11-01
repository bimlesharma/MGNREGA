import dotenv from 'dotenv';
import { resolve } from 'path';
import mongoose from 'mongoose';
import { Schema } from 'mongoose';

// Load environment variables
const envLocalPath = resolve(process.cwd(), '.env.local');
const envPath = resolve(process.cwd(), '.env');
dotenv.config({ path: envLocalPath });
dotenv.config({ path: envPath });

// Define District model directly in this script to avoid import issues
interface IDistrict {
  districtCode: string;
  districtName: string;
  stateCode: string;
  stateName: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

const DistrictSchema = new Schema<IDistrict>(
  {
    districtCode: { type: String, required: true, unique: true, index: true },
    districtName: { type: String, required: true, index: true },
    stateCode: { type: String, required: true, index: true },
    stateName: { type: String, required: true, index: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { timestamps: true }
);

// Connect to MongoDB directly
const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mgnrega';
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Use the model
const District = mongoose.models.District || mongoose.model<IDistrict>('District', DistrictSchema);

// Basic district coordinates for major Indian districts
const districtCoordinates: Record<string, { lat: number; lng: number }> = {
  // Major cities/districts
  "AHMEDNAGAR": { lat: 19.0948, lng: 74.7480 },
  "AMRITSAR": { lat: 31.6340, lng: 74.8723 },
  "BANGALORE": { lat: 12.9716, lng: 77.5946 },
  "CHENNAI": { lat: 13.0827, lng: 80.2707 },
  "DELHI": { lat: 28.7041, lng: 77.1025 },
  "HYDERABAD": { lat: 17.3850, lng: 78.4867 },
  "JAIPUR": { lat: 26.9124, lng: 75.7873 },
  "KOLKATA": { lat: 22.5726, lng: 88.3639 },
  "LUCKNOW": { lat: 26.8467, lng: 80.9462 },
  "MUMBAI": { lat: 19.0760, lng: 72.8777 },
  "PUNE": { lat: 18.5204, lng: 73.8567 },
  "AGRA": { lat: 27.1767, lng: 78.0081 },
  "AHMEDABAD": { lat: 23.0225, lng: 72.5714 },
  "ALLAHABAD": { lat: 25.4358, lng: 81.8463 },
  "BHOPAL": { lat: 23.2599, lng: 77.4126 },
  "CHANDIGARH": { lat: 30.7333, lng: 76.7794 },
  "COIMBATORE": { lat: 11.0168, lng: 76.9558 },
  "DEHRADUN": { lat: 30.3165, lng: 78.0322 },
  "GUWAHATI": { lat: 26.1445, lng: 91.7362 },
  "INDORE": { lat: 22.7196, lng: 75.8577 },
  "KANPUR": { lat: 26.4499, lng: 80.3319 },
  "KOCHI": { lat: 9.9312, lng: 76.2673 },
  "NAGPUR": { lat: 21.1458, lng: 79.0882 },
  "PATNA": { lat: 25.5941, lng: 85.1376 },
  "SURAT": { lat: 21.1702, lng: 72.8311 },
  "THIRUVANANTHAPURAM": { lat: 8.5241, lng: 76.9366 },
  "VADODARA": { lat: 22.3072, lng: 73.1812 },
  "VARANASI": { lat: 25.3176, lng: 82.9739 },
  "VISAKHAPATNAM": { lat: 17.6868, lng: 83.2185 },
  "BHUBANESWAR": { lat: 20.2961, lng: 85.8245 },
  "RAIPUR": { lat: 21.2514, lng: 81.6296 },
  "RANCHI": { lat: 23.3441, lng: 85.3096 },
  "SHIMLA": { lat: 31.1048, lng: 77.1734 },
  "SRINAGAR": { lat: 34.0837, lng: 74.7973 },
  "GURGAON": { lat: 28.4595, lng: 77.0266 },
  "NOIDA": { lat: 28.5355, lng: 77.3910 },
  "GHAZIABAD": { lat: 28.6692, lng: 77.4538 },
  "FARIDABAD": { lat: 28.4089, lng: 77.3178 },
  "MEERUT": { lat: 28.9845, lng: 77.7064 },
  "NASHIK": { lat: 19.9975, lng: 73.7898 },
  "PANAJI": { lat: 15.4909, lng: 73.8278 },
  "GANDHINAGAR": { lat: 23.2156, lng: 72.6369 },
  "IMPHAL": { lat: 24.8170, lng: 93.9368 },
  "SHILLONG": { lat: 25.5788, lng: 91.8933 },
  "AIZAWL": { lat: 23.7271, lng: 92.7176 },
  "KOHIMA": { lat: 25.6751, lng: 94.1086 },
  "ITANAGAR": { lat: 27.0844, lng: 93.6053 },
  "GANGTOK": { lat: 27.3389, lng: 88.6065 },
  "PORT BLAIR": { lat: 11.6234, lng: 92.7265 },
  "SILVASSA": { lat: 20.2766, lng: 73.0108 },
  "DAMAN": { lat: 20.3974, lng: 72.8328 },
  "KAVARATTI": { lat: 10.5593, lng: 72.6358 }
};

async function addCoordinates() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    const districts = await District.find({});
    console.log(`Found ${districts.length} districts`);

    let updated = 0;
    for (const district of districts) {
      // If district already has coordinates, skip
      if (district.coordinates && district.coordinates.lat && district.coordinates.lng) {
        continue;
      }

      // Try to find coordinates in our mapping with different name variations
      const districtName = district.districtName.toUpperCase().trim();
      const districtCode = district.districtCode;
      
      // Try exact matches first
      let coords = districtCoordinates[districtCode] || districtCoordinates[districtName];
      
      // If no exact match, try partial matches
      if (!coords) {
        // Find keys that contain the district name
        const matchingKey = Object.keys(districtCoordinates).find(key => 
          districtName.includes(key) || key.includes(districtName)
        );
        
        if (matchingKey) {
          coords = districtCoordinates[matchingKey];
        }
      }
      
      // If still no match, use a default coordinate for India to at least show something on the map
      if (!coords && !district.coordinates) {
        // Default to center of India if no match found
        coords = { lat: 20.5937, lng: 78.9629 };
        console.log(`Using default India coordinates for ${district.districtName}`);
      }

      if (coords) {
        district.coordinates = coords;
        await district.save();
        updated++;
        console.log(`Updated coordinates for ${district.districtName}`);
      }
    }

    console.log(`Updated ${updated} districts with coordinates`);
    console.log('\nNote: For remaining districts, you can:');
    console.log('1. Use a geocoding API (Google Maps, OpenStreetMap)');
    console.log('2. Manually add coordinates to the database');
    console.log('3. Use the district name to lookup coordinates online');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addCoordinates();

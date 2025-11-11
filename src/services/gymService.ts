// Gym Service - Handles gym data and filtering logic

export interface GymLocation {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    country: 'Sri Lanka' | 'Dubai' | 'Australia';
    state?: string; // For Australia
}

export interface Gym {
    id: string;
    name: string;
    description: string;
    facilities: string[];
    rating: number;
    reviewCount: number;
    priceRange: '$' | '$$' | '$$$' | '$$$$';
    pricePerMonth: number;
    image: string;
    images: string[];
    location: GymLocation;
    openingHours: string;
    phoneNumber: string;
    website?: string;
    membershipTypes: string[];
    distance?: string; // Calculated based on user location
}

//  gym data for Sri Lanka, Dubai, and Australia
export const GYM_DATABASE: Gym[] = [
    //srilanka gyms
    {
        id: 'sl-001',
        name: 'Fitness First - Colombo City Centre',
        description: 'Premium fitness center with state-of-the-art equipment, personal training, and group classes in the heart of Colombo.',
        facilities: ['parking', 'wifi', 'shower', 'locker', 'trainer', 'pool', 'sauna', 'cafe'],
        rating: 4.7,
        reviewCount: 245,
        priceRange: '$$$',
        pricePerMonth: 12000, // LKR
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1558017487-06bf9f82613a?w=800&h=600&fit=crop'
        ],
        location: {
            latitude: 6.9271,
            longitude: 79.8612,
            address: 'Colombo City Centre, Colombo 02',
            city: 'Colombo',
            country: 'Sri Lanka'
        },
        openingHours: '5:00 AM - 11:00 PM',
        phoneNumber: '+94 11 234 5678',
        website: 'https://fitnessfirst.lk',
        membershipTypes: ['Monthly', '3 Months', '6 Months', 'Annual']
    },
    {
        id: 'sl-002',
        name: 'Gold\'s Gym - Nugegoda',
        description: 'World-class gym with Olympic equipment, cardio zones, and certified trainers. Perfect for bodybuilding and strength training.',
        facilities: ['parking', 'wifi', 'shower', 'locker', 'trainer', 'supplement'],
        rating: 4.6,
        reviewCount: 189,
        priceRange: '$$',
        pricePerMonth: 8500, // LKR
        image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=600&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=600&fit=crop'
        ],
        location: {
            latitude: 6.8649,
            longitude: 79.8997,
            address: 'High Level Road, Nugegoda',
            city: 'Nugegoda',
            country: 'Sri Lanka'
        },
        openingHours: '6:00 AM - 10:00 PM',
        phoneNumber: '+94 11 289 4567',
        membershipTypes: ['Monthly', 'Quarterly', 'Annual']
    },
    {
        id: 'sl-003',
        name: 'Life Fitness - Rajagiriya',
        description: 'Modern fitness studio with CrossFit boxes, spinning classes, and yoga sessions. Community-focused environment.',
        facilities: ['parking', 'wifi', 'shower', 'locker', 'trainer', 'yoga', 'crossfit'],
        rating: 4.8,
        reviewCount: 312,
        priceRange: '$$',
        pricePerMonth: 9500, // LKR
        image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=600&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1623874228601-f4193c7b1818?w=800&h=600&fit=crop'
        ],
        location: {
            latitude: 6.9147,
            longitude: 79.8910,
            address: 'Kotte Road, Rajagiriya',
            city: 'Rajagiriya',
            country: 'Sri Lanka'
        },
        openingHours: '5:30 AM - 10:30 PM',
        phoneNumber: '+94 11 278 9012',
        membershipTypes: ['Monthly', '6 Months', 'Annual']
    },
    {
        id: 'sl-004',
        name: 'Anytime Fitness - Dehiwala',
        description: '24/7 gym access with modern equipment and personalized training programs. Part of the global Anytime Fitness network.',
        facilities: ['parking', 'wifi', 'shower', 'locker', 'trainer', '24hours'],
        rating: 4.5,
        reviewCount: 156,
        priceRange: '$$',
        pricePerMonth: 7500, // LKR
        image: 'https://images.unsplash.com/photo-1623874228601-f4193c7b1818?w=800&h=600&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1623874228601-f4193c7b1818?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop'
        ],
        location: {
            latitude: 6.8562,
            longitude: 79.8631,
            address: 'Galle Road, Dehiwala',
            city: 'Dehiwala',
            country: 'Sri Lanka'
        },
        openingHours: '24 Hours',
        phoneNumber: '+94 11 271 2345',
        membershipTypes: ['Monthly', 'Annual']
    },
    {
        id: 'sl-005',
        name: 'Power Zone Fitness - Kandy',
        description: 'Comprehensive fitness center in Kandy with strength training, cardio equipment, and group fitness classes.',
        facilities: ['parking', 'shower', 'locker', 'trainer', 'zumba'],
        rating: 4.4,
        reviewCount: 98,
        priceRange: '$',
        pricePerMonth: 5500, // LKR
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop'
        ],
        location: {
            latitude: 7.2906,
            longitude: 80.6337,
            address: 'Peradeniya Road, Kandy',
            city: 'Kandy',
            country: 'Sri Lanka'
        },
        openingHours: '6:00 AM - 9:00 PM',
        phoneNumber: '+94 81 223 4567',
        membershipTypes: ['Monthly', 'Quarterly']
    },

    // dubai
    {
        id: 'db-001',
        name: 'Fitness First - Dubai Mall',
        description: 'Luxury gym in Dubai Mall with panoramic city views, premium equipment, spa facilities, and celebrity trainers.',
        facilities: ['parking', 'wifi', 'shower', 'locker', 'trainer', 'pool', 'sauna', 'spa', 'cafe'],
        rating: 4.9,
        reviewCount: 567,
        priceRange: '$$$$',
        pricePerMonth: 650, // AED
        image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=600&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop'
        ],
        location: {
            latitude: 25.1972,
            longitude: 55.2744,
            address: 'Dubai Mall, Downtown Dubai',
            city: 'Dubai',
            country: 'Dubai'
        },
        openingHours: '6:00 AM - 12:00 AM',
        phoneNumber: '+971 4 339 8877',
        website: 'https://fitnessfirstme.com',
        membershipTypes: ['Monthly', 'Quarterly', 'Annual', 'Platinum']
    },
    {
        id: 'db-002',
        name: 'Gold\'s Gym - Marina',
        description: 'Iconic gym brand in Dubai Marina with cutting-edge equipment, Olympic lifting area, and stunning views.',
        facilities: ['parking', 'wifi', 'shower', 'locker', 'trainer', 'pool', 'supplement'],
        rating: 4.7,
        reviewCount: 423,
        priceRange: '$$$',
        pricePerMonth: 550, // AED
        image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=600&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=600&fit=crop'
        ],
        location: {
            latitude: 25.0785,
            longitude: 55.1382,
            address: 'Dubai Marina Walk',
            city: 'Dubai',
            country: 'Dubai'
        },
        openingHours: '5:00 AM - 11:00 PM',
        phoneNumber: '+971 4 423 8899',
        membershipTypes: ['Monthly', 'Semi-Annual', 'Annual']
    },
    {
        id: 'db-003',
        name: 'CrossFit Box - Business Bay',
        description: 'Premier CrossFit facility with expert coaches, competition training, and nutrition guidance.',
        facilities: ['parking', 'wifi', 'shower', 'locker', 'trainer', 'crossfit', 'nutrition'],
        rating: 4.8,
        reviewCount: 289,
        priceRange: '$$$',
        pricePerMonth: 600, // AED
        image: 'https://images.unsplash.com/photo-1623874228601-f4193c7b1818?w=800&h=600&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1623874228601-f4193c7b1818?w=800&h=600&fit=crop'
        ],
        location: {
            latitude: 25.1864,
            longitude: 55.2662,
            address: 'Business Bay, Dubai',
            city: 'Dubai',
            country: 'Dubai'
        },
        openingHours: '5:30 AM - 10:00 PM',
        phoneNumber: '+971 4 567 8900',
        membershipTypes: ['Monthly', 'Quarterly', 'Drop-in']
    },

    // australia
    {
        id: 'au-001',
        name: 'Fitness First - Sydney CBD',
        description: 'Premier fitness club in Sydney CBD with rooftop pool, group classes, and personal training services.',
        facilities: ['parking', 'wifi', 'shower', 'locker', 'trainer', 'pool', 'sauna', 'cafe', 'yoga'],
        rating: 4.6,
        reviewCount: 534,
        priceRange: '$$$',
        pricePerMonth: 89, // AUD
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=600&fit=crop'
        ],
        location: {
            latitude: -33.8688,
            longitude: 151.2093,
            address: '123 George Street, Sydney',
            city: 'Sydney',
            country: 'Australia',
            state: 'NSW'
        },
        openingHours: '5:00 AM - 11:00 PM',
        phoneNumber: '+61 2 9876 5432',
        website: 'https://fitnessfirst.com.au',
        membershipTypes: ['Monthly', 'Fortnightly', 'Annual']
    },
    {
        id: 'au-002',
        name: 'F45 Training - Melbourne',
        description: 'Innovative 45-minute HIIT workouts with functional training. Popular Australian fitness concept.',
        facilities: ['wifi', 'shower', 'locker', 'trainer', 'hiit'],
        rating: 4.9,
        reviewCount: 687,
        priceRange: '$$',
        pricePerMonth: 65, // AUD
        image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=600&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=600&fit=crop'
        ],
        location: {
            latitude: -37.8136,
            longitude: 144.9631,
            address: 'Collins Street, Melbourne',
            city: 'Melbourne',
            country: 'Australia',
            state: 'VIC'
        },
        openingHours: '5:00 AM - 8:00 PM',
        phoneNumber: '+61 3 9012 3456',
        website: 'https://f45training.com',
        membershipTypes: ['Monthly', 'Unlimited', '3x per week']
    },
    {
        id: 'au-003',
        name: 'Anytime Fitness - Brisbane',
        description: '24/7 access gym with modern equipment, group classes, and nationwide access to all Anytime Fitness locations.',
        facilities: ['parking', 'wifi', 'shower', 'locker', 'trainer', '24hours'],
        rating: 4.5,
        reviewCount: 345,
        priceRange: '$$',
        pricePerMonth: 70, // AUD
        image: 'https://images.unsplash.com/photo-1623874228601-f4193c7b1818?w=800&h=600&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1623874228601-f4193c7b1818?w=800&h=600&fit=crop'
        ],
        location: {
            latitude: -27.4698,
            longitude: 153.0251,
            address: 'Queen Street Mall, Brisbane',
            city: 'Brisbane',
            country: 'Australia',
            state: 'QLD'
        },
        openingHours: '24 Hours',
        phoneNumber: '+61 7 3234 5678',
        membershipTypes: ['Fortnightly', 'Monthly']
    },
    {
        id: 'au-004',
        name: 'Jetts Fitness - Perth',
        description: 'Budget-friendly 24/7 gym with quality equipment and friendly staff. Great value for money.',
        facilities: ['parking', 'wifi', 'shower', 'locker', '24hours'],
        rating: 4.3,
        reviewCount: 234,
        priceRange: '$',
        pricePerMonth: 45, // AUD
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop',
        images: [
            'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop'
        ],
        location: {
            latitude: -31.9505,
            longitude: 115.8605,
            address: 'Murray Street, Perth',
            city: 'Perth',
            country: 'Australia',
            state: 'WA'
        },
        openingHours: '24 Hours',
        phoneNumber: '+61 8 9321 4567',
        membershipTypes: ['Fortnightly', 'Annual']
    }
];

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Radius of the Earth in km (mean radius)

    // Convert degrees to radians
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const lat1Rad = toRad(lat1);
    const lat2Rad = toRad(lat2);

    // Haversine formula
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // For distances under 1km, show in meters with higher precision
    if (distance < 1) {
        return Math.round(distance * 1000) / 1000; // Round to 3 decimal places (1m precision)
    }

    // For 1-10km, show 1 decimal place (100m precision)
    if (distance < 10) {
        return Math.round(distance * 10) / 10;
    }

    // For 10km+, round to nearest km
    return Math.round(distance);
}

export interface GymFilters {
    searchQuery?: string;
    country?: 'Sri Lanka' | 'Dubai' | 'Australia' | 'All';
    city?: string;
    maxDistance?: number; // in km
    facilities?: string[];
    priceRange?: string[]; // ['$', '$$', '$$$', '$$$$']
    minRating?: number;
    userLocation?: {
        latitude: number;
        longitude: number;
    };
}

export function filterGyms(filters: GymFilters): Gym[] {
    let gyms = [...GYM_DATABASE];
    console.log('Starting with', gyms.length, 'gyms');

    // Filter by country
    if (filters.country && filters.country !== 'All') {
        gyms = gyms.filter((gym) => gym.location.country === filters.country);
        console.log('After country filter:', gyms.length, 'gyms');
    }

    // Filter by city
    if (filters.city && filters.city.trim() && filters.city !== 'All') {
        console.log('Filtering by city:', filters.city);
        gyms = gyms.filter((gym) =>
            gym.location.city.toLowerCase() === filters.city!.toLowerCase().trim()
        );
        console.log('After city filter:', gyms.length, 'gyms');
    }

    // Filter by search query (name, description, address)
    if (filters.searchQuery && filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        console.log('Searching for:', query);
        gyms = gyms.filter(
            (gym) =>
                gym.name.toLowerCase().includes(query) ||
                gym.description.toLowerCase().includes(query) ||
                gym.location.address.toLowerCase().includes(query) ||
                gym.location.city.toLowerCase().includes(query)
        );
        console.log('After search filter:', gyms.length, 'gyms');
    }

    // Calculate distance and filter by max distance
    if (filters.userLocation) {
        gyms = gyms.map((gym) => {
            const distKm = calculateDistance(
                filters.userLocation!.latitude,
                filters.userLocation!.longitude,
                gym.location.latitude,
                gym.location.longitude
            );

            // Format distance: show meters if under 1km, otherwise km
            let distanceText: string;
            if (distKm < 1) {
                const meters = Math.round(distKm * 1000);
                distanceText = `${meters} m`;
            } else if (distKm < 10) {
                distanceText = `${distKm.toFixed(1)} km`;
            } else {
                distanceText = `${Math.round(distKm)} km`;
            }

            return {
                ...gym,
                distance: distanceText,
            };
        });

        if (filters.maxDistance) {
            gyms = gyms.filter((gym) => {
                // Parse distance value (handle both 'm' and 'km')
                const distanceStr = gym.distance!.replace(' m', '').replace(' km', '');
                const distanceValue = gym.distance!.includes(' m')
                    ? parseFloat(distanceStr) / 1000 // Convert meters to km
                    : parseFloat(distanceStr);
                return distanceValue <= filters.maxDistance!;
            });
        }

        // Sort by distance
        gyms.sort((a, b) => {
            // Parse and normalize to km for comparison
            const distA = a.distance!.includes(' m')
                ? parseFloat(a.distance!.replace(' m', '')) / 1000
                : parseFloat(a.distance!.replace(' km', ''));
            const distB = b.distance!.includes(' m')
                ? parseFloat(b.distance!.replace(' m', '')) / 1000
                : parseFloat(b.distance!.replace(' km', ''));
            return distA - distB;
        });
    }

    // Filter by facilities
    if (filters.facilities && filters.facilities.length > 0) {
        gyms = gyms.filter((gym) =>
            filters.facilities!.every((facility) => gym.facilities.includes(facility))
        );
    }

    // Filter by price range
    if (filters.priceRange && filters.priceRange.length > 0) {
        gyms = gyms.filter((gym) => filters.priceRange!.includes(gym.priceRange));
    }

    // Filter by minimum rating
    if (filters.minRating) {
        gyms = gyms.filter((gym) => gym.rating >= filters.minRating!);
    }

    return gyms;
}

export function getGymById(id: string): Gym | undefined {
    return GYM_DATABASE.find((gym) => gym.id === id);
}

export function getCountries(): string[] {
    return ['All', 'Sri Lanka', 'Dubai', 'Australia'];
}

export function getCitiesByCountry(country: string): string[] {
    if (country === 'All') {
        return [];
    }
    const cities = GYM_DATABASE.filter((gym) => gym.location.country === country)
        .map((gym) => gym.location.city)
        .filter((city, index, self) => self.indexOf(city) === index);
    return cities.sort();
}

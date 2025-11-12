// Gym Service - Handles gym data and filtering logic with Supabase integration
import { supabase } from '@/config/supabaseClient';

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

export interface Equipment {
    id: string;
    name: string;
    category: string;
    isAvailable: boolean;
    inUseBy?: string;
    estimatedWaitTime?: number; // in minutes
    queueCount?: number;
}

export interface Trainer {
    id: string;
    name: string;
    photo: string;
    expertise: string[];
    rating: number;
    pricePerSession: number;
    bio?: string;
    certifications?: string[];
}

export interface Class {
    id: string;
    name: string;
    type: string;
    instructor: string;
    duration: string;
    capacity: number;
    bookedCount: number;
    schedule: string[];
    description?: string;
}

export interface Review {
    id: string;
    userName: string;
    userPhoto: string;
    rating: number;
    comment: string;
    date: string;
    photos?: string[];
    helpfulCount: number;
}


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

// Format distance for display
function formatDistance(distKm: number): string {
    if (distKm < 1) {
        const meters = Math.round(distKm * 1000);
        return `${meters} m`;
    } else if (distKm < 10) {
        return `${distKm.toFixed(1)} km`;
    } else {
        return `${Math.round(distKm)} km`;
    }
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

/**
 * Fetch gyms from Supabase with filters
 */
export async function getGyms(filters: GymFilters = {}): Promise<{ data: Gym[] | null; error: Error | null }> {
    try {
        let query = supabase.from('gyms').select('*');

        // Filter by country
        if (filters.country && filters.country !== 'All') {
            query = query.eq('country', filters.country);
        }

        // Filter by city
        if (filters.city && filters.city.trim() && filters.city !== 'All') {
            query = query.ilike('city', filters.city.trim());
        }

        // Filter by search query
        if (filters.searchQuery && filters.searchQuery.trim()) {
            const searchTerm = `%${filters.searchQuery.trim()}%`;
            query = query.or(`name.ilike.${searchTerm},description.ilike.${searchTerm},address.ilike.${searchTerm}`);
        }

        // Filter by minimum rating
        if (filters.minRating) {
            query = query.gte('rating', filters.minRating);
        }

        const { data: gymsData, error } = await query;

        if (error) {
            console.error('Error fetching gyms:', error);
            return { data: null, error: new Error(error.message) };
        }

        if (!gymsData) {
            return { data: [], error: null };
        }

        // Transform database format to app format
        let gyms: Gym[] = gymsData.map((gym: any) => ({
            id: gym.id,
            name: gym.name,
            description: gym.description || '',
            facilities: gym.facilities || [],
            rating: gym.rating || 0,
            reviewCount: gym.review_count || 0,
            priceRange: gym.price_range || '$$',
            pricePerMonth: gym.price_per_month || 0,
            image: gym.photos?.[0] || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop',
            images: gym.photos || [],
            location: {
                latitude: gym.latitude || 0,
                longitude: gym.longitude || 0,
                address: gym.address || '',
                city: gym.city || '',
                country: gym.country || 'Sri Lanka',
                state: gym.state,
            },
            openingHours: gym.opening_hours || '24 Hours',
            phoneNumber: gym.phone_number || '',
            website: gym.website,
            membershipTypes: gym.membership_types || [],
        }));

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

        // Calculate distance and filter by max distance
        if (filters.userLocation) {
            gyms = gyms.map((gym) => {
                const distKm = calculateDistance(
                    filters.userLocation!.latitude,
                    filters.userLocation!.longitude,
                    gym.location.latitude,
                    gym.location.longitude
                );

                return {
                    ...gym,
                    distance: formatDistance(distKm),
                };
            });

            // Filter by max distance
            if (filters.maxDistance) {
                gyms = gyms.filter((gym) => {
                    const distanceStr = gym.distance!.replace(' m', '').replace(' km', '');
                    const distanceValue = gym.distance!.includes(' m')
                        ? parseFloat(distanceStr) / 1000
                        : parseFloat(distanceStr);
                    return distanceValue <= filters.maxDistance!;
                });
            }

            // Sort by distance
            gyms.sort((a, b) => {
                const distA = a.distance!.includes(' m')
                    ? parseFloat(a.distance!.replace(' m', '')) / 1000
                    : parseFloat(a.distance!.replace(' km', ''));
                const distB = b.distance!.includes(' m')
                    ? parseFloat(b.distance!.replace(' m', '')) / 1000
                    : parseFloat(b.distance!.replace(' km', ''));
                return distA - distB;
            });
        }

        return { data: gyms, error: null };
    } catch (err) {
        console.error('Error in getGyms:', err);
        return { data: null, error: err as Error };
    }
}

/**
 * Get detailed gym information by ID
 */
export async function getGymDetails(gymId: string): Promise<{ data: Gym | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from('gyms')
            .select('*')
            .eq('id', gymId)
            .single();

        if (error) {
            console.error('Error fetching gym details:', error);
            return { data: null, error: new Error(error.message) };
        }

        if (!data) {
            return { data: null, error: new Error('Gym not found') };
        }

        const gym: Gym = {
            id: data.id,
            name: data.name,
            description: data.description || '',
            facilities: data.facilities || [],
            rating: data.rating || 0,
            reviewCount: data.review_count || 0,
            priceRange: data.price_range || '$$',
            pricePerMonth: data.price_per_month || 0,
            image: data.photos?.[0] || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop',
            images: data.photos || [],
            location: {
                latitude: data.latitude || 0,
                longitude: data.longitude || 0,
                address: data.address || '',
                city: data.city || '',
                country: data.country || 'Sri Lanka',
                state: data.state,
            },
            openingHours: data.opening_hours || '24 Hours',
            phoneNumber: data.phone_number || '',
            website: data.website,
            membershipTypes: data.membership_types || [],
        };

        return { data: gym, error: null };
    } catch (err) {
        console.error('Error in getGymDetails:', err);
        return { data: null, error: err as Error };
    }
}

/**
 * Get user's saved gyms and memberships
 */
export async function getUserGyms(userId: string): Promise<{ data: Gym[] | null; error: Error | null }> {
    try {
        const { data: memberships, error } = await supabase
            .from('gym_memberships')
            .select(`
                *,
                gyms (*)
            `)
            .eq('user_id', userId)
            .eq('is_active', true);

        if (error) {
            console.error('Error fetching user gyms:', error);
            return { data: null, error: new Error(error.message) };
        }

        if (!memberships || memberships.length === 0) {
            return { data: [], error: null };
        }

        const gyms: Gym[] = memberships.map((membership: any) => {
            const gym = membership.gyms;
            return {
                id: gym.id,
                name: gym.name,
                description: gym.description || '',
                facilities: gym.facilities || [],
                rating: gym.rating || 0,
                reviewCount: gym.review_count || 0,
                priceRange: gym.price_range || '$$',
                pricePerMonth: gym.price_per_month || 0,
                image: gym.photos?.[0] || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop',
                images: gym.photos || [],
                location: {
                    latitude: gym.latitude || 0,
                    longitude: gym.longitude || 0,
                    address: gym.address || '',
                    city: gym.city || '',
                    country: gym.country || 'Sri Lanka',
                    state: gym.state,
                },
                openingHours: gym.opening_hours || '24 Hours',
                phoneNumber: gym.phone_number || '',
                website: gym.website,
                membershipTypes: gym.membership_types || [],
            };
        });

        return { data: gyms, error: null };
    } catch (err) {
        console.error('Error in getUserGyms:', err);
        return { data: null, error: err as Error };
    }
}

/**
 * Get equipment status for a gym
 */
export async function getEquipmentStatus(gymId: string): Promise<{ data: Equipment[] | null; error: Error | null }> {
    try {
        const { data: equipmentData, error } = await supabase
            .from('equipment')
            .select(`
                *,
                equipment_usage!left (
                    user_id,
                    start_time,
                    end_time
                ),
                equipment_queue!left (
                    id
                )
            `)
            .eq('gym_id', gymId)
            .order('category', { ascending: true })
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching equipment status:', error);
            return { data: null, error: new Error(error.message) };
        }

        if (!equipmentData) {
            return { data: [], error: null };
        }

        const equipment: Equipment[] = equipmentData.map((item: any) => {
            const activeUsage = item.equipment_usage?.find((usage: any) => !usage.end_time);
            const queueCount = item.equipment_queue?.length || 0;

            let estimatedWaitTime = 0;
            if (activeUsage) {
                const startTime = new Date(activeUsage.start_time);
                const now = new Date();
                const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
                const avgSessionTime = 30; // Average 30 min session
                estimatedWaitTime = Math.max(0, avgSessionTime - elapsedMinutes);
            }

            return {
                id: item.id,
                name: item.name,
                category: item.category,
                isAvailable: item.is_available && !activeUsage,
                inUseBy: activeUsage ? activeUsage.user_id : undefined,
                estimatedWaitTime: activeUsage ? estimatedWaitTime : undefined,
                queueCount,
            };
        });

        return { data: equipment, error: null };
    } catch (err) {
        console.error('Error in getEquipmentStatus:', err);
        return { data: null, error: err as Error };
    }
}

/**
 * Get trainers for a gym
 */
export async function getTrainers(gymId: string): Promise<{ data: Trainer[] | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from('trainers')
            .select('*')
            .eq('gym_id', gymId)
            .eq('is_active', true)
            .order('rating', { ascending: false });

        if (error) {
            console.error('Error fetching trainers:', error);
            return { data: null, error: new Error(error.message) };
        }

        if (!data) {
            return { data: [], error: null };
        }

        const trainers: Trainer[] = data.map((trainer: any) => ({
            id: trainer.id,
            name: trainer.name,
            photo: trainer.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(trainer.name),
            expertise: trainer.expertise || [],
            rating: trainer.rating || 0,
            pricePerSession: trainer.price_per_session || 0,
            bio: trainer.bio,
            certifications: trainer.certifications || [],
        }));

        return { data: trainers, error: null };
    } catch (err) {
        console.error('Error in getTrainers:', err);
        return { data: null, error: err as Error };
    }
}

/**
 * Get classes for a gym
 */
export async function getClasses(gymId: string): Promise<{ data: Class[] | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from('classes')
            .select(`
                *,
                class_bookings!left (id)
            `)
            .eq('gym_id', gymId)
            .eq('is_active', true)
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching classes:', error);
            return { data: null, error: new Error(error.message) };
        }

        if (!data) {
            return { data: [], error: null };
        }

        const classes: Class[] = data.map((cls: any) => {
            const bookedCount = cls.class_bookings?.length || 0;

            return {
                id: cls.id,
                name: cls.name,
                type: cls.class_type,
                instructor: cls.instructor_name,
                duration: cls.duration_minutes ? `${cls.duration_minutes} min` : '60 min',
                capacity: cls.max_capacity || 20,
                bookedCount,
                schedule: cls.schedule || [],
                description: cls.description,
            };
        });

        return { data: classes, error: null };
    } catch (err) {
        console.error('Error in getClasses:', err);
        return { data: null, error: err as Error };
    }
}

/**
 * Get reviews for a gym
 */
export async function getReviews(gymId: string): Promise<{ data: Review[] | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from('gym_reviews')
            .select(`
                *,
                review_helpful_votes!left (id)
            `)
            .eq('gym_id', gymId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching reviews:', error);
            return { data: null, error: new Error(error.message) };
        }

        if (!data) {
            return { data: [], error: null };
        }

        const reviews: Review[] = data.map((review: any) => ({
            id: review.id,
            userName: review.user_name || 'Anonymous',
            userPhoto: review.user_photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(review.user_name || 'User'),
            rating: review.rating,
            comment: review.comment || '',
            date: new Date(review.created_at).toLocaleDateString(),
            photos: review.photos || [],
            helpfulCount: review.review_helpful_votes?.length || 0,
        }));

        return { data: reviews, error: null };
    } catch (err) {
        console.error('Error in getReviews:', err);
        return { data: null, error: err as Error };
    }
}

/**
 * Get last check-in date for a gym
 */
export async function getLastCheckIn(userId: string, gymId: string): Promise<{ data: string | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from('check_ins')
            .select('check_in_time')
            .eq('user_id', userId)
            .eq('gym_id', gymId)
            .order('check_in_time', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            console.error('Error fetching last check-in:', error);
            return { data: null, error: new Error(error.message) };
        }

        if (!data) {
            return { data: null, error: null };
        }

        const checkInDate = new Date(data.check_in_time);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

        let lastVisited: string;
        if (diffDays === 0) {
            lastVisited = 'Today';
        } else if (diffDays === 1) {
            lastVisited = 'Yesterday';
        } else if (diffDays < 7) {
            lastVisited = `${diffDays} days ago`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            lastVisited = `${weeks} week${weeks > 1 ? 's' : ''} ago`;
        } else {
            const months = Math.floor(diffDays / 30);
            lastVisited = `${months} month${months > 1 ? 's' : ''} ago`;
        }

        return { data: lastVisited, error: null };
    } catch (err) {
        console.error('Error in getLastCheckIn:', err);
        return { data: null, error: err as Error };
    }
}

/**
 * Legacy function for backward compatibility - uses new getGyms internally
 */
export async function filterGyms(filters: GymFilters): Promise<Gym[]> {
    const { data, error } = await getGyms(filters);
    if (error || !data) {
        console.error('Error filtering gyms:', error);
        return [];
    }
    return data;
}

/**
 * Legacy function for backward compatibility - uses new getGymDetails internally
 */
export async function getGymById(id: string): Promise<Gym | undefined> {
    const { data, error } = await getGymDetails(id);
    if (error || !data) {
        console.error('Error getting gym by id:', error);
        return undefined;
    }
    return data;
}

/**
 * Get available countries
 */
export function getCountries(): string[] {
    return ['All', 'Sri Lanka', 'Dubai', 'Australia'];
}

/**
 * Get cities by country from database
 */
export async function getCitiesByCountry(country: string): Promise<{ data: string[] | null; error: Error | null }> {
    try {
        if (country === 'All') {
            return { data: [], error: null };
        }

        const { data, error } = await supabase
            .from('gyms')
            .select('city')
            .eq('country', country);

        if (error) {
            console.error('Error fetching cities:', error);
            return { data: null, error: new Error(error.message) };
        }

        if (!data) {
            return { data: [], error: null };
        }

        // Extract unique cities and sort
        const cities = [...new Set(data.map((gym: any) => gym.city))].sort();
        return { data: cities, error: null };
    } catch (err) {
        console.error('Error in getCitiesByCountry:', err);
        return { data: null, error: err as Error };
    }
}

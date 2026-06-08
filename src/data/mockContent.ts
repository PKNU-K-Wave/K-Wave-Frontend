import type { FoodContent, IdolContent, KWaveContent, SongContent, VideoContent } from '../types/content';

const personImage = (seed: string) => `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=320&q=80`;

export const songs: SongContent[] = [
  {
    id: 'song-supernova',
    kind: 'song',
    title: 'Supernova',
    subtitle: 'Aespa',
    artist: 'Aespa',
    album: 'Armageddon',
    releaseYear: 2024,
    imageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80',
    tags: ['K-POP', 'Dance', 'Girl Group'],
    description: 'A bright, high-energy track with a futuristic sound that connects naturally to idol culture.',
    relatedIdolIds: ['idol-aespa'],
    challengeUrl: 'https://www.instagram.com/aespa_official/',
  },
  {
    id: 'song-spring-snow',
    kind: 'song',
    title: 'Spring Snow',
    subtitle: '10CM',
    artist: '10CM',
    album: 'Lovely Runner OST',
    releaseYear: 2024,
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80',
    tags: ['OST', 'Ballad', 'Drama'],
    description: 'A gentle OST-style track that makes video content and music discovery feel connected.',
    relatedIdolIds: [],
  },
];

export const idols: IdolContent[] = [
  {
    id: 'idol-aespa',
    kind: 'idol',
    title: 'Aespa',
    subtitle: 'K-POP girl group',
    imageUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80',
    tags: ['SM Entertainment', 'Girl Group', 'Performance'],
    description: 'Aespa is known for sharp performance concepts, polished visuals, and global fan engagement.',
    instagramUrl: 'https://www.instagram.com/aespa_official/',
    challengeUrl: 'https://www.instagram.com/aespa_official/',
    relatedSongIds: ['song-supernova'],
    members: [
      { name: 'Karina', role: 'Leader, vocalist, dancer', imageUrl: personImage('photo-1534528741775-53994a69daeb') },
      { name: 'Giselle', role: 'Rapper, vocalist', imageUrl: personImage('photo-1524504388940-b1c1722653e1') },
      { name: 'Winter', role: 'Vocalist, dancer', imageUrl: personImage('photo-1517841905240-472988babdf9') },
      { name: 'Ningning', role: 'Main vocalist', imageUrl: personImage('photo-1508214751196-bcfd4ca60f91') },
    ],
  },
];

export const videos: VideoContent[] = [
  {
    id: 'video-parasite',
    kind: 'movie',
    title: 'Parasite',
    subtitle: 'A social thriller with global impact',
    year: 2019,
    director: 'Bong Joon-ho',
    imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80',
    tags: ['Movie', 'Thriller', 'Award-winning'],
    description: 'A modern Korean film touchpoint for global audiences interested in class, family, and tension.',
    cast: [
      { name: 'Song Kang-ho', role: 'Kim Ki-taek', imageUrl: personImage('photo-1500648767791-00dcc994a43e') },
      { name: 'Cho Yeo-jeong', role: 'Park Yeon-kyo', imageUrl: personImage('photo-1494790108377-be9c29b29330') },
      { name: 'Choi Woo-shik', role: 'Kim Ki-woo', imageUrl: personImage('photo-1506794778202-cad84cf45f1d') },
    ],
    ostIds: [],
    streaming: ['Netflix', 'Prime Video'],
  },
  {
    id: 'video-lovely-runner',
    kind: 'drama',
    title: 'Lovely Runner',
    subtitle: 'Romance, time travel, and fandom emotion',
    year: 2024,
    director: 'Yoon Jong-ho',
    imageUrl: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=900&q=80',
    tags: ['Drama', 'Romance', 'OST'],
    description: 'A drama-first entry point that can lead viewers into OST discovery and artist pages.',
    cast: [
      { name: 'Byeon Woo-seok', role: 'Ryu Sun-jae', imageUrl: personImage('photo-1527980965255-d3b416303d12') },
      { name: 'Kim Hye-yoon', role: 'Im Sol', imageUrl: personImage('photo-1520813792240-56fc4a3765a7') },
    ],
    ostIds: ['song-spring-snow'],
    streaming: ['TVING', 'Viki'],
  },
];

export const foods: FoodContent[] = [
  {
    id: 'food-ganjang-gyeran-bap',
    kind: 'food',
    title: 'Ganjang Gyeran Bap',
    subtitle: 'Soy sauce egg rice',
    imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=900&q=80',
    tags: ['Home Food', 'Rice', 'Quick'],
    description: 'A real Korean home meal built from rice, egg, soy sauce, sesame oil, and a few pantry toppings.',
    cookTime: '8 min',
    difficulty: 'Easy',
    ingredients: ['Steamed rice', 'Egg', 'Soy sauce', 'Sesame oil', 'Roasted seaweed', 'Sesame seeds'],
    steps: [
      'Place warm rice in a bowl.',
      'Fry or soft-scramble one egg.',
      'Add soy sauce and sesame oil.',
      'Top with seaweed and sesame seeds, then mix before eating.',
    ],
  },
  {
    id: 'food-kimchi-fried-rice',
    kind: 'food',
    title: 'Kimchi Fried Rice',
    subtitle: 'Fast pantry-style bokkeumbap',
    imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80',
    tags: ['Home Food', 'Kimchi', 'One Pan'],
    description: 'A casual dish many Koreans make when they have rice and ripe kimchi at home.',
    cookTime: '15 min',
    difficulty: 'Easy',
    ingredients: ['Cooked rice', 'Kimchi', 'Kimchi juice', 'Egg', 'Green onion', 'Sesame oil'],
    steps: [
      'Stir-fry chopped kimchi with green onion.',
      'Add rice and kimchi juice.',
      'Fry until the rice gets lightly crisp.',
      'Finish with sesame oil and a fried egg.',
    ],
  },
];

export const allContent: KWaveContent[] = [...videos, ...songs, ...idols, ...foods];

export const getContentById = (id: string) => allContent.find((item) => item.id === id);

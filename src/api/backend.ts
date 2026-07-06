import type { IdolContent, KWaveContent, Person, SongContent } from '../types/content';

const DEFAULT_API_BASE_URL = 'http://localhost:8080';
const FALLBACK_IMAGE_URL = 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80';
const FALLBACK_SONG_IMAGE_URL =
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80';

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

type ArtistResponse = {
  artistId: number;
  name: string;
  isGroup: boolean;
  repImgUrl?: string | null;
  fandomName?: string | null;
  instagramUrl?: string | null;
};

type MemberResponse = {
  memberId: number;
  name: string;
  photoUrl?: string | null;
};

type SongResponse = {
  songId: number;
  title: string;
  albumImgUrl?: string | null;
  releaseDate?: string | null;
  featuring?: string | null;
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? DEFAULT_API_BASE_URL;

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const body = (await response.json()) as T | ApiResponse<T>;

  if (isApiResponse<T>(body)) {
    return body.data;
  }

  return body;
}

function isApiResponse<T>(body: T | ApiResponse<T>): body is ApiResponse<T> {
  return typeof body === 'object' && body !== null && 'success' in body && 'data' in body;
}

export async function fetchKPopContent(): Promise<{ idols: IdolContent[]; songs: SongContent[] }> {
  const artists = await request<ArtistResponse[]>('/api/artists');
  const artistBundles = await Promise.all(
    artists.map(async (artist) => {
      const [members, songs] = await Promise.all([
        artist.isGroup ? request<MemberResponse[]>(`/api/artists/${artist.artistId}/members`).catch(() => []) : [],
        request<SongResponse[]>(`/api/artists/${artist.artistId}/songs`).catch(() => []),
      ]);

      return {
        idol: mapArtistToIdol(artist, members, songs),
        songs: songs.map((song) => mapSongToContent(song, artist)),
      };
    }),
  );

  return {
    idols: artistBundles.map((bundle) => bundle.idol),
    songs: artistBundles.flatMap((bundle) => bundle.songs),
  };
}

function mapArtistToIdol(artist: ArtistResponse, members: MemberResponse[], songs: SongResponse[]): IdolContent {
  return {
    id: `artist-${artist.artistId}`,
    kind: 'idol',
    title: artist.name,
    subtitle: artist.isGroup ? 'K-POP group' : 'K-POP artist',
    imageUrl: artist.repImgUrl || FALLBACK_IMAGE_URL,
    tags: [artist.isGroup ? 'Group' : 'Solo', artist.fandomName ? `${artist.fandomName} fandom` : 'K-POP'],
    description: artist.fandomName
      ? `${artist.name} is connected with the ${artist.fandomName} fandom and Korean pop culture discovery.`
      : `${artist.name} is part of the K-Wave music and artist network.`,
    instagramUrl: artist.instagramUrl || '',
    challengeUrl: artist.instagramUrl || undefined,
    members: members.map(mapMemberToPerson),
    relatedSongIds: songs.map((song) => `song-${song.songId}`),
  };
}

function mapMemberToPerson(member: MemberResponse): Person {
  return {
    name: member.name,
    role: 'Member',
    imageUrl: member.photoUrl || FALLBACK_IMAGE_URL,
  };
}

function mapSongToContent(song: SongResponse, artist: ArtistResponse): SongContent {
  return {
    id: `song-${song.songId}`,
    kind: 'song',
    title: song.title,
    subtitle: artist.name,
    artist: artist.name,
    album: song.featuring ? `Featuring ${song.featuring}` : 'K-POP release',
    releaseYear: song.releaseDate ? new Date(song.releaseDate).getFullYear() : new Date().getFullYear(),
    imageUrl: song.albumImgUrl || artist.repImgUrl || FALLBACK_SONG_IMAGE_URL,
    tags: ['K-POP', artist.isGroup ? 'Group' : 'Artist'],
    description: `${song.title} connects listeners to ${artist.name} and the wider K-Wave music catalog.`,
    relatedIdolIds: [`artist-${artist.artistId}`],
    challengeUrl: artist.instagramUrl || undefined,
  };
}

export function mergeContentWithKPop(
  baseContent: KWaveContent[],
  apiContent: { idols: IdolContent[]; songs: SongContent[] },
): KWaveContent[] {
  const nonKPopContent = baseContent.filter((item) => item.kind !== 'song' && item.kind !== 'idol');
  return [...nonKPopContent, ...apiContent.songs, ...apiContent.idols];
}

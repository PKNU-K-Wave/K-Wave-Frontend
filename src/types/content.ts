export type Language = 'en' | 'zh' | 'ja';

export type ContentKind = 'movie' | 'drama' | 'song' | 'idol' | 'food';

export type BaseContent = {
  id: string;
  kind: ContentKind;
  title: string;
  subtitle: string;
  imageUrl: string;
  tags: string[];
  description: string;
};

export type VideoContent = BaseContent & {
  kind: 'movie' | 'drama';
  year: number;
  director: string;
  cast: Person[];
  ostIds: string[];
  streaming: string[];
};

export type SongContent = BaseContent & {
  kind: 'song';
  artist: string;
  album: string;
  releaseYear: number;
  relatedIdolIds: string[];
  challengeUrl?: string;
};

export type IdolContent = BaseContent & {
  kind: 'idol';
  instagramUrl: string;
  challengeUrl?: string;
  members: Person[];
  relatedSongIds: string[];
};

export type FoodContent = BaseContent & {
  kind: 'food';
  cookTime: string;
  difficulty: 'Easy' | 'Medium';
  ingredients: string[];
  steps: string[];
};

export type Person = {
  name: string;
  role: string;
  imageUrl: string;
};

export type KWaveContent = VideoContent | SongContent | IdolContent | FoodContent;

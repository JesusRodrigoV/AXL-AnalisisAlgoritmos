export interface HelpContent {
  title: string;
  description?: string;
  steps?: HelpStep[];
  images?: HelpImage[];
  videos?: HelpVideo[];
  tips?: string[];
}

export interface HelpStep {
  number: number;
  title: string;
  description: string;
  image?: string;
}

export interface HelpImage {
  url: string;
  caption: string;
  alt: string;
}

export interface HelpVideo {
  url: string;
  title: string;
  thumbnail?: string;
}

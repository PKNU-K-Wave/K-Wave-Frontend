import { RecommendationPanel } from '../components/RecommendationPanel';
import { SectionHeader } from '../components/SectionHeader';
import type { useKWaveContent } from '../hooks/useKWaveContent';
import type { KWaveContent } from '../types/content';

type RecommendationsPageProps = {
  content: ReturnType<typeof useKWaveContent>;
  onOpenRecommendation: (item: KWaveContent) => void;
};

export function RecommendationsPage({ content, onOpenRecommendation }: RecommendationsPageProps) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
      <SectionHeader
        eyebrow="For You"
        title="Personalized K-Wave picks"
        description="Choose your preferred culture categories and tastes, then open each recommendation inside its original category flow."
      />
      <RecommendationPanel content={content.allContent} onOpen={onOpenRecommendation} />
    </main>
  );
}

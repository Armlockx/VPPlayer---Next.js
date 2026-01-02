'use client';

import { VideoPlayerPage } from '@/components/player/VideoPlayerPage';

export const dynamic = 'force-dynamic';

interface WatchPageProps {
  params: { id: string };
}

export default function WatchPage({ params }: WatchPageProps) {
  return <VideoPlayerPage videoId={params.id} />;
}


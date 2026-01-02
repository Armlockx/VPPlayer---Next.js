'use client';

import { VideoPlayerPage } from '@/components/player/VideoPlayerPage';

export const dynamic = 'force-dynamic';

export default function WatchPage({ params }: { params: { id: string } }) {
  return <VideoPlayerPage videoId={params.id} />;
}


'use client';

export function SkeletonCard({ height = '200px', borderRadius = '12px' }: { height?: string; borderRadius?: string }) {
  return (
    <div
      style={{
        height,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
        backgroundSize: '200% 100%',
        borderRadius,
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}

export function SkeletonText({ width = '60%', height = '16px', margin = '8px 0' }: { width?: string; height?: string; margin?: string }) {
  return (
    <div
      style={{
        width,
        height,
        margin,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
        backgroundSize: '200% 100%',
        borderRadius: '4px',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}

export function SkeletonCircle({ size = '50px' }: { size?: string }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}


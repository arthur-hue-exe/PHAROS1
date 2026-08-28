import { useScrollProgress } from '@/hooks/useScroll';

export default function ScrollProgress() {
  const progress = useScrollProgress();

  return (
    <div className="fixed inset-x-0 top-0 z-[150] h-0.5 bg-transparent">
      <div
        className="h-full bg-pharos-red transition-[width] duration-75 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

import { formatMannerTemperature, getMannerTemperatureStyle } from '@/lib/mannerTemperature';

export default function MannerTemperatureBadge({
  temperature,
  size = 'sm',
}: {
  temperature: number;
  size?: 'sm' | 'lg';
}) {
  const style = getMannerTemperatureStyle(temperature);

  if (size === 'sm') {
    return (
      <span className={`text-xs font-medium ${style.text}`}>
        매너온도 {formatMannerTemperature(temperature)}
      </span>
    );
  }

  const barPercent = Math.min(100, Math.max(0, (temperature / 99) * 100));

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-ink-900">매너온도</span>
        <span className={`text-lg font-bold ${style.text}`}>{formatMannerTemperature(temperature)}</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink-900/10">
        <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${barPercent}%` }} />
      </div>
    </div>
  );
}

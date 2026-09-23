export function formatMannerTemperature(temp: number): string {
  return `${temp.toFixed(1)}°C`;
}

// 당근마켓 스타일(차가움 ↔ 따뜻함)을 그대로 표현: 기준(36.5) 위는 gold 톤이 진해지고,
// 아래는 파란 톤이 진해진다. 팔레트에 파란 계열이 없어서 이 헬퍼에서만 쓰는 한정된
// 파란 두 단계를 임의값(arbitrary value)으로 정의했다 — Tailwind JIT가 이 파일도
// 스캔하도록 tailwind.config.ts의 content에 lib/**를 함께 추가해뒀다.
export function getMannerTemperatureStyle(temp: number): { text: string; bar: string; ring: string } {
  if (temp >= 39) return { text: 'text-gold-600', bar: 'bg-gold-600', ring: 'ring-gold-600' };
  if (temp >= 37.5) return { text: 'text-gold-500', bar: 'bg-gold-500', ring: 'ring-gold-500' };
  if (temp > 36.5) return { text: 'text-gold-400', bar: 'bg-gold-400', ring: 'ring-gold-400' };
  if (temp === 36.5) return { text: 'text-ink-900/60', bar: 'bg-ink-900/30', ring: 'ring-ink-900/20' };
  if (temp >= 34) return { text: 'text-[#7FB2E5]', bar: 'bg-[#7FB2E5]', ring: 'ring-[#7FB2E5]' };
  return { text: 'text-[#2F5FA8]', bar: 'bg-[#2F5FA8]', ring: 'ring-[#2F5FA8]' };
}

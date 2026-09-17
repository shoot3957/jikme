'use client';

import { TEAM_COLORS } from '@/lib/teamColors';
import type { Team } from '@/lib/useTeamsAndTags';

export default function TeamPicker({
  teams,
  value,
  onChange,
}: {
  teams: Team[];
  value: number | null;
  onChange: (teamId: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {teams.map((team) => {
        const selected = value === team.id;
        const color = TEAM_COLORS[team.shortCode] ?? '#0F1B2D';
        return (
          <button
            key={team.id}
            type="button"
            onClick={() => onChange(team.id)}
            style={selected ? { borderColor: color, backgroundColor: `${color}0D` } : undefined}
            className={`rounded-xl border-2 px-4 py-4 text-sm font-medium transition ${
              selected ? 'text-ink-900' : 'border-ink-900/10 text-ink-900/70 hover:border-ink-900/25'
            }`}
          >
            {team.name}
          </button>
        );
      })}
    </div>
  );
}

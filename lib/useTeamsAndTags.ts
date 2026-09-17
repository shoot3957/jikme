'use client';

import { useEffect, useState } from 'react';

export type Team = { id: number; name: string; shortCode: string };
export type Tag = { id: number; name: string };

export function useTeamsAndTags() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [teamsRes, tagsRes] = await Promise.all([fetch('/api/teams'), fetch('/api/tags')]);
      const [teamsData, tagsData] = await Promise.all([teamsRes.json(), tagsRes.json()]);
      if (cancelled) return;
      setTeams(teamsData);
      setTags(tagsData);
      setLoaded(true);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { teams, tags, loaded };
}

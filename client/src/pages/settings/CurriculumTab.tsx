import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Layers } from 'lucide-react';
import { sileo } from 'sileo';
import api from '@/api/axiosInstance';
import { useSettingsStore } from '@/stores/settingsStore';
import { toastApiError } from '@/hooks/useApiToast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface GradeLevel {
  id: number;
  name: string;
  displayOrder: number;
  sections: { id: number; _count: { enrollments: number } }[];
}

interface Strand {
  id: number;
  name: string;
  applicableGradeLevelIds: number[];
}

export default function CurriculumTab() {
  const { activeAcademicYearId, viewingAcademicYearId } = useSettingsStore();
  const ayId = viewingAcademicYearId ?? activeAcademicYearId;

  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [strands, setStrands] = useState<Strand[]>([]);
  const [loading, setLoading] = useState(true);

  // Matrix dirty state
  const [matrixDirty, setMatrixDirty] = useState(false);
  const [savingMatrix, setSavingMatrix] = useState(false);

  const fetchData = useCallback(async () => {
    if (!ayId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [glRes, stRes] = await Promise.all([
        api.get(`/curriculum/${ayId}/grade-levels`),
        api.get(`/curriculum/${ayId}/strands`),
      ]);
      setGradeLevels(glRes.data.gradeLevels);
      setStrands(stRes.data.strands);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [ayId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleMatrixCell = (strandId: number, glId: number) => {
    setStrands((prev) =>
      prev.map((s) => {
        if (s.id !== strandId) return s;
        const has = s.applicableGradeLevelIds.includes(glId);
        return {
          ...s,
          applicableGradeLevelIds: has
            ? s.applicableGradeLevelIds.filter((id) => id !== glId)
            : [...s.applicableGradeLevelIds, glId],
        };
      })
    );
    setMatrixDirty(true);
  };

  const handleSaveMatrix = async () => {
    if (!ayId) return;
    setSavingMatrix(true);
    try {
      const matrix = strands.map((s) => ({
        strandId: s.id,
        gradeLevelIds: s.applicableGradeLevelIds,
      }));
      const res = await api.put(`/curriculum/${ayId}/strand-matrix`, { matrix });
      setStrands(res.data.strands);
      setMatrixDirty(false);
      sileo.success({ title: 'Matrix Saved', description: 'Strand-to-grade assignments updated.' });
    } catch (err) {
      toastApiError(err as never);
    } finally {
      setSavingMatrix(false);
    }
  };

  if (!ayId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
          No school year selected. Set an active year or choose one from the header switcher.
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return <div className="text-center py-8 text-sm text-[hsl(var(--muted-foreground))]">Loading curriculum…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Grade Levels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="h-5 w-5" />
            Grade Levels
          </CardTitle>
          <CardDescription>Grade levels offered by the school</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Junior High School */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Junior High School</p>
              {gradeLevels.filter((gl) => ['Grade 7','Grade 8','Grade 9','Grade 10'].includes(gl.name)).map((gl) => (
                <div key={gl.id} className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] px-3 py-2">
                  <span className="text-sm font-medium">{gl.name}</span>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    {gl.sections.length} section{gl.sections.length !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
            {/* Senior High School */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Senior High School</p>
              {gradeLevels.filter((gl) => ['Grade 11','Grade 12'].includes(gl.name)).map((gl) => (
                <div key={gl.id} className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] px-3 py-2">
                  <span className="text-sm font-medium">{gl.name}</span>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    {gl.sections.length} section{gl.sections.length !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strands */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Layers className="h-5 w-5" />
            Strands / Tracks
          </CardTitle>
          <CardDescription>Strands offered by the school</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {([
              { acronym: 'STEM', full: 'Science, Technology, Engineering, and Mathematics' },
              { acronym: 'ABM',  full: 'Accountancy, Business, and Management' },
              { acronym: 'HUMSS', full: 'Humanities and Social Sciences' },
              { acronym: 'GAS',  full: 'General Academic Strand' },
            ] as const).map(({ acronym, full }) => {
              const match = strands.find((s) => s.name === full);
              return (
                <div key={acronym} className="flex items-center gap-3 rounded-lg border border-[hsl(var(--border))] px-3 py-2">
                  <span className="w-14 shrink-0 text-xs font-semibold text-[hsl(var(--muted-foreground))]">{acronym}</span>
                  <span className="flex-1 text-sm font-medium">{full}</span>
                  {match && (
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      {match.applicableGradeLevelIds.length} grade{match.applicableGradeLevelIds.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Strand-to-Grade Matrix */}
      {strands.length > 0 && gradeLevels.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Strand-to-Grade Matrix</CardTitle>
                <CardDescription>Check which strands apply to which grade levels</CardDescription>
              </div>
              {matrixDirty && (
                <Button size="sm" onClick={handleSaveMatrix} disabled={savingMatrix}>
                  {savingMatrix ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-2 pr-4 font-medium text-[hsl(var(--muted-foreground))]">Strand</th>
                    {gradeLevels.map((gl) => (
                      <th key={gl.id} className="px-3 py-2 text-center font-medium text-[hsl(var(--muted-foreground))]">
                        {gl.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {strands.map((s) => (
                    <tr key={s.id} className="border-t border-[hsl(var(--border))]">
                      <td className="py-2 pr-4 font-medium">{s.name}</td>
                      {gradeLevels.map((gl) => {
                        const checked = s.applicableGradeLevelIds.includes(gl.id);
                        return (
                          <td key={gl.id} className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleMatrixCell(s.id, gl.id)}
                              className="h-4 w-4 rounded border-[hsl(var(--border))] accent-[hsl(var(--primary))] cursor-pointer"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

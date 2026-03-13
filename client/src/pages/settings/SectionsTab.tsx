import { useState, useEffect, useCallback } from 'react';
import { sileo } from 'sileo';
import { Plus, Trash2, Grid3X3 } from 'lucide-react';
import api from '@/api/axiosInstance';
import { useSettingsStore } from '@/stores/settingsStore';
import { toastApiError } from '@/hooks/useApiToast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

interface SectionItem {
  id: number;
  name: string;
  maxCapacity: number;
  enrolledCount: number;
  fillPercent: number;
  advisingTeacher: { id: number; name: string } | null;
}

interface GradeLevelGroup {
  gradeLevelId: number;
  gradeLevelName: string;
  displayOrder: number;
  sections: SectionItem[];
}

function fillColor(pct: number): string {
  if (pct >= 90) return 'bg-red-500';
  if (pct >= 75) return 'bg-orange-400';
  if (pct >= 50) return 'bg-yellow-400';
  return 'bg-green-500';
}

function fillEmoji(pct: number): string {
  if (pct >= 90) return '🔴';
  if (pct >= 75) return '🟠';
  if (pct >= 50) return '🟡';
  return '🟢';
}

export default function SectionsTab() {
  const { activeAcademicYearId, viewingAcademicYearId } = useSettingsStore();
  const ayId = viewingAcademicYearId ?? activeAcademicYearId;

  const [groups, setGroups] = useState<GradeLevelGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Add section dialog
  const [showAdd, setShowAdd] = useState(false);
  const [addGlId, setAddGlId] = useState<number | null>(null);
  const [sectionName, setSectionName] = useState('');
  const [sectionCap, setSectionCap] = useState('40');
  const [adding, setAdding] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteName, setDeleteName] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!ayId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await api.get(`/sections/${ayId}`);
      setGroups(res.data.gradeLevels);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [ayId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAddDialog = (glId: number) => {
    setAddGlId(glId);
    setSectionName('');
    setSectionCap('40');
    setShowAdd(true);
  };

  const handleAdd = async () => {
    if (!addGlId || !sectionName.trim()) return;
    setAdding(true);
    try {
      await api.post('/sections', {
        name: sectionName.trim(),
        maxCapacity: parseInt(sectionCap) || 40,
        gradeLevelId: addGlId,
      });
      sileo.success({ title: 'Section Added', description: sectionName.trim() });
      setShowAdd(false);
      fetchData();
    } catch (err) {
      toastApiError(err as never);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/sections/${deleteId}`);
      sileo.success({ title: 'Deleted', description: deleteName });
      setDeleteId(null);
      fetchData();
    } catch (err) {
      toastApiError(err as never);
    } finally {
      setDeleting(false);
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
    return <div className="text-center py-8 text-sm text-[hsl(var(--muted-foreground))]">Loading sections…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Capacity Heatmap overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Grid3X3 className="h-5 w-5" />
            Capacity Heatmap
          </CardTitle>
          <CardDescription>
            Visual overview of section fill rates. 🟢 &lt;50% · 🟡 50-74% · 🟠 75-89% · 🔴 90%+
          </CardDescription>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">No grade levels with sections found.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groups.flatMap((g) =>
                g.sections.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 rounded-lg border border-[hsl(var(--border))] p-3"
                  >
                    <span className="text-lg">{fillEmoji(s.fillPercent)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{g.gradeLevelName} — {s.name}</p>
                      <div className="mt-1 h-2 w-full rounded-full bg-[hsl(var(--muted))]">
                        <div
                          className={`h-2 rounded-full transition-all ${fillColor(s.fillPercent)}`}
                          style={{ width: `${Math.min(s.fillPercent, 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-mono text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                      {s.enrolledCount}/{s.maxCapacity}
                    </span>
                  </div>
                ))
              )}
              {groups.every((g) => g.sections.length === 0) && (
                <p className="col-span-full text-sm text-[hsl(var(--muted-foreground))] text-center py-4">
                  No sections created yet. Add sections to grade levels below.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sections grouped by grade level */}
      {groups.map((g) => (
        <Card key={g.gradeLevelId}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{g.gradeLevelName}</CardTitle>
              <Button size="sm" variant="outline" onClick={() => openAddDialog(g.gradeLevelId)}>
                <Plus className="mr-1 h-3 w-3" /> Add Section
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {g.sections.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-2">No sections</p>
            ) : (
              <div className="space-y-2">
                {g.sections.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 rounded-lg border border-[hsl(var(--border))] px-3 py-2"
                  >
                    <span className="text-sm">{fillEmoji(s.fillPercent)}</span>
                    <span className="flex-1 text-sm font-medium">{s.name}</span>
                    {s.advisingTeacher && (
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">
                        {s.advisingTeacher.name}
                      </span>
                    )}
                    <span className="text-xs font-mono text-[hsl(var(--muted-foreground))]">
                      {s.enrolledCount}/{s.maxCapacity} ({s.fillPercent}%)
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-[hsl(var(--destructive))]"
                      onClick={() => { setDeleteId(s.id); setDeleteName(s.name); }}
                      disabled={s.enrolledCount > 0}
                      title={s.enrolledCount > 0 ? 'Cannot delete — has enrolled students' : 'Delete section'}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Add Section Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Section Name</Label>
              <Input placeholder="e.g. Section A" value={sectionName} onChange={(e) => setSectionName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Max Capacity</Label>
              <Input type="number" min="1" value={sectionCap} onChange={(e) => setSectionCap(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAdd} disabled={adding || !sectionName.trim()}>
              {adding ? 'Adding...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Section"
        description={`Are you sure you want to delete the section "${deleteName}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

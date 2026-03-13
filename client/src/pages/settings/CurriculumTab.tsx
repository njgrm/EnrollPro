import { useState, useEffect, useCallback } from 'react';
import { sileo } from 'sileo';
import { Plus, Trash2, GripVertical, BookOpen, Layers } from 'lucide-react';
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

import { ConfirmationModal } from '@/components/ui/confirmation-modal';

export default function CurriculumTab() {
  const { activeAcademicYearId, viewingAcademicYearId } = useSettingsStore();
  const ayId = viewingAcademicYearId ?? activeAcademicYearId;

  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [strands, setStrands] = useState<Strand[]>([]);
  const [loading, setLoading] = useState(true);

  // Add grade level dialog
  const [showAddGL, setShowAddGL] = useState(false);
  const [glName, setGlName] = useState('');
  const [addingGL, setAddingGL] = useState(false);

  // Add strand dialog
  const [showAddStrand, setShowAddStrand] = useState(false);
  const [strandName, setStrandName] = useState('');
  const [addingStrand, setAddingStrand] = useState(false);

  // Matrix dirty state
  const [matrixDirty, setMatrixDirty] = useState(false);
  const [savingMatrix, setSavingMatrix] = useState(false);

  // Delete confirmation
  const [deleteGLId, setDeleteGLId] = useState<number | null>(null);
  const [deleteGLName, setDeleteGLName] = useState('');
  const [deletingGL, setDeletingGL] = useState(false);

  const [deleteStrandId, setDeleteStrandId] = useState<number | null>(null);
  const [deleteStrandName, setDeleteStrandName] = useState('');
  const [deletingStrand, setDeletingStrand] = useState(false);

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

  const handleAddGL = async () => {
    if (!ayId || !glName.trim()) return;
    setAddingGL(true);
    try {
      await api.post(`/curriculum/${ayId}/grade-levels`, { name: glName.trim() });
      sileo.success({ title: 'Grade Level Added', description: glName.trim() });
      setGlName('');
      setShowAddGL(false);
      fetchData();
    } catch (err) {
      toastApiError(err as never);
    } finally {
      setAddingGL(false);
    }
  };

  const handleDeleteGL = async () => {
    if (!deleteGLId) return;
    setDeletingGL(true);
    try {
      await api.delete(`/curriculum/grade-levels/${deleteGLId}`);
      sileo.success({ title: 'Deleted', description: deleteGLName });
      setDeleteGLId(null);
      fetchData();
    } catch (err) {
      toastApiError(err as never);
    } finally {
      setDeletingGL(false);
    }
  };

  const handleAddStrand = async () => {
    if (!ayId || !strandName.trim()) return;
    setAddingStrand(true);
    try {
      await api.post(`/curriculum/${ayId}/strands`, { name: strandName.trim() });
      sileo.success({ title: 'Strand Added', description: strandName.trim() });
      setStrandName('');
      setShowAddStrand(false);
      fetchData();
    } catch (err) {
      toastApiError(err as never);
    } finally {
      setAddingStrand(false);
    }
  };

  const handleDeleteStrand = async () => {
    if (!deleteStrandId) return;
    setDeletingStrand(true);
    try {
      await api.delete(`/curriculum/strands/${deleteStrandId}`);
      sileo.success({ title: 'Deleted', description: deleteStrandName });
      setDeleteStrandId(null);
      fetchData();
    } catch (err) {
      toastApiError(err as never);
    } finally {
      setDeletingStrand(false);
    }
  };

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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <BookOpen className="h-5 w-5" />
                Grade Levels
              </CardTitle>
              <CardDescription>Manage grade levels for the selected school year</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowAddGL(true)}>
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {gradeLevels.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">No grade levels. Add one to get started.</p>
          ) : (
            <div className="space-y-2">
              {gradeLevels.map((gl) => (
                <div
                  key={gl.id}
                  className="flex items-center gap-3 rounded-lg border border-[hsl(var(--border))] px-3 py-2"
                >
                  <GripVertical className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  <span className="flex-1 text-sm font-medium">{gl.name}</span>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    {gl.sections.length} section{gl.sections.length !== 1 ? 's' : ''}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-[hsl(var(--destructive))]"
                    onClick={() => { setDeleteGLId(gl.id); setDeleteGLName(gl.name); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Strands */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Layers className="h-5 w-5" />
                Strands / Tracks
              </CardTitle>
              <CardDescription>Define strands and assign them to applicable grade levels</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowAddStrand(true)}>
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {strands.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">No strands defined yet.</p>
          ) : (
            <div className="space-y-2">
              {strands.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-lg border border-[hsl(var(--border))] px-3 py-2"
                >
                  <span className="flex-1 text-sm font-medium">{s.name}</span>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    {s.applicableGradeLevelIds.length} grade{s.applicableGradeLevelIds.length !== 1 ? 's' : ''}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-[hsl(var(--destructive))]"
                    onClick={() => { setDeleteStrandId(s.id); setDeleteStrandName(s.name); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ... rest of the component (Matrix, Dialogs) ... */}

      <ConfirmationModal
        open={!!deleteGLId}
        onOpenChange={(open) => !open && setDeleteGLId(null)}
        title="Delete Grade Level"
        description={`Are you sure you want to delete "${deleteGLName}"? This will also remove all sections under it.`}
        confirmText="Delete"
        loading={deletingGL}
        onConfirm={handleDeleteGL}
      />

      <ConfirmationModal
        open={!!deleteStrandId}
        onOpenChange={(open) => !open && setDeleteStrandId(null)}
        title="Delete Strand"
        description={`Are you sure you want to delete the strand "${deleteStrandName}"?`}
        confirmText="Delete"
        loading={deletingStrand}
        onConfirm={handleDeleteStrand}
      />

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

      {/* Add Grade Level Dialog */}
      <Dialog open={showAddGL} onOpenChange={setShowAddGL}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Grade Level</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input placeholder="e.g. Grade 7" value={glName} onChange={(e) => setGlName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button onClick={handleAddGL} disabled={addingGL || !glName.trim()}>
              {addingGL ? 'Adding...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Strand Dialog */}
      <Dialog open={showAddStrand} onOpenChange={setShowAddStrand}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Strand</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input placeholder="e.g. STEM" value={strandName} onChange={(e) => setStrandName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button onClick={handleAddStrand} disabled={addingStrand || !strandName.trim()}>
              {addingStrand ? 'Adding...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { sileo } from 'sileo';
import {
  Calendar,
  Plus,
  Trash2,
  ArrowRight,
  Copy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import api from '@/api/axiosInstance';
import { useSettingsStore } from '@/stores/settingsStore';
import { toastApiError } from '@/hooks/useApiToast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

interface AYItem {
  id: number;
  yearLabel: string;
  status: string;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  clonedFromId: number | null;
  _count: { gradeLevels: number; strands: number; applicants: number; enrollments: number };
}

const STATUS_ORDER = ['DRAFT', 'UPCOMING', 'ACTIVE', 'ARCHIVED'] as const;

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-800',
  UPCOMING: 'bg-blue-100 text-blue-700',
  ACTIVE: 'bg-green-100 text-green-700',
  ARCHIVED: 'bg-gray-100 text-gray-500',
};

function nextStatus(current: string): string | null {
  const idx = STATUS_ORDER.indexOf(current as typeof STATUS_ORDER[number]);
  if (idx < 0 || idx >= STATUS_ORDER.length - 1) return null;
  return STATUS_ORDER[idx + 1];
}

export default function AcademicYearTab() {
  const { activeAcademicYearId, setSettings } = useSettingsStore();
  const [years, setYears] = useState<AYItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Wizard state
  const [step, setStep] = useState(1);
  const [yearLabel, setYearLabel] = useState('');
  const [isManualLabel, setIsManualLabel] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cloneFrom, setCloneFrom] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLabel, setDeleteLabel] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isManualLabel && startDate && endDate) {
      const startYear = new Date(startDate).getFullYear();
      const endYear = new Date(endDate).getFullYear();
      if (!isNaN(startYear) && !isNaN(endYear)) {
        setYearLabel(`S.Y. ${startYear}-${endYear}`);
      }
    }
  }, [startDate, endDate, isManualLabel]);

  const fetchYears = async () => {
    try {
      const res = await api.get('/academic-years');
      setYears(res.data.years);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  const handleCreate = async () => {
    if (!yearLabel.trim()) return;
    setCreating(true);
    try {
      await api.post('/academic-years', {
        yearLabel: yearLabel.trim(),
        startDate: startDate || null,
        endDate: endDate || null,
        cloneFromId: cloneFrom,
      });
      sileo.success({
        title: 'School Year Created',
        description: `${yearLabel} has been created${cloneFrom ? ' with cloned structure' : ''}.`,
      });
      resetWizard();
      setShowCreate(false);
      fetchYears();
    } catch (err) {
      toastApiError(err as never);
    } finally {
      setCreating(false);
    }
  };

  const handleTransition = async (id: number, status: string) => {
    try {
      const res = await api.patch(`/academic-years/${id}/status`, { status });
      if (status === 'ACTIVE') {
        setSettings({ activeAcademicYearId: id });
      } else if (res.data.year && !res.data.year.isActive && activeAcademicYearId === id) {
        setSettings({ activeAcademicYearId: null });
      }
      sileo.success({ title: 'Status Updated', description: `Moved to ${status}.` });
      fetchYears();
    } catch (err) {
      toastApiError(err as never);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/academic-years/${deleteId}`);
      sileo.success({ title: 'Deleted', description: `${deleteLabel} has been removed.` });
      setDeleteId(null);
      fetchYears();
    } catch (err) {
      toastApiError(err as never);
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteConfirm = (id: number, label: string) => {
    setDeleteId(id);
    setDeleteLabel(label);
  };

  const resetWizard = () => {
    setStep(1);
    setYearLabel('');
    setIsManualLabel(false);
    setStartDate('');
    setEndDate('');
    setCloneFrom(null);
  };

  if (loading) {
    return <div className="text-center py-8 text-sm text-[hsl(var(--muted-foreground))]">Loading school years…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Lifecycle Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5" />
            Lifecycle Pipeline
          </CardTitle>
          <CardDescription>
            School years move through four stages: Draft → Upcoming → Active → Archived
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {STATUS_ORDER.map((s, i) => {
              const count = years.filter((y) => y.status === s).length;
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className={`flex flex-col items-center gap-1 rounded-lg border px-4 py-3 min-w-[90px] ${
                    count > 0 ? 'border-[hsl(var(--border))]' : 'border-dashed border-[hsl(var(--border))] opacity-50'
                  }`}>
                    <span className={`text-xs font-semibold rounded px-2 py-0.5 ${STATUS_COLORS[s]}`}>{s}</span>
                    <span className="text-lg font-bold">{count}</span>
                  </div>
                  {i < STATUS_ORDER.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Header + New button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">All School Years</h3>
        <Button size="sm" onClick={() => { resetWizard(); setShowCreate(true); }}>
          <Plus className="mr-1 h-4 w-4" /> New School Year
        </Button>
      </div>

      {/* Year cards */}
      {years.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
            No school years yet. Create one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {years.map((y) => {
            const next = nextStatus(y.status);
            const isExpanded = expandedId === y.id;
            return (
              <Card key={y.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : y.id)}
                      className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <span className="font-semibold">{y.yearLabel}</span>
                    <span className={`text-xs font-semibold rounded px-2 py-0.5 ${STATUS_COLORS[y.status]}`}>
                      {y.status}
                    </span>
                    {y.isActive && <Badge variant="success">Current</Badge>}
                    <div className="ml-auto flex items-center gap-2">
                      {next && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTransition(y.id, next)}
                        >
                          <ArrowRight className="mr-1 h-3 w-3" />
                          Move to {next}
                        </Button>
                      )}
                      {y.status !== 'ACTIVE' && y._count.applicants === 0 && y._count.enrollments === 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[hsl(var(--destructive))]"
                          onClick={() => openDeleteConfirm(y.id, y.yearLabel)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4 border-t border-[hsl(var(--border))] pt-3">
                      <div>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">Grade Levels</span>
                        <p className="font-medium">{y._count.gradeLevels}</p>
                      </div>
                      <div>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">Strands</span>
                        <p className="font-medium">{y._count.strands}</p>
                      </div>
                      <div>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">Applicants</span>
                        <p className="font-medium">{y._count.applicants}</p>
                      </div>
                      <div>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">Enrollments</span>
                        <p className="font-medium">{y._count.enrollments}</p>
                      </div>
                      {y.startDate && (
                        <div>
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">Start</span>
                          <p className="font-medium">{new Date(y.startDate).toLocaleDateString()}</p>
                        </div>
                      )}
                      {y.endDate && (
                        <div>
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">End</span>
                          <p className="font-medium">{new Date(y.endDate).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Wizard Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => { if (!open) { resetWizard(); setShowCreate(false); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New School Year</DialogTitle>
            <DialogDescription>Step {step} of 3</DialogDescription>
          </DialogHeader>

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Year Label</Label>
                <Input 
                  placeholder="e.g. S.Y. 2025–2026" 
                  value={yearLabel} 
                  onChange={(e) => {
                    setYearLabel(e.target.value);
                    setIsManualLabel(true);
                  }} 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Optionally clone grade levels, sections, and strands from an existing year.
              </p>
              <div className="space-y-2">
                {years.map((y) => (
                  <button
                    key={y.id}
                    onClick={() => setCloneFrom(cloneFrom === y.id ? null : y.id)}
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm transition-colors ${
                      cloneFrom === y.id
                        ? 'border-[hsl(var(--primary))] bg-[hsl(var(--accent-muted))]'
                        : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Copy className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                      <span className="font-medium">{y.yearLabel}</span>
                    </div>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      {y._count.gradeLevels} levels · {y._count.strands} strands
                    </span>
                  </button>
                ))}
                {years.length === 0 && (
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">No existing years to clone from.</p>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Review</p>
              <div className="rounded-lg border border-[hsl(var(--border))] p-3 space-y-1 text-sm">
                <p><span className="text-[hsl(var(--muted-foreground))]">Label:</span> {yearLabel}</p>
                {startDate && <p><span className="text-[hsl(var(--muted-foreground))]">Start:</span> {startDate}</p>}
                {endDate && <p><span className="text-[hsl(var(--muted-foreground))]">End:</span> {endDate}</p>}
                <p>
                  <span className="text-[hsl(var(--muted-foreground))]">Clone:</span>{' '}
                  {cloneFrom ? years.find((y) => y.id === cloneFrom)?.yearLabel : 'None'}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
            )}
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)} disabled={step === 1 && !yearLabel.trim()}>
                Next
              </Button>
            ) : (
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? 'Creating...' : 'Create'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete School Year"
        description={`Are you sure you want to delete "${deleteLabel}"? This action cannot be undone and will remove all associated structure.`}
        confirmText="Delete"
        confirmVariant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

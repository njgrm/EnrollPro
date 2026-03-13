import { useState, useEffect, useRef } from 'react';
import { sileo } from 'sileo';
import { Clock, CalendarClock, Timer } from 'lucide-react';
import api from '@/api/axiosInstance';
import { useSettingsStore } from '@/stores/settingsStore';
import { toastApiError } from '@/hooks/useApiToast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0d 0h 0m';
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(' ');
}

export default function EnrollmentGateTab() {
  const { enrollmentOpen, enrollmentOpenAt, enrollmentCloseAt, setSettings } = useSettingsStore();
  const [toggling, setToggling] = useState(false);
  const [openAt, setOpenAt] = useState(enrollmentOpenAt ?? '');
  const [closeAt, setCloseAt] = useState(enrollmentCloseAt ?? '');
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [countdownLabel, setCountdownLabel] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    setOpenAt(enrollmentOpenAt ?? '');
    setCloseAt(enrollmentCloseAt ?? '');
  }, [enrollmentOpenAt, enrollmentCloseAt]);

  // Countdown timer
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      if (enrollmentOpen && enrollmentCloseAt) {
        const diff = new Date(enrollmentCloseAt).getTime() - now;
        if (diff > 0) {
          setCountdown(formatCountdown(diff));
          setCountdownLabel('Enrollment closes in');
          return;
        }
      }
      if (!enrollmentOpen && enrollmentOpenAt) {
        const diff = new Date(enrollmentOpenAt).getTime() - now;
        if (diff > 0) {
          setCountdown(formatCountdown(diff));
          setCountdownLabel('Enrollment opens in');
          return;
        }
      }
      setCountdown('');
      setCountdownLabel('');
    };
    tick();
    intervalRef.current = setInterval(tick, 60000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [enrollmentOpen, enrollmentOpenAt, enrollmentCloseAt]);

  const handleToggleGate = async (open: boolean) => {
    setToggling(true);
    try {
      await api.patch('/settings/enrollment-gate', { enrollmentOpen: open });
      setSettings({ enrollmentOpen: open });
      sileo.success({
        title: open ? 'Enrollment Now Open' : 'Enrollment Closed',
        description: open
          ? 'The admission portal is publicly accessible.'
          : 'The admission portal has been disabled.',
      });
    } catch (err) {
      toastApiError(err as never);
    } finally {
      setToggling(false);
    }
  };

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    try {
      await api.put('/settings/enrollment-schedule', {
        enrollmentOpenAt: openAt || null,
        enrollmentCloseAt: closeAt || null,
      });
      setSettings({
        enrollmentOpenAt: openAt || null,
        enrollmentCloseAt: closeAt || null,
      });
      sileo.success({ title: 'Schedule Saved', description: 'Enrollment schedule updated.' });
    } catch (err) {
      toastApiError(err as never);
    } finally {
      setSavingSchedule(false);
    }
  };

  const scheduleChanged =
    (openAt || null) !== (enrollmentOpenAt ?? null) ||
    (closeAt || null) !== (enrollmentCloseAt ?? null);

  return (
    <div className="space-y-6">
      {/* Manual Gate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Clock className="h-5 w-5" />
            Admission Portal
          </CardTitle>
          <CardDescription>
            Control whether the public admission portal accepts new applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Enrollment Status</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {enrollmentOpen
                  ? 'The portal is currently accepting applications'
                  : 'The portal is currently closed to new applications'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={enrollmentOpen ? 'success' : 'danger'}>
                {enrollmentOpen ? 'OPEN' : 'CLOSED'}
              </Badge>
              <Switch
                checked={enrollmentOpen}
                onCheckedChange={handleToggleGate}
                disabled={toggling}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Window */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <CalendarClock className="h-5 w-5" />
            Scheduled Window
          </CardTitle>
          <CardDescription>
            Optionally set start and end dates for automatic enrollment gate control
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Opens At</Label>
              <Input
                type="datetime-local"
                value={openAt ? new Date(openAt).toISOString().slice(0, 16) : ''}
                onChange={(e) => setOpenAt(e.target.value ? new Date(e.target.value).toISOString() : '')}
              />
            </div>
            <div className="space-y-2">
              <Label>Closes At</Label>
              <Input
                type="datetime-local"
                value={closeAt ? new Date(closeAt).toISOString().slice(0, 16) : ''}
                onChange={(e) => setCloseAt(e.target.value ? new Date(e.target.value).toISOString() : '')}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSaveSchedule}
              disabled={savingSchedule || !scheduleChanged}
            >
              {savingSchedule ? 'Saving...' : 'Save Schedule'}
            </Button>
            {(openAt || closeAt) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setOpenAt(''); setCloseAt(''); }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Countdown */}
      {countdown && (
        <Card>
          <CardContent className="py-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <Timer className="h-6 w-6 text-[hsl(var(--primary))]" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{countdownLabel}</p>
              <p className="text-3xl font-bold tabular-nums">{countdown}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        Note: The manual toggle takes immediate effect. The scheduled window is informational and can be used for planning. To automate gate opening/closing, integrate a cron job that checks these timestamps.
      </p>
    </div>
  );
}

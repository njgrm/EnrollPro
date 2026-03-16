import { useFormContext } from 'react-hook-form';
import type { AdmissionFormData } from '../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DatePicker } from '@/components/ui/date-picker';
import { Info, AlertCircle } from 'lucide-react';
import { differenceInYears } from 'date-fns';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Step1Personal() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<AdmissionFormData>();
  const birthdate = watch('birthdate');

  const onBirthdateChange = (date: Date | undefined) => {
    if (date) {
      setValue('birthdate', date);
      const age = differenceInYears(new Date(), date);
      setValue('age', age);
    }
  };

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="lastName" className="text-sm font-semibold">Last Name <span className="text-destructive">*</span></Label>
          <Input id="lastName" {...register('lastName')} autoComplete="off" placeholder="e.g. DELA CRUZ" className={cn("h-11 uppercase font-bold", errors.lastName && "border-destructive focus-visible:ring-destructive")} />
          {errors.lastName && <p className="text-[11px] text-destructive font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.lastName.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="firstName" className="text-sm font-semibold">First Name <span className="text-destructive">*</span></Label>
          <Input id="firstName" {...register('firstName')} autoComplete="off" placeholder="e.g. JUAN" className={cn("h-11 uppercase font-bold", errors.firstName && "border-destructive focus-visible:ring-destructive")} />
          {errors.firstName && <p className="text-[11px] text-destructive font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.firstName.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="middleName" className="text-sm font-semibold">Middle Name</Label>
          <Input id="middleName" {...register('middleName')} autoComplete="off" placeholder="Write N/A if none" className="h-11 uppercase font-bold" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="extensionName" className="text-sm font-semibold">Suffix (Extension)</Label>
          <Select onValueChange={(val) => setValue('extensionName', val)} defaultValue={watch('extensionName') || 'N/A'}>
            <SelectTrigger className="h-11 font-bold">
              <SelectValue placeholder="Select Suffix" />
            </SelectTrigger>
            <SelectContent>
              {['N/A', 'Jr.', 'Sr.', 'II', 'III', 'IV', 'V'].map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Date of Birth <span className="text-destructive">*</span></Label>
          <DatePicker 
            date={birthdate} 
            setDate={onBirthdateChange} 
            minDate={new Date("2010-01-01")} 
            maxDate={new Date()} 
            placeholder="Select Birthdate"
            className={cn("h-11 font-bold border-input", errors.birthdate && "border-destructive")}
          />
          {errors.birthdate && <p className="text-[11px] text-destructive font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.birthdate.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="age" className="text-sm font-semibold">Age</Label>
          <Input id="age" {...register('age', { valueAsNumber: true })} autoComplete="off" readOnly className="h-11 bg-muted/50 text-muted-foreground font-bold cursor-not-allowed" />
          <p className="text-[10px] text-muted-foreground italic">Auto-calculated from birthdate</p>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-semibold">Sex <span className="text-destructive">*</span></Label>
          <RadioGroup 
            defaultValue={watch('sex')} 
            onValueChange={(val) => setValue('sex', val as 'Male' | 'Female')}
            className="flex gap-6 pt-1"
          >
            <div className="flex items-center space-x-2.5">
              <RadioGroupItem value="Male" id="sex-male" className="w-5 h-5 border-[hsl(var(--accent))] text-[hsl(var(--accent))]" />
              <Label htmlFor="sex-male" className="font-medium cursor-pointer">Male</Label>
            </div>
            <div className="flex items-center space-x-2.5">
              <RadioGroupItem value="Female" id="sex-female" className="w-5 h-5 border-[hsl(var(--accent))] text-[hsl(var(--accent))]" />
              <Label htmlFor="sex-female" className="font-medium cursor-pointer">Female</Label>
            </div>
          </RadioGroup>
          <p className="text-[10px] text-muted-foreground italic">As recorded on PSA Birth Certificate</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="placeOfBirth" className="text-sm font-semibold">Place of Birth <span className="text-destructive">*</span></Label>
          <Input id="placeOfBirth" {...register('placeOfBirth')} autoComplete="off" placeholder="City/Municipality, Province" className={cn("h-11 font-bold", errors.placeOfBirth && "border-destructive")} />
          {errors.placeOfBirth && <p className="text-[11px] text-destructive font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.placeOfBirth.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="religion" className="text-sm font-semibold">Religion</Label>
          <Input id="religion" {...register('religion')} autoComplete="off" placeholder="e.g. Roman Catholic" className="h-11 font-bold" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="motherTongue" className="text-sm font-semibold">Mother Tongue <span className="text-destructive">*</span></Label>
          <Select onValueChange={(val) => setValue('motherTongue', val)} defaultValue={watch('motherTongue')}>
            <SelectTrigger className={cn("h-11 font-bold", errors.motherTongue && "border-destructive")}>
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent>
              {['Hiligaynon', 'Cebuano', 'Filipino', 'English', 'Waray', 'Kinaray-a', 'Other'].map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.motherTongue && <p className="text-[11px] text-destructive font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.motherTongue.message}</p>}
          <p className="text-[10px] text-muted-foreground italic">The language first learned at home</p>
        </div>
      </div>

      <div className="pt-6 border-t border-border/40">
        <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-6">Reference Numbers</h3>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="lrn" className="text-sm font-semibold">Learner Reference Number (LRN)</Label>
              <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
            </div>
            <Input id="lrn" {...register('lrn')} autoComplete="off" placeholder="000000000000" maxLength={12} className="h-11 font-mono tracking-widest font-bold" />
            <p className="text-[10px] text-muted-foreground italic">12 digits — found on your Grade 6 Report Card (SF9).</p>
            {errors.lrn && <p className="text-[11px] text-destructive font-medium">{errors.lrn.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="psaBcNumber" className="text-sm font-semibold">PSA Birth Certificate Number</Label>
            <Input id="psaBcNumber" {...register('psaBcNumber')} autoComplete="off" placeholder="PSA BC Number" className="h-11 font-bold" />
            <p className="text-[10px] text-muted-foreground italic">Found on the birth certificate (optional — submit by Oct 31).</p>
          </div>
        </div>
      </div>
    </div>
  );
}

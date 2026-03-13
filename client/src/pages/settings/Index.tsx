import { useSearchParams } from 'react-router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SchoolProfileTab from './SchoolProfileTab';
import AcademicYearTab from './AcademicYearTab';
import CurriculumTab from './CurriculumTab';
import SectionsTab from './SectionsTab';
import EnrollmentGateTab from './EnrollmentGateTab';

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Configuration</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Manage school identity, school year, curriculum, and enrollment settings
        </p>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="w-full flex flex-wrap h-auto gap-1">
          <TabsTrigger value="profile" className="flex-1 min-w-[100px]">School Profile</TabsTrigger>
          <TabsTrigger value="academic-year" className="flex-1 min-w-[100px]">School Year</TabsTrigger>
          <TabsTrigger value="curriculum" className="flex-1 min-w-[100px]">Curriculum</TabsTrigger>
          <TabsTrigger value="sections" className="flex-1 min-w-[100px]">Sections</TabsTrigger>
          <TabsTrigger value="enrollment" className="flex-1 min-w-[100px]">Enrollment Gate</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <SchoolProfileTab />
        </TabsContent>
        <TabsContent value="academic-year">
          <AcademicYearTab />
        </TabsContent>
        <TabsContent value="curriculum">
          <CurriculumTab />
        </TabsContent>
        <TabsContent value="sections">
          <SectionsTab />
        </TabsContent>
        <TabsContent value="enrollment">
          <EnrollmentGateTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

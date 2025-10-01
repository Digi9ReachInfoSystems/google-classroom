import TeacherPiCharts from "./modules/teacherpicharts";
import TeacherPidata from "./modules/teacherpidata";
import { FilterProvider } from "./modules/FilterContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function TeacherDistrictReports() {
    return (
        <FilterProvider>
            {/* Desktop: keep existing layout unchanged */}
            <div className="hidden md:block">
                <TeacherPiCharts />
                <TeacherPidata />
            </div>

            {/* Mobile: show tabs for a responsive view */}
            <div className="md:hidden px-4 py-2">
                <Tabs defaultValue="charts">
                    <TabsList className="w-full overflow-x-auto rounded-full bg-neutral-100">
                        <TabsTrigger value="charts" className="whitespace-nowrap">Charts</TabsTrigger>
                        <TabsTrigger value="data" className="whitespace-nowrap">Data</TabsTrigger>
                    </TabsList>
                    <TabsContent value="charts">
                        <TeacherPiCharts />
                    </TabsContent>
                    <TabsContent value="data">
                        <TeacherPidata />
                    </TabsContent>
                </Tabs>
            </div>
        </FilterProvider>
    );
}
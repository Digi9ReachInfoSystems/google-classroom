import CoursePartition from "@/components/superadmin/superadmincoursemetric/courseparticipation/courseparticipation";
import CompletionTable from "@/components/superadmin/superadmincoursemetric/completiontable/completiontable";
import ProgressTrends from "@/components/superadmin/superadmincoursemetric/progresstrends/progresstrends";

export default function Page() {
  return (
    <div className="px-5 space-y-6">
      <CoursePartition />
      <CompletionTable />
      <ProgressTrends />
    </div>
  );
}
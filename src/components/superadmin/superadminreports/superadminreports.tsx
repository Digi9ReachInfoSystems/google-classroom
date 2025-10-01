import CourseStatus from "./coursestatus/coursestatus";
import Ideasubmitted from "./ideasubmitted/ideasubmitted";
import Reports from "./reports/reports";
import Reporttable from "./reporttable/reporttable";

export default function Superadminreports() {
  return (
    <>
    <div className="px-5">
  <Reports />
      <Reporttable />
      <Ideasubmitted />
      <CourseStatus />

    </div>
    
    </>
  );
}

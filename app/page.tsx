import { ResumeSite } from "@/components/ResumeSite";
import { Resume } from "@/lib/schema";
import data from "@/data/resume.json";

// Your site. Edit data/resume.json (or make one at /create) and this page updates.
export default function Home() {
  return <ResumeSite resume={Resume.parse(data)} />;
}

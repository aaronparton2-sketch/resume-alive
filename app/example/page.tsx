import { ResumeSite } from "@/components/ResumeSite";
import { Resume } from "@/lib/schema";
import data from "@/data/example.json";

export const metadata = { title: "Jordan Hale | Example resume" };

// A made-up person, so you can see every section filled in.
export default function Example() {
  return <ResumeSite resume={Resume.parse(data)} sendResume />;
}

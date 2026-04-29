import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { LeadForm } from "@/components/lead-form";

export default function NewLeadPage() {
  return (
    <div>
      <PageHeader title="New lead" description="Create a lead manually." />
      <Card>
        <CardContent className="p-6">
          <LeadForm />
        </CardContent>
      </Card>
    </div>
  );
}

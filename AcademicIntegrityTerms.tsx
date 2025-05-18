import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface AcademicIntegrityTermsProps {
  accepted: boolean;
  onAcceptChange: (accepted: boolean) => void;
}

export default function AcademicIntegrityTerms({
  accepted,
  onAcceptChange,
}: AcademicIntegrityTermsProps) {
  return (
    <Card className="bg-muted/30">
      <CardHeader>
        <CardTitle>Academic Integrity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] bg-card p-4 rounded-lg mb-4">
          <div className="pr-4">
            <h4 className="font-bold mb-2">Empowering Writers, Not Replacing Them</h4>
            <p className="mb-3 text-sm">
              At Scholarly Snippets, we believe in the transformative power of authentic academic expression. In an era where AI and automated tools can generate content instantly, we take a principled stand: we do not ghostwrite or produce content for our clients.
            </p>
            <p className="mb-3 text-sm">
              Instead, we serve as mentors and coaches, guiding you through the intellectual journey of developing your own voice. Our consultations focus on helping you articulate your unique insights, strengthen your arguments, and master the conventions of academic writing—all while ensuring the ideas and words remain authentically yours.
            </p>
            <p className="scholarly-highlight">
              "We don't write for you—we empower you to become the confident, skilled writer you're meant to be."
            </p>
          </div>
        </ScrollArea>
        
        <div className="flex items-start space-x-3">
          <Checkbox 
            id="terms-agreement" 
            checked={accepted} 
            onCheckedChange={(checked) => onAcceptChange(checked === true)}
          />
          <Label htmlFor="terms-agreement" className="text-sm text-muted-foreground">
            I understand and agree that Scholarly Snippets provides feedback and guidance only, and does not write content on my behalf.
          </Label>
        </div>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent } from "@/components/ui/card";

export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: "Submit Your Text",
      description: "Upload your document or paste your text for review."
    },
    {
      number: 2,
      title: "Get Expert Feedback",
      description: "Receive detailed suggestions and improvements from our consultants."
    },
    {
      number: 3,
      title: "Revise & Excel",
      description: "Apply our guidance to enhance your academic writing."
    }
  ];

  return (
    <section className="mb-8">
      <h3 className="text-xl font-bold text-primary mb-4">How It Works</h3>
      
      <Card>
        <CardContent className="p-5">
          <ol className="space-y-6">
            {steps.map((step) => (
              <li key={step.number} className="flex items-start">
                <div className="bg-secondary text-white rounded-full w-7 h-7 flex items-center justify-center shrink-0 mt-0.5 mr-3">
                  {step.number}
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-1">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </section>
  );
}

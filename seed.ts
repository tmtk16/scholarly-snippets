import { db } from "./db";
import { services } from "@shared/schema";

async function seedDatabase() {
  console.log("Seeding the database with initial data...");
  
  // Check if services already exist
  const existingServices = await db.select().from(services);
  
  if (existingServices.length === 0) {
    console.log("Adding default services...");
    
    // Add default services
    await db.insert(services).values([
      {
        name: "Standard Review",
        description: "Comprehensive feedback on your academic writing with detailed suggestions for improvement in structure, clarity, flow, and argumentation.",
        price: 1500, // $15.00
        turnaround: 72, // 3 days in hours
        isExpress: false,
      },
      {
        name: "Express Review",
        description: "Expedited feedback for time-sensitive submissions. Same comprehensive review with priority handling for urgent deadlines.",
        price: 3000, // $30.00
        turnaround: 24, // 24 hours
        isExpress: true,
      },
      {
        name: "Statement of Purpose",
        description: "Specialized feedback for graduate school, scholarship, or fellowship application statements, focusing on impact, clarity, and personal narrative.",
        price: 1500, // $15.00
        turnaround: 72, // 3 days in hours
        isExpress: false,
      },
      {
        name: "Research Paper Review",
        description: "Detailed feedback on academic research papers, with attention to argumentation, methodology presentation, and academic conventions.",
        price: 1500, // $15.00
        turnaround: 72, // 3 days in hours
        isExpress: false,
      }
    ]);
    
    console.log("Default services added successfully.");
  } else {
    console.log("Services already exist, skipping seed.");
  }
  
  console.log("Seeding completed successfully!");
}

seedDatabase()
  .catch(error => {
    console.error("Error seeding database:", error);
    process.exit(1);
  })
  .finally(() => {
    // Close the database connection
    process.exit(0);
  });
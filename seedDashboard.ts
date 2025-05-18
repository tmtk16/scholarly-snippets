import { db } from "./db";
import { users, services, submissions } from "../shared/schema";
import { hashPassword } from "./auth";

async function seedDashboardData() {
  console.log("Seeding dashboard data...");
  
  try {
    // Check if we already have test data
    const existingSubmissions = await db.select().from(submissions);
    if (existingSubmissions.length > 0) {
      console.log(`Database already has ${existingSubmissions.length} submissions. Skipping seed.`);
      return;
    }
    
    // Create a test user if one doesn't exist
    const existingUsers = await db.select().from(users);
    let testUserId: number;
    
    if (existingUsers.length > 0) {
      testUserId = existingUsers[0].id;
      console.log(`Using existing user ID ${testUserId} for test data`);
    } else {
      const hashedPassword = await hashPassword("password123");
      const [newUser] = await db.insert(users).values({
        username: "testuser",
        password: hashedPassword,
        name: "Test User",
        email: "test@example.com",
        submissionCount: 0
      }).returning();
      
      testUserId = newUser.id;
      console.log(`Created test user with ID ${testUserId}`);
    }
    
    // Make sure we have services
    const existingServices = await db.select().from(services);
    let standardServiceId: number;
    let expressServiceId: number;
    
    if (existingServices.length > 0) {
      standardServiceId = existingServices.find(s => !s.isExpress)?.id || existingServices[0].id;
      expressServiceId = existingServices.find(s => s.isExpress)?.id || existingServices[0].id;
    } else {
      const [standardService] = await db.insert(services).values({
        name: "Standard Review",
        description: "Comprehensive writing review with 72-hour turnaround",
        price: 1500, // $15 per 500 words
        turnaround: 72, // 72 hours
        isExpress: false
      }).returning();
      
      const [expressService] = await db.insert(services).values({
        name: "Express Review",
        description: "Expedited review with 24-hour turnaround",
        price: 3000, // $30 per 500 words
        turnaround: 24, // 24 hours
        isExpress: true
      }).returning();
      
      standardServiceId = standardService.id;
      expressServiceId = expressService.id;
      console.log(`Created services with IDs ${standardServiceId} and ${expressServiceId}`);
    }
    
    // Create sample submissions in different states
    const sampleSubmissions = [
      // Pending approval
      {
        userId: testUserId,
        serviceId: standardServiceId,
        title: "Research Paper on Climate Change",
        content: `# Introduction
Climate change represents one of the most significant challenges facing humanity in the 21st century. This paper examines the scientific evidence for anthropogenic climate change and evaluates potential mitigation strategies.

# Methodology
This research utilizes a mixed-methods approach, combining quantitative analysis of temperature data from the past century with qualitative assessment of policy documents from major international climate agreements.

# Results
The data clearly demonstrates a statistically significant warming trend that correlates strongly with increased greenhouse gas emissions. Policy analysis reveals significant gaps between stated goals and implemented measures.

# Discussion
While the scientific consensus on climate change is robust, political and economic barriers continue to hamper effective action. This section explores the disconnect between scientific understanding and policy implementation.

# Conclusion
Addressing climate change requires coordinated global action that balances immediate economic concerns with long-term environmental sustainability. This paper recommends specific policy interventions based on successful case studies.`,
        wordCount: 1500,
        promptInstructions: "Write a research paper examining the scientific evidence for climate change and evaluating potential mitigation strategies. The paper should be well-structured with clear sections.",
        additionalInstructions: "Please focus on making the literature review section stronger and improving the flow between sections.",
        status: "pending_approval",
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        totalPrice: 4500 // $45 for 1500 words
      },
      
      // Approved, awaiting payment
      {
        userId: testUserId,
        serviceId: expressServiceId,
        title: "Statement of Purpose for Graduate Application",
        content: `My interest in computer science began when I was twelve years old and my father brought home our first computer. What started as curiosity quickly evolved into a passion as I taught myself basic programming through online tutorials. By high school, I was developing simple games and applications, which solidified my decision to pursue computer science in college.

During my undergraduate studies at XYZ University, I maintained a 3.8 GPA while taking advanced courses in artificial intelligence, machine learning, and distributed systems. My senior thesis on "Optimizing Neural Networks for Edge Computing" was recognized with the department's Outstanding Research Award.

Beyond academics, I gained practical experience through two internships. At Company A, I worked with a team developing cloud infrastructure solutions, while at Company B, I contributed to an open-source machine learning library. These experiences taught me both technical skills and the importance of collaboration in solving complex problems.

I am now applying to your graduate program because its emphasis on cutting-edge AI research aligns perfectly with my career goals. I am particularly interested in working with Professor Johnson on explainable AI and Professor Smith on reinforcement learning applications.

With a graduate degree from your institution, I aim to pursue a career in research, either in academia or at a leading technology company, where I can contribute to solving the next generation of computing challenges. I believe my academic background, technical skills, and passion for innovation make me an ideal candidate for your program.`,
        wordCount: 250,
        promptInstructions: "Write a statement of purpose for a graduate school application in computer science. The statement should highlight your background, research experience, and career goals.",
        additionalInstructions: "I'd like to emphasize my interest in AI and machine learning. Also, please help make my personal story more compelling.",
        status: "approved",
        submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        approvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        totalPrice: 1500 // $15 for 250 words
      },
      
      // Paid, in review
      {
        userId: testUserId,
        serviceId: standardServiceId,
        title: "Literature Review on Renewable Energy Technologies",
        content: `This literature review examines recent advances in renewable energy technologies, with a focus on solar, wind, and hydroelectric power. The review covers technological innovations, economic considerations, and policy frameworks that influence adoption rates.

Solar power has seen significant efficiency improvements in the past decade. Li et al. (2019) reported a breakthrough in perovskite solar cells, achieving 25% efficiency in laboratory conditions. Meanwhile, Wang and Johnson (2020) documented successful scaling of this technology for commercial applications, though challenges in durability remain.

Wind energy research has focused on both onshore and offshore installations. The work by Martinez et al. (2018) suggests that floating offshore wind farms can significantly increase global wind energy potential by accessing deep-water locations with stronger and more consistent wind patterns. Cost remains a challenge, as highlighted by Patel's (2021) economic analysis.

Hydroelectric power, while a mature technology, continues to evolve. Recent innovations focus on environmental impact mitigation, as documented by Yamamoto et al. (2022), who designed fish-friendly turbines that reduce mortality rates by 60% compared to conventional designs.

Integration challenges across renewable technologies were comprehensively addressed by Zhang and Williams (2021), who proposed AI-based grid management systems to balance variable production from different renewable sources.

This review identifies several research gaps, particularly in the areas of energy storage solutions, grid integration strategies, and adaptations for developing economy contexts.`,
        wordCount: 800,
        promptInstructions: "Write a literature review on recent advances in renewable energy technologies. The review should cover major technological innovations, economic considerations, and policy frameworks.",
        additionalInstructions: "Please make sure to include recent academic sources (within the last 5 years) and identify research gaps for future study.",
        status: "paid",
        submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        approvedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
        paidAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        totalPrice: 2400 // $24 for 800 words
      },
      
      // Completed with feedback
      {
        userId: testUserId,
        serviceId: expressServiceId,
        title: "Scholarship Essay on Community Leadership",
        content: `When the community center in my neighborhood closed due to budget cuts, many children lost access to after-school programs that provided academic support and safe recreation. As a high school junior who had benefited from these programs, I felt compelled to act. 

I started by organizing a meeting with classmates, teachers, and parents to discuss possible solutions. From this meeting emerged "HomeWork Hub," a student-led initiative to provide free tutoring and mentorship at the local library. I developed a schedule, recruited 15 volunteer tutors from my school's honor society, and coordinated with the library for space.

The biggest challenge came when we needed to expand to meet growing demand. I reached out to the school board and presented our impact data: 40 regular attendees with improved grades and reduced disciplinary issues. The board was impressed and agreed to provide transportation for students to the library and small stipends for supplies.

Within six months, HomeWork Hub was serving over 80 students weekly. We expanded our offerings to include SAT prep and college application workshops for older students. The program's success caught media attention, which helped us secure a small grant from a local business.

This experience taught me that effective leadership isn't just about having good ideas, but about listening to community needs, building relationships, and persisting through challenges. Most importantly, I learned that young people don't need to wait to make a difference—we can address community challenges now through initiative and collaboration.

HomeWork Hub continues today, led by a new generation of high school students. I'm proud that my initiative has become sustainable, growing beyond my direct involvement to become a valued community resource.`,
        wordCount: 300,
        promptInstructions: "Write a scholarship essay describing a leadership experience that has had a significant impact on your life and/or community. The essay should demonstrate initiative, challenges overcome, and lessons learned.",
        additionalInstructions: null,
        status: "completed",
        submittedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        approvedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        paidAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000), // 13 days ago
        completedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
        feedback: `# Highlighted Feedback

## Highlight 1
> "When the community center in my neighborhood closed due to budget cuts, many children lost access to after-school programs that provided academic support and safe recreation."

Great opening that immediately establishes the problem and sets up your motivation for action. Consider adding a brief emotional component about how this made you feel to create even more connection with the reader.

## Highlight 2
> "I started by organizing a meeting with classmates, teachers, and parents to discuss possible solutions."

This demonstrates excellent initiative and collaborative leadership. Consider expanding slightly on how you convinced these stakeholders to join your effort.

## Highlight 3
> "The biggest challenge came when we needed to expand to meet growing demand."

Strong identification of a key challenge. Your approach to using data to persuade the school board shows sophisticated problem-solving and persuasive skills.

## Highlight 4
> "This experience taught me that effective leadership isn't just about having good ideas, but about listening to community needs, building relationships, and persisting through challenges."

Excellent reflection that shows personal growth and a mature understanding of leadership. This is exactly what scholarship committees look for.

Overall, this is a compelling essay that clearly demonstrates leadership, initiative, and community impact. Your narrative arc is strong, showing problem identification, solution development, challenge navigation, and meaningful outcomes.

To strengthen it further:
1. Consider adding 1-2 specific examples of individual students who benefited from your program to add emotional resonance
2. Briefly mention how this experience connects to your future goals
3. Add a small detail about a moment when you felt discouraged but persevered

The essay is well-structured and focused on your prompt. With these minor additions, it would be even more impactful for scholarship committees.`,
        totalPrice: 1800 // $18 for 300 words
      },
      
      // Rejected submission
      {
        userId: testUserId,
        serviceId: standardServiceId,
        title: "Term Paper on Artificial Intelligence Ethics",
        content: `This paper examines the ethical implications of artificial intelligence development and deployment. Areas of focus include privacy concerns, algorithmic bias, autonomous decision-making, and regulatory frameworks.`,
        wordCount: 100,
        promptInstructions: "Write a comprehensive term paper examining the ethical implications of artificial intelligence in modern society.",
        additionalInstructions: "I need at least 1500 words with academic citations.",
        status: "rejected",
        submittedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        totalPrice: 300 // $3 for 100 words
      }
    ];
    
    // Insert sample submissions
    for (const submission of sampleSubmissions) {
      await db.insert(submissions).values(submission);
    }
    
    console.log(`Created ${sampleSubmissions.length} sample submissions for testing`);
    
    // Update user's submission count
    await db.update(users)
      .set({ submissionCount: sampleSubmissions.length })
      .where(users.id.eq(testUserId));
      
    console.log("Seed completed successfully!");
    
  } catch (error) {
    console.error("Error seeding dashboard data:", error);
  }
}

seedDashboardData().catch(console.error);
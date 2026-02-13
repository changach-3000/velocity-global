/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("lesson_content");

  const record0 = new Record(collection);
    record0.set("lesson_id", "lesson1");
    record0.set("content_body", "Leasing is a contractual arrangement where one party (lessor) grants another party (lessee) the right to use an asset for a specified period in exchange for periodic payments. This comprehensive introduction covers the history of leasing, its importance in modern business, and fundamental concepts. Leasing has evolved from simple equipment rentals to complex financial arrangements involving real estate, vehicles, and technology. Understanding leasing is crucial for finance professionals, business owners, and investors.");
    record0.set("video_url", "https://www.youtube.com/embed/dQw4w9WgXcQ");
  app.save(record0);

  const record1 = new Record(collection);
    record1.set("lesson_id", "lesson2");
    record1.set("content_body", "Operating Leases: Short-term leases where the lessor retains ownership and risks. The lessee uses the asset but does not own it. Examples: car rentals, office equipment leasing. Finance Leases: Long-term leases where the lessee assumes most risks and benefits of ownership. The lessee may have the option to purchase at lease end. Key differences: ownership, risk allocation, accounting treatment, and financial impact.");
  app.save(record1);

  const record2 = new Record(collection);
    record2.set("lesson_id", "lesson3");
    record2.set("content_body", "IFRS 16 and ASC 842 fundamentally changed lease accounting. Under these standards, most leases are recognized on the balance sheet as right-of-use (ROU) assets with corresponding lease liabilities. Key concepts: Initial measurement, subsequent measurement, lease modifications, and disclosure requirements. This section covers the accounting mechanics and practical application of these standards.");
    record2.set("video_url", "https://www.youtube.com/embed/dQw4w9WgXcQ");
  app.save(record2);

  const record3 = new Record(collection);
    record3.set("lesson_id", "lesson4");
    record3.set("content_body", "Lease valuation involves calculating the present value of lease payments. Key formulas: PV = PMT \u00d7 [(1 - (1 + r)^-n) / r], where PMT is periodic payment, r is discount rate, and n is number of periods. This section covers lease payment calculations, implicit interest rates, and how to analyze lease terms to determine if a lease is favorable. Includes worked examples and practical scenarios.");
  app.save(record3);

  const record4 = new Record(collection);
    record4.set("lesson_id", "lesson5");
    record4.set("content_body", "Real-world lease structures vary significantly across industries. Equipment leasing in manufacturing, real estate leasing in retail, vehicle leasing in logistics, and technology leasing in IT services all have unique characteristics. This section examines case studies from different industries, showing how lease structures are tailored to specific business needs and risk profiles.");
    record4.set("video_url", "https://www.youtube.com/embed/dQw4w9WgXcQ");
  app.save(record4);

  const record5 = new Record(collection);
    record5.set("lesson_id", "lesson6");
    record5.set("content_body", "The regulatory landscape for leasing includes IFRS 16, ASC 842, and various tax regulations. Key compliance areas: proper lease classification, accurate financial reporting, disclosure requirements, and audit considerations. Organizations must maintain detailed lease registers, track modifications, and ensure timely recognition of lease obligations. This section covers regulatory requirements and best practices for compliance.");
  app.save(record5);

  const record6 = new Record(collection);
    record6.set("lesson_id", "lesson7");
    record6.set("content_body", "Successful lease negotiation requires understanding both lessor and lessee perspectives. Key negotiation points: lease term, payment amount, residual value, maintenance responsibilities, and termination clauses. Red flags to watch: hidden fees, unfavorable residual value assumptions, restrictive covenants, and inflexible terms. Best practices include obtaining competitive quotes, understanding market rates, and having legal review of lease agreements.");
  app.save(record6);

  const record7 = new Record(collection);
    record7.set("lesson_id", "lesson8");
    record7.set("content_body", "Common mistakes in lease accounting include: misclassifying leases, incorrect present value calculations, failing to account for lease modifications, improper residual value estimates, and inadequate disclosure. This section highlights real-world examples of these errors and their financial impact. Understanding these pitfalls helps professionals avoid costly mistakes in lease analysis and accounting.");
    record7.set("video_url", "https://www.youtube.com/embed/dQw4w9WgXcQ");
  app.save(record7);

  const record8 = new Record(collection);
    record8.set("lesson_id", "lesson9");
    record8.set("content_body", "This comprehensive exercise requires analyzing a complete lease scenario. You will receive a sample lease agreement and must: (1) Classify the lease as operating or finance, (2) Calculate the present value of lease payments, (3) Determine the right-of-use asset and lease liability, (4) Identify accounting treatment under IFRS 16/ASC 842, (5) Prepare disclosure notes. This practical exercise integrates all course concepts.");
  app.save(record8);

  const record9 = new Record(collection);
    record9.set("lesson_id", "lesson10");
    record9.set("content_body", "This course has covered fundamental leasing concepts, lease types, accounting standards, valuation techniques, real-world applications, compliance requirements, and practical analysis skills. Key takeaways: leasing is a critical financing tool, proper accounting is essential, and thorough analysis protects organizations. Next steps: explore advanced leasing topics, stay current with regulatory changes, and apply these concepts in your professional practice.");
  app.save(record9);
}, (app) => {
  // Rollback: record IDs not known, manual cleanup needed
})

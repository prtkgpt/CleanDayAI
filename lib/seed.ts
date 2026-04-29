import { AutomationType, LeadSource, LeadStatus, BookingStatus, MessageDirection, MessageSender } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export async function seedAwesomeMaids() {
  // Wipe existing tenant data so the seed is idempotent.
  await prisma.reviewRequest.deleteMany();
  await prisma.message.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.pricingRule.deleteMany();
  await prisma.automationRule.deleteMany();
  await prisma.user.deleteMany();
  await prisma.business.deleteMany();

  const business = await prisma.business.create({
    data: {
      name: "Awesome Maids",
      phone: "+15555550100",
      twilioNumber: "+15555550100",
      timezone: "America/Los_Angeles",
      serviceArea: "San Diego, CA and surrounding areas (within 25 miles)",
      greeting:
        "Hi! Thanks for reaching out to Awesome Maids 🧼 — happy to help you book a cleaning. Could you share your zip code, number of bedrooms/bathrooms, and the type of clean you're looking for?",
      hoursJson: {
        mon: "8:00-17:00",
        tue: "8:00-17:00",
        wed: "8:00-17:00",
        thu: "8:00-17:00",
        fri: "8:00-17:00",
        sat: "9:00-14:00",
        sun: "closed",
      },
    },
  });

  const passwordHash = await bcrypt.hash("password123", 10);
  await prisma.user.create({
    data: {
      email: "owner@awesomemaids.com",
      name: "Sara Owner",
      passwordHash,
      role: "OWNER",
      businessId: business.id,
    },
  });

  await prisma.pricingRule.createMany({
    data: [
      {
        businessId: business.id,
        name: "Standard Clean",
        serviceType: "STANDARD",
        basePrice: 120,
        perBedroom: 25,
        perBathroom: 20,
        perSqFt: 0.05,
        minPrice: 120,
        notes: "Recurring or one-time standard tidy of an occupied home.",
      },
      {
        businessId: business.id,
        name: "Deep Clean",
        serviceType: "DEEP",
        basePrice: 220,
        perBedroom: 40,
        perBathroom: 35,
        perSqFt: 0.08,
        minPrice: 220,
        notes: "First-time clean or homes that haven't been cleaned in 30+ days.",
      },
      {
        businessId: business.id,
        name: "Move-In / Move-Out",
        serviceType: "MOVE",
        basePrice: 280,
        perBedroom: 50,
        perBathroom: 40,
        perSqFt: 0.1,
        minPrice: 280,
        notes: "Empty home, inside cabinets / fridge / oven included.",
      },
      {
        businessId: business.id,
        name: "Airbnb Turnover",
        serviceType: "AIRBNB",
        basePrice: 95,
        perBedroom: 20,
        perBathroom: 15,
        perSqFt: 0.03,
        minPrice: 95,
        notes: "Quick turnaround between guest stays.",
      },
    ],
  });

  await prisma.automationRule.createMany({
    data: [
      {
        businessId: business.id,
        type: AutomationType.AUTO_REPLY,
        name: "Instant lead reply",
        enabled: true,
        delayHours: 0,
        template:
          "Hi {{name}}! Thanks for reaching out to Awesome Maids. I can put a quote together in a minute — what zip are you in, and how many bedrooms/bathrooms?",
      },
      {
        businessId: business.id,
        type: AutomationType.FOLLOW_UP,
        name: "24h follow-up on quoted leads",
        enabled: true,
        delayHours: 24,
        template:
          "Hi {{name}}, just checking in on the quote we sent for your cleaning. Want me to lock in a date this week?",
      },
      {
        businessId: business.id,
        type: AutomationType.BOOKING_REMINDER,
        name: "Day-before reminder",
        enabled: true,
        delayHours: 24,
        template:
          "Reminder: your Awesome Maids cleaning is scheduled for tomorrow. Reply CONFIRM to confirm or RESCHEDULE if anything changed.",
      },
      {
        businessId: business.id,
        type: AutomationType.REVIEW_REQUEST,
        name: "Post-clean review request",
        enabled: true,
        delayHours: 4,
        template:
          "Thanks for choosing Awesome Maids, {{name}}! If we did a great job, would you mind leaving us a quick Google review? {{link}}",
      },
    ],
  });

  const customer1 = await prisma.customer.create({
    data: {
      businessId: business.id,
      name: "Jamie Rivera",
      phone: "+15555550111",
      email: "jamie@example.com",
      address: "1421 Sunset Cliffs Blvd",
      zip: "92107",
      lifetimeValue: 480,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      businessId: business.id,
      name: "Morgan Lee",
      phone: "+15555550112",
      email: "morgan@example.com",
      address: "884 Park Ave",
      zip: "92104",
      lifetimeValue: 920,
    },
  });

  const newLead = await prisma.lead.create({
    data: {
      businessId: business.id,
      name: "Alex Chen",
      phone: "+15555550120",
      email: "alex@example.com",
      address: "210 Bayview Dr",
      zip: "92101",
      serviceType: "STANDARD",
      bedrooms: 2,
      bathrooms: 2,
      squareFeet: 1100,
      frequency: "biweekly",
      source: LeadSource.WEB_FORM,
      status: LeadStatus.NEW,
      notes: "Web form submitted at 9:14am.",
    },
  });

  const qualifyingLead = await prisma.lead.create({
    data: {
      businessId: business.id,
      name: "Priya Shah",
      phone: "+15555550121",
      address: "55 Adams Ave",
      zip: "92116",
      serviceType: "DEEP",
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1750,
      source: LeadSource.SMS,
      status: LeadStatus.QUALIFYING,
      lastContactedAt: new Date(Date.now() - 1000 * 60 * 30),
    },
  });

  const quotedLead = await prisma.lead.create({
    data: {
      businessId: business.id,
      name: "Derek Wallace",
      phone: "+15555550122",
      zip: "92103",
      serviceType: "MOVE",
      bedrooms: 4,
      bathrooms: 3,
      squareFeet: 2400,
      source: LeadSource.GOOGLE,
      status: LeadStatus.QUOTED,
      quotedPrice: 720,
      lastContactedAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    },
  });

  const escalatedLead = await prisma.lead.create({
    data: {
      businessId: business.id,
      name: "Sam Holloway",
      phone: "+15555550123",
      zip: "92109",
      serviceType: "STANDARD",
      bedrooms: 2,
      bathrooms: 1,
      source: LeadSource.SMS,
      status: LeadStatus.NEEDS_HUMAN,
      needsHuman: true,
      escalationReason: "Customer reported a broken vase from last visit and is upset.",
      lastContactedAt: new Date(Date.now() - 1000 * 60 * 60 * 1),
    },
  });

  const bookedLead = await prisma.lead.create({
    data: {
      businessId: business.id,
      name: "Jamie Rivera",
      phone: customer1.phone,
      email: customer1.email,
      address: customer1.address,
      zip: customer1.zip,
      serviceType: "STANDARD",
      bedrooms: 2,
      bathrooms: 2,
      squareFeet: 1200,
      source: LeadSource.REFERRAL,
      status: LeadStatus.BOOKED,
      quotedPrice: 195,
      customerId: customer1.id,
      lastContactedAt: new Date(Date.now() - 1000 * 60 * 60 * 26),
    },
  });

  await prisma.message.createMany({
    data: [
      {
        businessId: business.id,
        leadId: qualifyingLead.id,
        direction: MessageDirection.INBOUND,
        sender: MessageSender.CUSTOMER,
        body: "Hi, do you guys do deep cleans? I have a 3 bed 2 bath that's been a while.",
        createdAt: new Date(Date.now() - 1000 * 60 * 45),
      },
      {
        businessId: business.id,
        leadId: qualifyingLead.id,
        direction: MessageDirection.OUTBOUND,
        sender: MessageSender.AI,
        body: "Hi Priya! Yes — deep cleans are one of our most popular services. Could you share your zip and approximate square footage so I can put a quote together?",
        createdAt: new Date(Date.now() - 1000 * 60 * 44),
      },
      {
        businessId: business.id,
        leadId: qualifyingLead.id,
        direction: MessageDirection.INBOUND,
        sender: MessageSender.CUSTOMER,
        body: "92116, about 1750 sqft.",
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
      },
      {
        businessId: business.id,
        leadId: quotedLead.id,
        direction: MessageDirection.INBOUND,
        sender: MessageSender.CUSTOMER,
        body: "Need a move-out clean for a 4 bed 3 bath, ~2400 sqft.",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
      },
      {
        businessId: business.id,
        leadId: quotedLead.id,
        direction: MessageDirection.OUTBOUND,
        sender: MessageSender.AI,
        body: "Got it Derek — for a move-out at that size we're looking at $720. Includes inside fridge, oven, and cabinets. Want me to find a slot this week?",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
      },
      {
        businessId: business.id,
        leadId: escalatedLead.id,
        direction: MessageDirection.INBOUND,
        sender: MessageSender.CUSTOMER,
        body: "Your team broke a vase last week. I want a refund.",
        createdAt: new Date(Date.now() - 1000 * 60 * 65),
      },
      {
        businessId: business.id,
        leadId: escalatedLead.id,
        direction: MessageDirection.OUTBOUND,
        sender: MessageSender.SYSTEM,
        body: "[Escalated to human — damage claim / refund request]",
        createdAt: new Date(Date.now() - 1000 * 60 * 64),
      },
    ],
  });

  const now = new Date();
  const inDays = (d: number, h = 10) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() + d);
    dt.setHours(h, 0, 0, 0);
    return dt;
  };

  await prisma.booking.create({
    data: {
      businessId: business.id,
      leadId: bookedLead.id,
      customerId: customer1.id,
      scheduledFor: inDays(2, 10),
      durationMin: 150,
      serviceType: "STANDARD",
      price: 195,
      address: customer1.address,
      status: BookingStatus.CONFIRMED,
      confirmedAt: new Date(),
    },
  });

  await prisma.booking.create({
    data: {
      businessId: business.id,
      customerId: customer2.id,
      scheduledFor: inDays(4, 13),
      durationMin: 180,
      serviceType: "DEEP",
      price: 340,
      address: customer2.address,
      status: BookingStatus.SCHEDULED,
    },
  });

  await prisma.booking.create({
    data: {
      businessId: business.id,
      customerId: customer1.id,
      scheduledFor: inDays(-7, 10),
      durationMin: 150,
      serviceType: "STANDARD",
      price: 185,
      address: customer1.address,
      status: BookingStatus.COMPLETED,
      completedAt: inDays(-7, 12),
    },
  });

  await prisma.reviewRequest.create({
    data: {
      businessId: business.id,
      customerId: customer1.id,
      status: "SENT",
      sentAt: inDays(-7, 16),
      link: "https://g.page/awesomemaids/review",
    },
  });

  return {
    businessId: business.id,
    login: { email: "owner@awesomemaids.com", password: "password123" },
    counts: {
      leads: 5,
      bookings: 3,
      customers: 2,
      pricingRules: 4,
      automationRules: 4,
    },
  };
}

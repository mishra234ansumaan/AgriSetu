import "dotenv/config";
import { db } from "./index";
import {
  farmers,
  crops,
  mandis,
  prices,
  buyers,
  demands,
  listings,
  facilities,
  transporters,
  pools,
  bookings,
} from "./schema";
import { DISTRICTS, todayISO } from "../lib/odisha";

/* deterministic PRNG so judges always see the same believable data */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260117);

async function main() {
  console.log("Clearing tables…");
  await db.delete(bookings);
  await db.delete(pools);
  await db.delete(listings);
  await db.delete(demands);
  await db.delete(prices);
  await db.delete(buyers);
  await db.delete(facilities);
  await db.delete(transporters);
  await db.delete(mandis);
  await db.delete(crops);
  await db.delete(farmers);

  /* -------------------------------- farmers ------------------------------- */
  const farmerRows = await db
    .insert(farmers)
    .values([
      { name: "Suna Pradhan", nameOdia: "ସୁନା ପ୍ରଧାନ", phone: "94371•••214", village: "Tumudibandha", district: "Kandhamal", landAcres: 1.8, kycVerified: true, landVerified: true, satelliteVerified: true, ndvi: 0.71, surveyNo: "OD-KD-1147-B", trustScore: 74 },
      { name: "Mami Behera", nameOdia: "ମାମି ବେହେରା", phone: "98612•••830", village: "Remuna", district: "Balasore", landAcres: 1.2, kycVerified: true, landVerified: true, satelliteVerified: false, ndvi: 0.58, surveyNo: "OD-BL-0092-A", trustScore: 58 },
      { name: "Rabi Nayak", nameOdia: "ରବି ନାୟକ", phone: "90405•••611", village: "Jatni", district: "Khordha", landAcres: 2.4, kycVerified: true, landVerified: true, satelliteVerified: true, ndvi: 0.66, surveyNo: "OD-KH-2210-C", trustScore: 81 },
      { name: "Sukanti Majhi", nameOdia: "ସୁକାନ୍ତି ମାଝି", phone: "88954•••097", village: "Umerkote", district: "Nabarangpur", landAcres: 1.5, kycVerified: true, landVerified: false, satelliteVerified: true, ndvi: 0.62, surveyNo: "OD-NB-0713-D", trustScore: 47 },
      { name: "Daitari Sahoo", nameOdia: "ଦୈତାରୀ ସାହୁ", phone: "97772•••455", village: "Hindol", district: "Dhenkanal", landAcres: 2.1, kycVerified: true, landVerified: true, satelliteVerified: false, ndvi: 0.55, surveyNo: "OD-DH-1564-E", trustScore: 52 },
      { name: "Kamala Soren", nameOdia: "କମଳା ସୋରେନ", phone: "93488•••762", village: "Baripada", district: "Mayurbhanj", landAcres: 1.0, kycVerified: false, landVerified: true, satelliteVerified: true, ndvi: 0.69, surveyNo: "OD-MY-0341-F", trustScore: 63 },
    ])
    .returning();

  /* --------------------------------- crops -------------------------------- */
  const cropDefs = [
    { name: "Paddy (Common)", nameOdia: "ଧାନ", category: "Cereal", icon: "wheat", basePrice: 2183, shelfDays: 120, coldMultiplier: 1.4, perishable: false },
    { name: "Paddy (Grade A)", nameOdia: "ଧାନ (ଗ୍ରେଡ-ଏ)", category: "Cereal", icon: "wheat", basePrice: 2310, shelfDays: 120, coldMultiplier: 1.4, perishable: false },
    { name: "Maize", nameOdia: "ମକା", category: "Cereal", icon: "wheat", basePrice: 2225, shelfDays: 110, coldMultiplier: 1.4, perishable: false },
    { name: "Green Gram (Moong)", nameOdia: "ମୁଗ", category: "Pulse", icon: "salad", basePrice: 7750, shelfDays: 140, coldMultiplier: 1.3, perishable: false },
    { name: "Black Gram (Biri)", nameOdia: "ବିରି", category: "Pulse", icon: "salad", basePrice: 7200, shelfDays: 140, coldMultiplier: 1.3, perishable: false },
    { name: "Groundnut", nameOdia: "ବାଦାମ", category: "Oilseed", icon: "nut", basePrice: 6400, shelfDays: 150, coldMultiplier: 1.3, perishable: false },
    { name: "Mustard", nameOdia: "ସରିଷା", category: "Oilseed", icon: "leaf", basePrice: 5450, shelfDays: 150, coldMultiplier: 1.3, perishable: false },
    { name: "Onion", nameOdia: "ପିଆଜ", category: "Vegetable", icon: "carrot", basePrice: 1150, shelfDays: 60, coldMultiplier: 2.2, perishable: true },
    { name: "Potato", nameOdia: "ଆଳୁ", category: "Vegetable", icon: "carrot", basePrice: 1050, shelfDays: 55, coldMultiplier: 2.6, perishable: true },
    { name: "Tomato", nameOdia: "ଟମାଟୋ", category: "Vegetable", icon: "apple", basePrice: 1350, shelfDays: 6, coldMultiplier: 2.8, perishable: true },
    { name: "Brinjal", nameOdia: "ବାଇଗଣ", category: "Vegetable", icon: "carrot", basePrice: 1500, shelfDays: 5, coldMultiplier: 2.6, perishable: true },
    { name: "Okra (Bhindi)", nameOdia: "ଭେଣ୍ଡି", category: "Vegetable", icon: "carrot", basePrice: 2450, shelfDays: 4, coldMultiplier: 2.6, perishable: true },
    { name: "Cabbage", nameOdia: "ବନ୍ଧାକୋବି", category: "Vegetable", icon: "salad", basePrice: 900, shelfDays: 10, coldMultiplier: 2.6, perishable: true },
    { name: "Cauliflower", nameOdia: "ଫୁଲକୋବି", category: "Vegetable", icon: "salad", basePrice: 1600, shelfDays: 7, coldMultiplier: 2.6, perishable: true },
    { name: "Mango", nameOdia: "ଆମ୍ବ", category: "Fruit", icon: "apple", basePrice: 4300, shelfDays: 7, coldMultiplier: 2.2, perishable: true },
    { name: "Banana", nameOdia: "କଦଳୀ", category: "Fruit", icon: "banana", basePrice: 2150, shelfDays: 8, coldMultiplier: 2.2, perishable: true },
    { name: "Pineapple", nameOdia: "ସପୁରୀ", category: "Fruit", icon: "citrus", basePrice: 2600, shelfDays: 9, coldMultiplier: 2.2, perishable: true },
    { name: "Turmeric (Dry)", nameOdia: "ହଳଦୀ", category: "Spice", icon: "flame", basePrice: 9800, shelfDays: 200, coldMultiplier: 1.2, perishable: false },
    { name: "Ginger", nameOdia: "ଅଦା", category: "Spice", icon: "leaf", basePrice: 5200, shelfDays: 12, coldMultiplier: 2.2, perishable: true },
    { name: "Chilli (Dry)", nameOdia: "ଲଙ୍କା", category: "Spice", icon: "flame", basePrice: 14200, shelfDays: 200, coldMultiplier: 1.2, perishable: false },
    { name: "Cashew", nameOdia: "କାଜୁ", category: "Plantation", icon: "nut", basePrice: 11200, shelfDays: 200, coldMultiplier: 1.2, perishable: false },
    { name: "Cotton", nameOdia: "କପା", category: "Fibre", icon: "leaf", basePrice: 7150, shelfDays: 160, coldMultiplier: 1.2, perishable: false },
  ];
  const cropRows = await db.insert(crops).values(cropDefs).returning();
  const C = Object.fromEntries(cropRows.map((c) => [c.name, c.id]));

  /* --------------------------------- mandis -------------------------------- */
  const mandiDefs: [string, string][] = [
    ["Unit-I Market, Bhubaneswar", "Khordha"],
    ["Chhatra Bazar, Cuttack", "Cuttack"],
    ["Sambalpur RMC Mandi", "Sambalpur"],
    ["Berhampur Mandi", "Ganjam"],
    ["Panposh Mandi, Rourkela", "Sundargarh"],
    ["Remuna Mandi, Balasore", "Balasore"],
    ["Baripada Mandi", "Mayurbhanj"],
    ["Bhawanipatna Mandi", "Kalahandi"],
    ["Jeypore Mandi", "Koraput"],
    ["Padampur Mandi, Bargarh", "Bargarh"],
    ["Balangir Mandi", "Balangir"],
    ["Dhenkanal Mandi", "Dhenkanal"],
    ["Angul Mandi", "Angul"],
    ["Kendrapara Mandi", "Kendrapara"],
    ["Jajpur Road Mandi", "Jajpur"],
  ];
  const mandiRows = await db
    .insert(mandis)
    .values(
      mandiDefs.map(([name, d]) => ({
        name,
        district: d,
        lat: (DISTRICTS[d]?.lat ?? 20.5) + (rand() - 0.5) * 0.12,
        lng: (DISTRICTS[d]?.lng ?? 85.5) + (rand() - 0.5) * 0.12,
      })),
    )
    .returning();
  const M = Object.fromEntries(mandiRows.map((m) => [m.district, m.id]));

  /* --------------------------- 30 days of prices --------------------------- */
  const perishableVolatility = 0.1;
  const stableVolatility = 0.035;
  const priceBatch: {
    cropId: number;
    mandiId: number;
    date: string;
    minP: number;
    modalP: number;
    maxP: number;
  }[] = [];

  // which mandis trade which crops (all mandis trade paddy)
  const vegMandis = ["Khordha", "Cuttack", "Sambalpur", "Ganjam", "Balasore", "Sundargarh", "Jajpur", "Angul", "Dhenkanal", "Mayurbhanj"];
  const westernMandis = ["Sambalpur", "Bargarh", "Balangir", "Kalahandi", "Sundargarh", "Jharsuguda" as string].filter(Boolean);

  for (const crop of cropRows) {
    for (const mandi of mandiRows) {
      const isPaddy = crop.name.startsWith("Paddy");
      const isVeg = ["Vegetable", "Fruit"].includes(crop.category);
      const isSpice = crop.category === "Spice";
      const trade =
        isPaddy ||
        (isVeg && vegMandis.includes(mandi.district)) ||
        (crop.name === "Maize" && westernMandis.includes(mandi.district)) ||
        (["Green Gram (Moong)", "Black Gram (Biri)"].includes(crop.name) && ["Sambalpur", "Balangir", "Kalahandi", "Cuttack", "Khordha", "Ganjam"].includes(mandi.district)) ||
        (["Groundnut", "Mustard"].includes(crop.name) && ["Cuttack", "Khordha", "Balasore", "Bargarh", "Mayurbhanj"].includes(mandi.district)) ||
        (isSpice && ["Kandhamal", "Angul", "Dhenkanal", "Koraput", "Khordha", "Cuttack", "Ganjam"].includes(mandi.district)) ||
        (crop.name === "Cashew" && ["Ganjam", "Koraput", "Khordha"].includes(mandi.district)) ||
        (crop.name === "Cotton" && ["Balangir", "Kalahandi", "Koraput"].includes(mandi.district));
      if (!trade) continue;

      const mandiFactor = 0.9 + rand() * 0.22;
      const driftPhase = rand() * Math.PI * 2;
      const driftAmp = crop.perishable ? 0.09 : 0.04;
      const vol = crop.perishable ? perishableVolatility : stableVolatility;

      for (let d = 29; d >= 0; d--) {
        const t = 29 - d; // 0..29 oldest→newest
        const drift = 1 + driftAmp * Math.sin(driftPhase + (t / 29) * Math.PI * 1.6);
        const noise = 1 + (rand() - 0.5) * 2 * vol * 0.6;
        const weekBump = t % 7 === 2 ? 1.03 : 1; // haat-day bump
        const modal = Math.max(50, Math.round(crop.basePrice * mandiFactor * drift * noise * weekBump));
        priceBatch.push({
          cropId: crop.id,
          mandiId: mandi.id,
          date: todayISO(-d),
          minP: Math.round(modal * (0.86 + rand() * 0.06)),
          modalP: modal,
          maxP: Math.round(modal * (1.06 + rand() * 0.07)),
        });
      }
    }
  }
  for (let i = 0; i < priceBatch.length; i += 400) {
    await db.insert(prices).values(priceBatch.slice(i, i + 400));
  }

  /* ------------------------------- buyers --------------------------------- */
  const buyerRows = await db
    .insert(buyers)
    .values([
      { name: "Shree Jagannath Rice Mill", type: "Processor", district: "Cuttack", verified: true, rating: 4.6 },
      { name: "Utkal Dal Industries", type: "Processor", district: "Balangir", verified: true, rating: 4.3 },
      { name: "Kalinga Spice Exports", type: "Exporter", district: "Ganjam", verified: true, rating: 4.8 },
      { name: "Odisha Organic Producer Co.", type: "FPO", district: "Khordha", verified: true, rating: 4.5 },
      { name: "FreshBasket Retail Chain", type: "Retail Chain", district: "Khordha", verified: true, rating: 4.1 },
      { name: "MARKFED Odisha", type: "Govt Agency", district: "Cuttack", verified: true, rating: 4.4 },
      { name: "Maa Tarini FPC", type: "FPO", district: "Keonjhar", verified: true, rating: 4.2 },
      { name: "Konark Agro Processors", type: "Processor", district: "Puri", verified: false, rating: 3.9 },
      { name: "Tribal Harvest Collective", type: "FPO", district: "Koraput", verified: true, rating: 4.7 },
      { name: "Bamanda Cashew Works", type: "Processor", district: "Ganjam", verified: false, rating: 4.0 },
    ])
    .returning();
  const B = Object.fromEntries(buyerRows.map((b) => [b.name, b.id]));

  const demandDefs: [string, string, number, number, number, string][] = [
    // buyer, crop, qty(q), price/q, days-until-deadline, delivery point
    ["Shree Jagannath Rice Mill", "Paddy (Common)", 400, 2260, 12, "Mill gate, Cuttack"],
    ["Shree Jagannath Rice Mill", "Paddy (Grade A)", 250, 2400, 12, "Mill gate, Cuttack"],
    ["MARKFED Odisha", "Paddy (Common)", 800, 2300, 20, "Any PPC, Cuttack"],
    ["Utkal Dal Industries", "Green Gram (Moong)", 120, 7900, 10, "Utkal Dal Mill, Balangir"],
    ["Utkal Dal Industries", "Black Gram (Biri)", 100, 7400, 10, "Utkal Dal Mill, Balangir"],
    ["Kalinga Spice Exports", "Turmeric (Dry)", 80, 10600, 15, "Export shed, Berhampur"],
    ["Kalinga Spice Exports", "Chilli (Dry)", 40, 15100, 15, "Export shed, Berhampur"],
    ["Kalinga Spice Exports", "Ginger", 60, 5400, 8, "Collection centre, Phulbani"],
    ["FreshBasket Retail Chain", "Tomato", 30, 1520, 3, "Dark store, Bhubaneswar"],
    ["FreshBasket Retail Chain", "Okra (Bhindi)", 20, 2600, 3, "Dark store, Bhubaneswar"],
    ["FreshBasket Retail Chain", "Cauliflower", 25, 1750, 4, "Dark store, Bhubaneswar"],
    ["Odisha Organic Producer Co.", "Ginger", 35, 5600, 9, "FPO gate, Khordha"],
    ["Tribal Harvest Collective", "Turmeric (Dry)", 50, 10200, 18, "FPO yard, Jeypore"],
    ["Maa Tarini FPC", "Maize", 150, 2350, 14, "FPO yard, Baripada"],
    ["Konark Agro Processors", "Banana", 40, 2300, 5, "Plant gate, Puri"],
    ["Bamanda Cashew Works", "Cashew", 30, 11800, 21, "Factory, Berhampur"],
  ];
  await db.insert(demands).values(
    demandDefs.map(([buyer, crop, qty, price, days, point]) => ({
      buyerId: B[buyer],
      cropId: C[crop],
      qtyQuintal: qty,
      pricePerQuintal: price,
      deadline: todayISO(days),
      deliveryPoint: point,
    })),
  );

  /* ------------------------------ facilities ------------------------------- */
  const facDefs: [string, string, string, number, number, number, string, string][] = [
    // name, type, district, capacity, available, rate/q/day, contact, services
    ["Kalinga Cold Storage", "cold", "Khordha", 9000, 3100, 2.4, "0674-255••11", "Pre-cooling, grading, ripening chambers"],
    ["Chilika Fresh Cold Chain", "cold", "Khordha", 4500, 1900, 2.1, "0674-711••42", "Multi-chamber, wooden crate rental"],
    ["Utkal Cold Storage", "cold", "Cuttack", 6000, 750, 2.2, "0671-244••08", "Potato & veg chambers, CA storage"],
    ["Tarini Cold Point", "cold", "Balasore", 3000, 1450, 2.0, "06782-26••19", "Small-lot friendly, per-day billing"],
    ["Hirakud Frost Warehouse", "cold", "Sambalpur", 3800, 2100, 2.3, "0663-255••77", "Fruit chambers, sorting line"],
    ["Konark Cold Care", "cold", "Ganjam", 2600, 980, 1.9, "0680-222••63", "Chilly/mango preconditioning"],
    ["OSWC Warehouse, Bhubaneswar", "warehouse", "Khordha", 22000, 8400, 0.9, "oswc-bbsr@od.gov", "Pledge loan tie-up, e-NAM linked"],
    ["OSWC Warehouse, Cuttack", "warehouse", "Cuttack", 18000, 5200, 0.9, "oswc-ctc@od.gov", "Insurance, fumigation"],
    ["CWC Warehouse, Sambalpur", "warehouse", "Sambalpur", 15000, 6100, 0.85, "cwc-sbp@cwc.gov", "Negotiable warehouse receipt"],
    ["OSWC Warehouse, Berhampur", "warehouse", "Ganjam", 12000, 3900, 0.9, "oswc-bam@od.gov", "Grain silos, drying yard"],
    ["OSWC Warehouse, Balangir", "warehouse", "Balangir", 10000, 4700, 0.8, "oswc-blr@od.gov", "Pulse bagging stack"],
    ["Panchayat Godown, Baripada", "warehouse", "Mayurbhanj", 2500, 1100, 0.6, "0682-95••20", "Community-run, low cost"],
    ["Shree Jagannath Rice Mill (Processing)", "processing", "Cuttack", 8000, 2600, 1.2, "mill@sjrm.in", "Milling ₹140/q, bran buy-back"],
    ["Utkal Dal Mill (Processing)", "processing", "Balangir", 5000, 1800, 1.1, "care@utkaldal.in", "Dal conversion 62% yield"],
    ["Kandhamal Turmeric Processing", "processing", "Kandhamal", 2200, 900, 1.0, "ktu@kandhamal.org", "Boiling-polishing-drying, powder packing"],
    ["Mayurbhanj Mango Pulp Unit", "processing", "Mayurbhanj", 1800, 1400, 1.0, "mango@mayur.co", "Pulp line, aseptic drums"],
    ["Ganjam Cashew Processing", "processing", "Ganjam", 1600, 700, 1.1, "gcw@ganjam.in", "Shelling, grading, kernel packing"],
  ];
  await db.insert(facilities).values(
    facDefs.map(([name, type, d, cap, avail, rate, contact, services]) => ({
      name,
      type,
      district: d,
      lat: (DISTRICTS[d]?.lat ?? 20.5) + (rand() - 0.5) * 0.1,
      lng: (DISTRICTS[d]?.lng ?? 85.5) + (rand() - 0.5) * 0.1,
      capacityQuintal: cap,
      availableQuintal: avail,
      ratePerQPerDay: rate,
      contact,
      services,
    })),
  );

  /* ------------------------------ transporters ----------------------------- */
  const vehDefs: [string, string, number, number][] = [
    ["Tata Ace (Chhota Hathi)", "Khordha", 8, 22],
    ["Bolero Pickup", "Balasore", 10, 21],
    ["Eicher Pro 1049", "Cuttack", 45, 27],
    ["Tractor Trolley", "Kandhamal", 20, 16],
    ["Tata 407", "Ganjam", 25, 24],
    ["Bolero Pik-Up", "Mayurbhanj", 9, 20],
    ["Tractor Trolley", "Nabarangpur", 22, 15],
    ["Tata Ace", "Dhenkanal", 7, 22],
    ["Eicher Pro 1059", "Sambalpur", 50, 26],
    ["Mahindra Furio 7", "Kalahandi", 35, 24],
    ["Tractor Trolley", "Balangir", 20, 15],
    ["Tata Intra V30", "Jajpur", 12, 23],
  ];
  const driverNames = ["Biswa Transport", "Mahima Logistics", "Siba Sakti Carrier", "Lingaraj Movers", "Bramhani Freight", "Devi Roadlines", "Gandhamardan Cargo", "Khandadhar Haulage", "Maa Bhadrakali Transport", "Rushikulya Carriers", "Dayal Transport", "Samleswari Freight"];
  await db.insert(transporters).values(
    vehDefs.map(([vehicle, d, cap, rate], i) => ({
      name: driverNames[i],
      district: d,
      vehicle,
      capacityQuintal: cap,
      ratePerKm: rate,
      verified: i % 4 !== 3,
      phone: `98${Math.floor(rand() * 9)}${Math.floor(rand() * 9)}•••${100 + Math.floor(rand() * 899)}`,
    })),
  );

  /* -------------------------------- listings ------------------------------- */
  await db.insert(listings).values([
    { farmerId: farmerRows[0].id, cropId: C["Tomato"], qtyQuintal: 8, harvestDate: todayISO(-2), storageCondition: "open", district: "Kandhamal", expectedPrice: 1400 },
    { farmerId: farmerRows[0].id, cropId: C["Brinjal"], qtyQuintal: 5, harvestDate: todayISO(-4), storageCondition: "shade", district: "Kandhamal", expectedPrice: 1500 },
    { farmerId: farmerRows[0].id, cropId: C["Turmeric (Dry)"], qtyQuintal: 30, harvestDate: todayISO(-11), storageCondition: "shade", district: "Kandhamal", expectedPrice: 10000 },
    { farmerId: farmerRows[0].id, cropId: C["Ginger"], qtyQuintal: 12, harvestDate: todayISO(-6), storageCondition: "open", district: "Kandhamal", expectedPrice: 5300 },
    { farmerId: farmerRows[1].id, cropId: C["Okra (Bhindi)"], qtyQuintal: 6, harvestDate: todayISO(-1), storageCondition: "open", district: "Balasore", expectedPrice: 2500 },
    { farmerId: farmerRows[2].id, cropId: C["Paddy (Common)"], qtyQuintal: 42, harvestDate: todayISO(-5), storageCondition: "open", district: "Khordha", expectedPrice: 2250 },
    { farmerId: farmerRows[3].id, cropId: C["Maize"], qtyQuintal: 25, harvestDate: todayISO(-8), storageCondition: "shade", district: "Nabarangpur", expectedPrice: 2280 },
    { farmerId: farmerRows[4].id, cropId: C["Onion"], qtyQuintal: 18, harvestDate: todayISO(-20), storageCondition: "shade", district: "Dhenkanal", expectedPrice: 1180 },
    { farmerId: farmerRows[5].id, cropId: C["Paddy (Grade A)"], qtyQuintal: 15, harvestDate: todayISO(-3), storageCondition: "open", district: "Mayurbhanj", expectedPrice: 2350 },
  ]);

  /* --------------------------------- pools --------------------------------- */
  await db.insert(pools).values([
    { cropId: C["Paddy (Common)"], fromDistrict: "Khordha", toMandiId: M["Khordha"], departDate: todayISO(1), capacityQuintal: 45, filledQuintal: 31, costPerQuintal: 38, createdBy: farmerRows[2].id },
    { cropId: C["Okra (Bhindi)"], fromDistrict: "Balasore", toMandiId: M["Cuttack"], departDate: todayISO(1), capacityQuintal: 40, filledQuintal: 15, costPerQuintal: 54, createdBy: farmerRows[1].id },
    { cropId: C["Turmeric (Dry)"], fromDistrict: "Kandhamal", toMandiId: M["Ganjam"], departDate: todayISO(2), capacityQuintal: 40, filledQuintal: 12, costPerQuintal: 82, createdBy: farmerRows[0].id },
    { cropId: C["Maize"], fromDistrict: "Nabarangpur", toMandiId: M["Koraput"], departDate: todayISO(3), capacityQuintal: 40, filledQuintal: 25, costPerQuintal: 48, createdBy: farmerRows[3].id },
  ]);

  console.log("Seed complete:", {
    farmers: farmerRows.length,
    crops: cropRows.length,
    mandis: mandiRows.length,
    priceRows: priceBatch.length,
    buyers: buyerRows.length,
  });
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

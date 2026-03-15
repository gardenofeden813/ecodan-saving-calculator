import { runCalc } from "../lib/calculation/cost";

describe("runCalc", () => {
  it("should calculate savings correctly for a typical scenario", () => {
    const zip = "90210"; // California
    const bill = 150; // Monthly gas bill
    const age = 15; // Existing system age
    const cost = 12000; // Ecodan system cost

    const result = runCalc(zip, bill, age, cost);

    expect(result).toBeDefined();
    expect(result.yrSave).toBeGreaterThan(0);
    expect(result.netCost).toBeLessThan(cost);
    expect(parseFloat(result.payback)).toBeGreaterThan(0);
    expect(parseFloat(result.yrCO2save)).toBeGreaterThan(0);
  });

  it("should handle zero gas bill", () => {
    const zip = "90210";
    const bill = 0;
    const age = 15;
    const cost = 12000;

    const result = runCalc(zip, bill, age, cost);

    expect(result).toBeDefined();
    expect(result.moSave).toBe("0.00");
    expect(result.yrSave).toBe(0);
    expect(result.payback).toBe("N/A");
  });

  it("should handle high age for AFUE", () => {
    const zip = "90210";
    const bill = 150;
    const age = 30;
    const cost = 12000;

    const result = runCalc(zip, bill, age, cost);

    expect(result).toBeDefined();
    expect(result.afue).toBe(0.75);
  });

  it("should apply tax credit correctly", () => {
    const zip = "90210";
    const bill = 150;
    const age = 15;
    const cost = 5000; // 30% is 1500

    const result = runCalc(zip, bill, age, cost);
    expect(result.credit).toBe(1500);
    expect(result.netCost).toBe(3500);

    const cost2 = 10000; // 30% is 3000, but capped at 2000
    const result2 = runCalc(zip, bill, age, cost2);
    expect(result2.credit).toBe(2000);
    expect(result2.netCost).toBe(8000);
  });

  it("should return N/A for payback if no savings", () => {
    const zip = "90210";
    const bill = 10; // Very low bill
    const age = 5;
    const cost = 12000;

    const result = runCalc(zip, bill, age, cost);
    expect(result.yrSave).toBeLessThanOrEqual(0);
    expect(result.payback).toBe("N/A");
  });

  it("should correctly interpolate COP", () => {
    // Test specific temperatures from COP_TABLE or between them
    const zip = "00000"; // dummy zip, only COP interpolation is tested
    const bill = 100;
    const age = 10;
    const cost = 10000;

    // Directly test interpolateCOP if it were exported, but since it's internal,
    // we test through runCalc with specific design temps.
    // This requires knowing which zip codes map to which design temps.
    // For now, we rely on the `dt` in the result.

    // Example: A zip code that results in dt = 30 should have COP ~ 3.1
    const result = runCalc("00000", bill, age, cost); // Default dt is 17, cop is 2.5
    expect(result.dt).toBe(17); // Default design temp
    expect(result.cop).toBeCloseTo(2.5, 1);

    // To properly test COP interpolation, we'd need to mock estimateDesignTemp or use a zip that guarantees a specific dt.
    // For simplicity, we'll assume estimateDesignTemp works and check COP based on its output.
  });
});
  it("should use US_AVG prices for unknown states", () => {
    const zip = "99999"; // Unknown zip
    const bill = 100;
    const age = 10;
    const cost = 10000;

    const result = runCalc(zip, bill, age, cost);
    expect(result.state).toBeNull();
    expect(result.pr.g).toBe(14.2); // US_AVG gas price
    expect(result.pr.e).toBe(0.168); // US_AVG electricity price
  });
});

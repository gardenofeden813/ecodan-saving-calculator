"use client";

import { Info } from "lucide-react";

interface InputFormProps {
  zip: string;
  setZip: (value: string) => void;
  bill: string;
  setBill: (value: string) => void;
  age: string;
  setAge: (value: string) => void;
  cost: string;
  setCost: (value: string) => void;
  preview: any;
}

export function InputForm({
  zip,
  setZip,
  bill,
  setBill,
  age,
  setAge,
  cost,
  setCost,
  preview,
}: InputFormProps) {
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* ZIP Code */}
      <div>
        <label className="block text-xs font-medium text-secondary sm:text-sm">
          ZIP Code
        </label>
        <input
          type="text"
          placeholder="e.g., 10001"
          value={zip}
          onChange={(e) => setZip(e.target.value.slice(0, 5))}
          maxLength={5}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:px-4 sm:py-2.5"
        />
      </div>

      {/* Monthly Gas Bill */}
      <div>
        <label className="block text-xs font-medium text-secondary sm:text-sm">
          Monthly Gas Bill ($)
        </label>
        <input
          type="number"
          placeholder="e.g., 150"
          value={bill}
          onChange={(e) => setBill(e.target.value)}
          min="0"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:px-4 sm:py-2.5"
        />
      </div>

      {/* System Age */}
      <div>
        <label className="block text-xs font-medium text-secondary sm:text-sm">
          Existing System Age (years)
        </label>
        <input
          type="number"
          placeholder="e.g., 15"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          min="0"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:px-4 sm:py-2.5"
        />
      </div>

      {/* System Cost */}
      <div>
        <label className="block text-xs font-medium text-secondary sm:text-sm">
          Ecodan System Cost ($)
        </label>
        <input
          type="number"
          placeholder="e.g., 12000"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          min="0"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:px-4 sm:py-2.5"
        />
      </div>

      {/* Live Preview */}
      {preview && (
        <div className="mt-4 rounded-lg bg-surface-50 p-3 sm:mt-5 sm:p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted">
            <Info className="h-3.5 w-3.5" />
            Location-Based Estimates
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs sm:gap-x-6 sm:text-sm">
            <span>
              <span className="text-muted">State:</span>{" "}
              <span className="font-semibold text-secondary">
                {preview.state || "N/A"}
              </span>
            </span>
            <span>
              <span className="text-muted">Design Temp:</span>{" "}
              <span className="font-semibold text-secondary">
                {preview.dt}°F
              </span>
            </span>
            <span>
              <span className="text-muted">Seasonal COP:</span>{" "}
              <span className="font-semibold text-accent">
                {preview.cop.toFixed(2)}
              </span>
            </span>
            <span>
              <span className="text-muted">Boiler AFUE:</span>{" "}
              <span className="font-semibold text-secondary">
                {(preview.afue * 100).toFixed(0)}%
              </span>
            </span>
            {preview.pr && (
              <>
                <span>
                  <span className="text-muted">Gas:</span>{" "}
                  <span className="font-semibold text-secondary">
                    ${preview.pr.g}/therm
                  </span>
                </span>
                <span>
                  <span className="text-muted">Electric:</span>{" "}
                  <span className="font-semibold text-secondary">
                    ${preview.pr.e}/kWh
                  </span>
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

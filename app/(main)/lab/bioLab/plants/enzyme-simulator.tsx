"use client";

import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title } from "chart.js";
import { Button } from "@/components/ui/button";

// Register chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title);

const EnzymeSimulator = () => {
  const [pH, setPH] = useState(7); // Default pH
  const [temperature, setTemperature] = useState(37); // Default temperature in °C
  const [substrateConcentration, setSubstrateConcentration] = useState(50); // Default substrate concentration in %
  const [enzymeActivity, setEnzymeActivity] = useState<number[]>([]); // Graph data

  // Simulated real-time enzyme activity calculation
  const calculateEnzymeActivity = () => {
    // Ideal pH: 7, Ideal Temperature: 37°C
    const pHEffect = Math.exp(-Math.pow((pH - 7) / 2, 2));
    const tempEffect = Math.exp(-Math.pow((temperature - 37) / 10, 2));
    const substrateEffect = Math.min(substrateConcentration / 100, 1);

    const activity = Math.round(pHEffect * tempEffect * substrateEffect * 100); // Normalize activity to 0-100
    return activity;
  };

  useEffect(() => {
    const newActivity = calculateEnzymeActivity();
    setEnzymeActivity((prev) => [...prev, newActivity].slice(-10)); // Keep the last 10 values for the graph
  }, [pH, temperature, substrateConcentration]);

  // Chart.js data
  const data = {
    labels: Array(enzymeActivity.length).fill(""), // Placeholder labels
    datasets: [
      {
        label: "Enzyme Activity",
        data: enzymeActivity,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-5xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      {/* Controls Section */}
      <div className="flex flex-col gap-4 w-full lg:w-1/3">
        <h2 className="text-2xl font-bold">Adjust Conditions</h2>
        {/* pH Slider */}
        <div>
          <label className="block text-gray-700 mb-2">pH Level: {pH}</label>
          <input
            type="range"
            min="1"
            max="14"
            step="0.1"
            value={pH}
            onChange={(e) => setPH(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        {/* Temperature Slider */}
        <div>
          <label className="block text-gray-700 mb-2">Temperature (°C): {temperature}</label>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={temperature}
            onChange={(e) => setTemperature(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
        {/* Substrate Concentration Slider */}
        <div>
          <label className="block text-gray-700 mb-2">Substrate Concentration (%): {substrateConcentration}</label>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={substrateConcentration}
            onChange={(e) => setSubstrateConcentration(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Visualization and Feedback Section */}
      <div className="flex flex-col gap-4 w-full lg:w-2/3">
        {/* Reaction Visualization */}
        <div className="h-48 bg-gray-100 flex items-center justify-center rounded-lg shadow-inner">
          <p className="text-lg font-bold text-gray-700">Reaction Speed: {enzymeActivity.slice(-1)[0] || 0}%</p>
        </div>

        {/* Activity Graph */}
        <div className="h-64">
          <Line data={data} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </div>
    </div>
  );
};

export default EnzymeSimulator;

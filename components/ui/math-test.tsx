"use client";

import { MathRenderer } from "./math-renderer";

export const MathTest = () => {
  const testMath = "$\\quad 4\\dfrac{3}{5} = \\dfrac{23}{5}$";
  
  return (
    <div className="p-4 border rounded-lg bg-blue-50">
      <h3 className="font-semibold mb-2">LaTeX Math Test</h3>
      <p className="mb-2">Raw text: {testMath}</p>
      <p className="mb-2">Rendered math:</p>
      <div className="p-2 bg-white border rounded">
        <MathRenderer>{testMath}</MathRenderer>
      </div>
    </div>
  );
}; 
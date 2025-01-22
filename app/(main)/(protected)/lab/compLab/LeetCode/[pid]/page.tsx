// app/(main)/lab/compLab/LeetCode/problems/[pid]/page.tsx

import React from "react";
import Workspace from "../workspace/workspace";
import { problems } from "@/app/utils/problems";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return Object.keys(problems).map((key) => ({
    pid: key,
  }));
}

type ProblemPageProps = {
  params: {
    pid: string;
  };
};

const ProblemPage: React.FC<ProblemPageProps> = ({ params }) => {
  const { pid } = params;

  // Fetch the problem locally
  const problem = problems[pid];

  // If the problem doesn't exist, show 404
  if (!problem) {
    notFound(); // This will render the 404 page
  }

  // Convert handlerFunction to string if needed
  problem.handlerFunction = problem.handlerFunction?.toString();

  return (
    <div className="bg-white min-h-screen">
      <Workspace problem={problem} />
    </div>
  );
};

export default ProblemPage;

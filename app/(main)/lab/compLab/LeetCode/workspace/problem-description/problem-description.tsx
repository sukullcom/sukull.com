import { Problem } from "@/app/types/problem";
import React from "react";
import { AiFillLike, AiFillDislike } from "react-icons/ai";
import { BsCheck2Circle } from "react-icons/bs";
import { TiStarOutline } from "react-icons/ti";

type ProblemDescriptionProps = {
  problem: Problem;
  _solved: boolean;
};

const ProblemDescription: React.FC<ProblemDescriptionProps> = ({
  problem,
  _solved,
}) => {
  return (
    <div className="bg-white">
      {/* TAB */}
      <div className="flex h-11 w-full items-center pt-2 bg-gray-50 text-gray-700 border-b border-gray-200">
        <div className="bg-gray-200 rounded-t-[5px] px-5 py-[10px] text-xs cursor-pointer hover:bg-gray-300 font-medium">
          Açıklama
        </div>
      </div>

      <div className="flex px-0 py-4 h-[calc(100vh-94px)] overflow-y-auto">
        <div className="px-5 w-full">
          {/* Problem heading */}
          <div className="flex space-x-4">
            <div className="flex-1 mr-2 text-lg text-gray-900 font-medium">
              {problem.title}
            </div>
          </div>
          <div className="flex items-center mt-3">
            <div className="text-green-700 bg-green-100 inline-block rounded-[21px] px-2.5 py-1 text-xs font-medium capitalize">
              {problem.difficulty}
            </div>

            {_solved && (
              <div className="rounded p-[3px] ml-4 text-lg text-green-600">
                <BsCheck2Circle />
              </div>
            )}
          </div>

          {/* Problem Statement */}
          <div className="text-gray-800 text-sm mt-3">
            <div
              dangerouslySetInnerHTML={{ __html: problem.problemStatement }}
            />
          </div>

          {/* Examples */}
          <div className="mt-4">
            {problem.examples.map((example, index) => (
              <div key={example.id} className="mb-4">
                <p className="font-medium text-gray-900">
                  Example {index + 1}:
                </p>
                {example.img && (
                  <img src={example.img} alt="" className="mt-2" />
                )}
                <div className="bg-gray-50 p-3 rounded mt-2 border-gray-300 border">
                  <pre className="text-sm text-gray-700">
                    <strong>Input:</strong> {example.inputText}
                    <br />
                    <strong>Output:</strong> {example.outputText}
                    <br />
                    {example.explanation && (
                      <>
                        <strong>Explanation:</strong> {example.explanation}
                      </>
                    )}
                  </pre>
                </div>
              </div>
            ))}
          </div>

          {/* Constraints */}
          <div className="my-5">
            <div className="text-gray-900 text-sm font-medium">
              Constraints:
            </div>
            <ul className="text-gray-700 ml-5 list-disc">
              <div
                dangerouslySetInnerHTML={{ __html: problem.constraints }}
              />
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemDescription;

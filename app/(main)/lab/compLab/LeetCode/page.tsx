"use client";

import ProblemsTable from "./problems-table";


export default function Home() {
  return (
    <>
      <main className="min-h-screen">
        <h1 className="text-2xl text-center text-gray-800 font-medium uppercase mt-10 mb-5">
          &ldquo; QUALITY OVER QUANTITY &rdquo; 👇
        </h1>

        {/* A container wrapper to mimic your other pages */}
        <div className="border-2 rounded-xl p-6 space-y-4 shadow-lg bg-white w-full max-w-5xl ml-4 mx-auto">
          <div className="relative overflow-x-auto">
            <table className="text-sm text-left text-gray-800 w-full bg-white shadow rounded">
              <thead className="text-xs text-gray-700 uppercase bg-gray-200 border-b">
                <tr>
                  <th scope="col" className="px-2 py-3 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 font-medium">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 font-medium">
                    Difficulty
                  </th>
                  <th scope="col" className="px-6 py-3 font-medium">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 font-medium">
                    Solution
                  </th>
                </tr>
              </thead>
              <ProblemsTable />
            </table>
          </div>
        </div>
        <div className="p-10" />
      </main>
    </>
  );
}

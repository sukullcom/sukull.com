"use client"; // <---- Must be client to use localStorage

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { BsCheckCircle } from "react-icons/bs";
import { AiFillYoutube } from "react-icons/ai";
import { IoClose } from "react-icons/io5";
import YouTube from "react-youtube";
import { problems } from "./problems";

export default function ProblemsTable() {
  const [youtubePlayer, setYoutubePlayer] = useState({
    isOpen: false,
    videoId: "",
  });
  const [solvedMap, setSolvedMap] = useState<{ [key: string]: boolean }>({});

  // Memoize the array so it doesn't re-instantiate on every render
  const problemsArray = useMemo(() => {
    return Object.values(problems).sort((a, b) => a.order - b.order);
  }, []);

  // Read localStorage on client mount
  useEffect(() => {
    const newMap: { [key: string]: boolean } = {};
    problemsArray.forEach((prob) => {
      const localKey = `solved-${prob.id}`;
      newMap[prob.id] = localStorage.getItem(localKey) === "true";
    });
    setSolvedMap(newMap);
  }, [problemsArray]);

  const closeModal = () => {
    setYoutubePlayer({ isOpen: false, videoId: "" });
  };

  return (
    <>
      <tbody className="text-gray-800">
        {problemsArray.map((problem, idx) => {
          const difficultyColor =
            problem.difficulty === "Easy"
              ? "text-green-600"
              : problem.difficulty === "Medium"
              ? "text-yellow-600"
              : "text-pink-600";

          const isSolved = solvedMap[problem.id] === true;

          return (
            <tr
              key={problem.id}
              className={idx % 2 === 1 ? "bg-gray-50" : "bg-white"}
            >
              <th className="px-2 py-4 font-medium whitespace-nowrap">
                {isSolved ? (
                  <BsCheckCircle fontSize={18} className="text-green-700" />
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </th>

              <td className="px-6 py-4">
                <Link
                  href={`/lab/LeetCode/${problem.id}`}
                  className="hover:text-blue-600 cursor-pointer"
                  prefetch={false}
                >
                  {problem.title}
                </Link>
              </td>

              <td className={`px-6 py-4 ${difficultyColor}`}>
                {problem.difficulty}
              </td>

              {/* Example category column */}
              <td className="px-6 py-4">
                <span>{problem.category || "---"}</span>
              </td>

              <td className="px-6 py-4">
                {problem.videoId ? (
                  <AiFillYoutube
                    fontSize={28}
                    className="cursor-pointer hover:text-red-600"
                    onClick={() =>
                      setYoutubePlayer({
                        isOpen: true,
                        videoId: problem.videoId as string,
                      })
                    }
                  />
                ) : (
                  <p className="text-gray-400">Coming soon</p>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>

      {youtubePlayer.isOpen && (
        <tfoot
          className="fixed top-0 left-0 h-screen w-screen flex items-center justify-center"
          onClick={closeModal}
        >
          <div className="bg-black z-10 opacity-70 w-screen h-screen absolute" />
          <div className="w-full z-50 h-full px-6 relative max-w-4xl">
            <div className="w-full h-full flex items-center justify-center relative">
              <div className="w-full relative">
                <IoClose
                  fontSize={35}
                  className="cursor-pointer absolute -top-16 right-0 text-white"
                  onClick={closeModal}
                />
                <YouTube
                  videoId={youtubePlayer.videoId}
                  loading="lazy"
                  iframeClassName="w-full min-h-[500px]"
                />
              </div>
            </div>
          </div>
        </tfoot>
      )}
    </>
  );
}

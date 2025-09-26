import React from 'react'
import Image from 'next/image'

export default function Getcoursecertificate() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full flex justify-center">
        <div className="max-w-[720px] w-full">
          <div className="w-full flex justify-center">
            <Image
              src="/student/Getcoursecertificate.png"
              alt="Course certificate success"
              width={900}
              height={600}
              className="w-full h-auto"
              priority
            />
          </div>

          <div className="mt-6 text-center">
            <p className="text-green-500 text-sm">
              Congratulations for successful completion of all the lessons!
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Click to download your Problem solving course certificate
            </p>

            <div className="mt-6">
              <button
                className="px-6 py-2 rounded-full bg-orange-400 text-white text-sm font-medium shadow hover:bg-orange-500"
              >
                Get course certificate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

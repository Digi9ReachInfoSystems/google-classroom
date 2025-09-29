import React from 'react'
import Image from 'next/image'

export default function Getcoursecertificate() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full flex justify-center">
        <div className="max-w-[720px] xl:max-w-[800px] 2xl:max-w-[900px] w-full">
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

          <div className="mt-6 2xl:mt-8 text-center">
            <p className="text-green-500 text-sm sm:text-base 2xl:text-lg">
              Congratulations for successful completion of all the lessons!
            </p>
            <p className="text-gray-500 text-sm sm:text-base 2xl:text-lg mt-1">
              Click to download your Problem solving course certificate
            </p>

            <div className="mt-6 2xl:mt-8">
              <button
                className="px-6 py-2 2xl:px-8 2xl:py-3 rounded-full bg-orange-400 text-white text-sm 2xl:text-base font-medium shadow hover:bg-orange-500 transition-colors"
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

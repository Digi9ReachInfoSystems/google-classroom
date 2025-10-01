import React from 'react'
import Link from 'next/link'

export default function Studentassements() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-4 sm:p-6 xl:p-8 2xl:p-10">
      <div className="mb-6 2xl:mb-8">
        <h2 className="text-xl 2xl:text-2xl font-semibold text-foreground">Students team work</h2>
      </div>

      <div className="space-y-4 2xl:space-y-6 text-sm sm:text-base 2xl:text-lg leading-7 2xl:leading-8 text-gray-700">
        <p>
          Lorem ipsum dolor sit amet consectetur. Commodo eu commodo sit at. Lobortis in viverra ac viverra
          nulla nunc vitae scelerisque commodo. Amet etiam lorem facilisis id egestas. Integer in massa sit
          nulla vulputate est nullam molestie et.
        </p>
        <p>
          Eget platea in ut viverra elementum. Donec nulla purus feugiat imperdiet facilisi ipsum mi feugiat et.
          Leo posuere magna adipiscing nisl lorem ac aliquet enim. Mauris praesent tristique at eget adipiscing
          diam egestas donec. Vulputate quam nunc suspendisse faucibus adipiscing est lectus amet. Urna quam diam
          ac facilisis facilisis duis leo quam sem. Elit eros metus sed maecenas viverra ut ac.
        </p>
        <p>
          Lorem ipsum dolor sit amet consectetur. Commodo eu commodo sit at. Lobortis in viverra ac viverra
          nulla nunc vitae scelerisque commodo. Amet etiam lorem facilisis id egestas. Integer in massa sit
          nulla vulputate est nullam molestie et.
        </p>
        <p>
          Eget platea in ut viverra elementum. Donec nulla purus feugiat imperdiet facilisi ipsum mi feugiat et.
          Leo posuere magna adipiscing nisl lorem ac aliquet enim. Mauris praesent tristique at eget adipiscing
          diam egestas donec. Vulputate quam nunc suspendisse faucibus adipiscing est lectus amet. Urna quam diam
          ac facilisis facilisis duis leo quam sem. Elit eros metus sed maecenas viverra ut ac.
        </p>
      </div>

      <div className="mt-8 2xl:mt-10 flex justify-end">
        <Link
          href="/student/dashboard/mycourses/certificate"
          className="px-6 py-2 2xl:px-8 2xl:py-3 rounded-full bg-orange-400 text-white text-sm 2xl:text-base font-medium shadow hover:bg-orange-500 transition-colors"
        >
          Continue
        </Link>
      </div>
    </div>
  )
}

"use client";

interface Badge {
  id: number
  name: string
  earned: boolean
  image?: string
}

const badges: Badge[] = [
  { id: 1, name: "First", earned: true, image: "/student/badge-first.png" },
  { id: 2, name: "Second", earned: true, image: "/student/badge-first.png" },
  { id: 3, name: "Third", earned: true, image: "/student/badge-first.png" },
  { id: 4, name: "Fourth", earned: false },
  { id: 5, name: "Fifth", earned: false },
  { id: 6, name: "Sixth", earned: false },
  { id: 7, name: "Seventh", earned: false },
  { id: 8, name: "Eighth", earned: false },
  { id: 9, name: "Ninth", earned: false },
]

export function BadgesSection() {
  const earnedCount = badges.filter((badge) => badge.earned).length

  // Always render a 4x4 grid (16 slots). If there are fewer than 16 badges,
  // fill the remaining slots with locked placeholders so the layout is stable.
  const TOTAL_SLOTS = 12
  const slots: Badge[] = Array.from({ length: TOTAL_SLOTS }, (_, index) => {
    return badges[index] ?? { id: 1000 + index, name: "Locked", earned: false }
  })
  return (
    <div className="bg-white rounded-lg  border-neutral-200">
      <div className="p-6  border-neutral-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">Badges</h2>
        <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
          {earnedCount} Earned
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-4 gap-6">
          {slots.map((badge) => (
            <div key={badge.id} className="flex flex-col items-center">
              <div
                className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center ${
                  badge.earned ? "bg-gradient-to-br from-teal-400 to-teal-600" : "bg-neutral-300"
                }`}
              >
                {badge.earned && badge.image ? (
                  <img src={badge.image || "/placeholder.svg"} alt={badge.name} className="w-10 h-10 md:w-12 md:h-12" />
                ) : badge.earned ? (
                  <svg className="w-7 h-7 md:w-8 md:h-8 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="w-7 h-7 md:w-8 md:h-8 text-neutral-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

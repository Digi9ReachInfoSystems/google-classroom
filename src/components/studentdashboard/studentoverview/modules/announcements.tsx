"use client";

import { Send, Bell } from "lucide-react"

interface Announcement {
  id: number
  text: string
}

const announcements: Announcement[] = [
  {
    id: 1,
    text: "Lorem ipsum dolor sit amet consectetur. Vulputate purus amet tincidunt nibh mauris interdum imperdiet elit in.",
  },
  {
    id: 2,
    text: "Lorem ipsum dolor sit amet consectetur. Vulputate purus amet tincidunt nibh mauris interdum imperdiet elit in.",
  },
  {
    id: 3,
    text: "Lorem ipsum dolor sit amet consectetur. Vulputate purus amet tincidunt nibh mauris interdum imperdiet elit in.",
  },
  {
    id: 4,
    text: "Lorem ipsum dolor sit amet consectetur. Vulputate purus amet tincidunt nibh mauris interdum imperdiet elit in.",
  },
  {
    id: 1,
    text: "Lorem ipsum dolor sit amet consectetur. Vulputate purus amet tincidunt nibh mauris interdum imperdiet elit in.",
  },
  {
    id: 2,
    text: "Lorem ipsum dolor sit amet consectetur. Vulputate purus amet tincidunt nibh mauris interdum imperdiet elit in.",
  },
  {
    id: 3,
    text: "Lorem ipsum dolor sit amet consectetur. Vulputate purus amet tincidunt nibh mauris interdum imperdiet elit in.",
  },
  {
    id: 4,
    text: "Lorem ipsum dolor sit amet consectetur. Vulputate purus amet tincidunt nibh mauris interdum imperdiet elit in.",
  },
  {
    id: 1,
    text: "Lorem ipsum dolor sit amet consectetur. Vulputate purus amet tincidunt nibh mauris interdum imperdiet elit in.",
  },
  {
    id: 2,
    text: "Lorem ipsum dolor sit amet consectetur. Vulputate purus amet tincidunt nibh mauris interdum imperdiet elit in.",
  },
  {
    id: 3,
    text: "Lorem ipsum dolor sit amet consectetur. Vulputate purus amet tincidunt nibh mauris interdum imperdiet elit in.",
  },
  {
    id: 4,
    text: "Lorem ipsum dolor sit amet consectetur. Vulputate purus amet tincidunt nibh mauris interdum imperdiet elit in.",
  },
]

export function Announcements() {
  return (
    <>
      <div className="bg-white rounded-lg  border-neutral-200">
      <div className="p-6 border-neutral-200">
        <h2 className="text-lg font-semibold text-neutral-900">Announcements</h2>
      </div>
      <div className="p-6 space-y-6 max-h-[30rem] overflow-y-auto custom-scrollbar pr-3">
        {announcements.map((announcement, index) => (
          <div key={`${announcement.id}-${index}`} className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full border-2 border-neutral-200 flex items-center justify-center flex-shrink-0">
                <Bell className="w-4 h-4 text-primary fill-primary stroke-none" />
              </div>
              <p className="text-sm text-neutral-700 leading-relaxed flex-1 line-clamp-2">{announcement.text}</p>
            </div>

            <div className="ml-11">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Add comment..."
                  className="w-full px-4 py-2 text-sm border border-neutral-200 rounded-full bg-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary pr-10"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-primary transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  )
}

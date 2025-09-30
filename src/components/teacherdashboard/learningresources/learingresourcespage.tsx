import React from 'react'
import TeacherLearningResources from './modules/learingresourcesTable'

export default function Learingresourcespage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl md:text-[28px] font-semibold text-black">Learning Resources</h2>
      <TeacherLearningResources />
    </div>
  )
}

"use client"

import React from 'react'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function Geminipage() {
  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[1600px]">
        <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Gemini</h1>

        <Select>
          <SelectTrigger aria-label="Select idea states" className="w-[200px] rounded-full">
            <SelectValue placeholder="Select idea states" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Idea states</SelectLabel>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        </div>

        <div className="flex h-[70vh] items-center justify-center">
          <p className="text-3xl font-medium text-muted-foreground">Coming soon</p>
        </div>
      </div>
    </div>
  )
}

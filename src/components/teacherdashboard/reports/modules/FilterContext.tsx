"use client";

import React, { createContext, useContext, useState } from "react";

type FilterState = {
  age?: string;
  grade?: string;
  gender?: string;
  disability?: string;
};

type FilterContextType = {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  setAge: (age?: string) => void;
  setGrade: (grade?: string) => void;
  setGender: (gender?: string) => void;
  setDisability: (disability?: string) => void;
  clearFilters: () => void;
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFiltersState] = useState<FilterState>({});

  const setFilters = (newFilters: FilterState) => {
    setFiltersState(newFilters);
  };

  const setAge = (age?: string) => {
    setFiltersState(prev => ({ ...prev, age }));
  };

  const setGrade = (grade?: string) => {
    setFiltersState(prev => ({ ...prev, grade }));
  };

  const setGender = (gender?: string) => {
    setFiltersState(prev => ({ ...prev, gender }));
  };

  const setDisability = (disability?: string) => {
    setFiltersState(prev => ({ ...prev, disability }));
  };

  const clearFilters = () => {
    setFiltersState({});
  };

  return (
    <FilterContext.Provider
      value={{
        filters,
        setFilters,
        setAge,
        setGrade,
        setGender,
        setDisability,
        clearFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error("useFilters must be used within a FilterProvider");
  }
  return context;
}

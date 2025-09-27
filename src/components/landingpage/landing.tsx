import React from "react";
import Hero from "./Hero/Hero";
import Why from "./Why/Why";
import Features from "./Features/Features";
import Map from "./Map/Map";
import Reliable from "./Reliable/Reliable";
import Roles from "./Roles/Roles";
import Pilot from "./Pilot/Pilot";
import Faq from "./Faq/Faq";
import Header from "./Header/Header";
import Footer from "./Footer/Footer";
import Last from "./Last/Last";

export default function Landing() {
    return (
        <>
        <Header />
        <Hero />
        <Why />
        <Features />
        <Map />
        <Reliable />
        <Roles />
        <Pilot />
        <Faq />
        <Footer />
        
        </>
    )
}
import Image from "next/image";
import React from "react";

type Role = {
  title: string;
  desc: string;
};

const roles: Role[] = [
  { title: "Super Admin",  desc: "National insights, threshold rules, scheduled reports" },
  { title: "School Admin", desc: "Teacher/student rollups, performance alerts" },
  { title: "Teachers",     desc: "Class progress, assessment trends, alerts" },
  { title: "Students",     desc: "Personal progress, quiz scores, badges" },
];

const RoleBasedAccess: React.FC = () => {
  return (
    <section id="role" className="w-full bg-[var(--neutral-100)] py-14">
      <div className="max-w-6xl mx-auto px-6">
        {/* Heading: 48px, regular(400) */}
        <h2 className="text-[48px] font-normal text-center text-[var(--neutral-1000)]">
          Role-Based Access
        </h2>

        {/* Roles */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {roles.map(({ title, desc }) => (
           <div key={title} className="flex items-start gap-3">
  {/* Proper yellow circle */}
  <span className="inline-flex flex-none items-center justify-center w-8 h-8 rounded-full bg-[var(--warning-400)] shadow-[inset_0_-1px_0_rgba(0,0,0,0.08)] mt-1">
    <Image src="/tick.svg" alt="" className="w-3.5 h-3.5" width={12} height={12} />
  </span>

  <div>
    <h3 className="text-[24px] font-normal text-[var(--neutral-1000)]">
      {title}
    </h3>
    <p className="mt-1 text-[16px] leading-[24px] font-normal text-[var(--neutral-700)]">
      {desc}
    </p>
  </div>
</div>

          ))}
        </div>
      </div>
    </section>
  );
};

export default RoleBasedAccess;

export default function MeetCard() {
  return (
    <div className="bg-white rounded-xl  p-5">
      <div className="text-[14px] font-medium text-[var(--neutral-1000)]">Meet</div>

      <div className="mt-6 h-24 rounded-md bg-[var(--neutral-100)] grid place-items-center text-[var(--neutral-400)] text-sm">
        No class schedule
      </div>

      <button className="mt-6 w-full rounded-full bg-[var(--primary)]  text-white py-3 text-sm">
        Create Class
      </button>
    </div>
  );
}

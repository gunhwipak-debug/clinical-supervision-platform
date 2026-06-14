export default function Loading() {
  return (
    <main className="min-h-screen bg-white px-4 py-5 text-[#081225]">
      <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center justify-between rounded-[18px] border border-[#e7ebf1] bg-white/90 px-6 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
        <div className="flex items-center gap-3 text-sm font-bold">
          <span className="h-4 w-4 rounded-xl bg-[#081225]" />
          ClinicFlow
        </div>
        <div className="hidden gap-3 text-xs font-semibold text-[#667085] sm:flex">
          <span>슈퍼바이저 찾기</span>
          <span>이용 가이드</span>
        </div>
      </div>
      <section className="mx-auto grid min-h-[620px] w-full max-w-[1180px] items-center gap-10 py-20 md:grid-cols-[1fr_430px]">
        <div>
          <div className="h-6 w-28 rounded-full bg-[#eef4ff]" />
          <div className="mt-8 h-14 w-full max-w-[560px] rounded-2xl bg-[#f3f6fb]" />
          <div className="mt-4 h-14 w-full max-w-[460px] rounded-2xl bg-[#f3f6fb]" />
          <div className="mt-8 h-5 w-full max-w-[520px] rounded-full bg-[#f8fafc]" />
          <div className="mt-3 h-5 w-full max-w-[410px] rounded-full bg-[#f8fafc]" />
        </div>
        <div className="rounded-[18px] border border-[#e7ebf1] bg-white p-6 shadow-[0_14px_28px_rgba(15,23,42,0.1)]">
          <div className="flex items-center justify-between">
            <div className="h-5 w-28 rounded-full bg-[#f3f6fb]" />
            <div className="h-8 w-20 rounded-xl bg-[#eef4ff]" />
          </div>
          <div className="mt-6 grid gap-3">
            <div className="h-16 rounded-xl border border-[#e7ebf1] bg-[#fbfcff]" />
            <div className="h-16 rounded-xl border border-[#e7ebf1] bg-[#fbfcff]" />
            <div className="h-16 rounded-xl border border-[#e7ebf1] bg-[#fbfcff]" />
          </div>
        </div>
      </section>
    </main>
  );
}

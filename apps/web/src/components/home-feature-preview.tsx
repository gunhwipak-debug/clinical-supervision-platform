"use client";

import { useState } from "react";

import { cn } from "../lib/ui/cn";

const featureTabs = [
  {
    key: "supervisors",
    label: "슈퍼바이저 찾기",
    title: "사례에 맞는 슈퍼바이저를 고릅니다",
    description: "전문분야, 진행 방식, 가능한 일정을 같은 기준으로 보고 비교합니다.",
    sidebar: ["전문분야", "진행 방식", "가능 일정"],
    rows: [
      ["이민서 슈퍼바이저", "성인 평가 · 보고서 구조", "프로필 보기"],
      ["김도현 슈퍼바이저", "사례 개념화 · 문서 코멘트", "프로필 보기"],
      ["박준영 슈퍼바이저", "인지 평가 · 해석 검토", "프로필 보기"]
    ],
    status: "비교 중"
  },
  {
    key: "request",
    label: "의뢰 작성",
    title: "방식에 맞게 의뢰 흐름이 달라집니다",
    description: "슈퍼바이저와 슈퍼비전 방식을 선택한 뒤 사례 자료 작성으로 이어집니다.",
    sidebar: ["슈퍼바이저", "슈퍼비전 방식", "예약 시간"],
    rows: [
      ["슈퍼바이저", "이민서 슈퍼바이저", "선택됨"],
      ["슈퍼비전 방식", "화상 슈퍼비전", "선택됨"],
      ["예약 시간", "6월 18일 19:00", "선택됨"]
    ],
    status: "초안 저장"
  },
  {
    key: "files",
    label: "자료 제출",
    title: "질문과 자료를 같은 흐름에 둡니다",
    description: "보고서 초안, 검사 결과, 면담 요약과 질문을 한 화면에서 정리합니다.",
    sidebar: ["사례 정보", "첨부파일", "제출 전 확인"],
    rows: [
      ["보고서_초안.pdf", "1.8MB · 제출 준비 완료", "열기"],
      ["MMPI_결과요약.xlsx", "820KB · 슈퍼바이저 열람 가능", "열기"],
      ["질문", "결론 문단 흐름 확인", "수정"]
    ],
    status: "자료 정리"
  },
  {
    key: "feedback",
    label: "피드백 확인",
    title: "보완 요청과 최종 피드백을 구분합니다",
    description:
      "지금 해야 할 보완과 완료 후 확인할 피드백이 같은 화면에서 섞이지 않습니다.",
    sidebar: ["검토 상태", "피드백", "첨부"],
    rows: [
      ["보완 요청", "검사 결과 원자료 추가", "자료 보완"],
      ["최종 피드백", "결론 문단 흐름 정리", "확인"],
      ["첨부파일", "코멘트 파일 1건", "다운로드"]
    ],
    status: "피드백 도착"
  },
  {
    key: "archive",
    label: "케이스 아카이브",
    title: "완료된 피드백은 학습 기록으로 남깁니다",
    description: "슈퍼바이저별, 사례별로 기록을 열어 이전 피드백을 다시 확인합니다.",
    sidebar: ["이민서 슈퍼바이저", "김도현 슈퍼바이저", "박준영 슈퍼바이저"],
    rows: [
      ["김OO", "종합심리평가 보고서", "기록 열기"],
      ["이OO", "초기 상담 구조화", "기록 열기"],
      ["박OO", "인지 평가 해석 검토", "기록 열기"]
    ],
    status: "기록 6건"
  }
] as const;

export function HomeFeaturePreview({
  variant = "section"
}: {
  variant?: "hero" | "section";
}) {
  const [activeKey, setActiveKey] = useState<(typeof featureTabs)[number]["key"]>(
    featureTabs[0].key
  );
  const active = featureTabs.find((item) => item.key === activeKey) ?? featureTabs[0];

  if (variant === "hero") {
    return (
      <div className="rounded-[16px] border border-[#e7ebf1] bg-white p-4 shadow-[0_24px_54px_rgba(8,18,37,0.08)]">
        <div
          className="mb-3 flex gap-1 overflow-x-auto rounded-xl border border-[#e7ebf1] bg-[#fbfcff] p-1"
          role="tablist"
          aria-label="제품 화면 예시"
        >
          {featureTabs.map((item) => (
            <button
              aria-selected={active.key === item.key}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition",
                active.key === item.key
                  ? "bg-[#2563ff] text-white"
                  : "text-[#5f6c8f] hover:bg-white hover:text-[#081225]"
              )}
              key={item.key}
              onClick={() => setActiveKey(item.key)}
              role="tab"
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
        <ProductPreview active={active} compact />
      </div>
    );
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:px-8">
      <div className="grid content-start gap-6">
        <span className="w-fit rounded-md border border-[#bfd1ff] bg-[#f5f8ff] px-4 py-2 text-sm font-semibold text-[#2563ff]">
          실제 화면으로 보는 흐름
        </span>
        <div className="grid gap-4">
          <h2 className="break-keep text-[3rem] font-bold leading-tight tracking-normal text-[#081225] md:text-[4.25rem]">
            기능 설명보다
            <br />
            작업 흐름이 먼저
            <br />
            보입니다
          </h2>
          <p className="max-w-xl break-keep text-lg leading-9 text-[#5f6c8f]">
            각 단계는 별도 홍보 카드가 아니라 실제 사용 화면의 구조로 보여줍니다.
          </p>
        </div>
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="제품 화면 예시"
        >
          {featureTabs.map((item) => (
            <button
              aria-selected={active.key === item.key}
              className={cn(
                "rounded-md border px-4 py-2 text-sm font-bold transition",
                active.key === item.key
                  ? "border-[#2563ff] bg-[#2563ff] text-white"
                  : "border-[#e7ebf1] bg-white text-[#5f6c8f] hover:bg-[#f8faff]"
              )}
              key={item.key}
              onClick={() => setActiveKey(item.key)}
              role="tab"
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="grid gap-2 border-l border-[#e7ebf1] pl-5">
          <h3 className="text-2xl font-bold text-[#081225]">{active.title}</h3>
          <p className="break-keep text-base leading-8 text-[#5f6c8f]">
            {active.description}
          </p>
        </div>
      </div>

      <div className="rounded-[18px] border border-[#e7ebf1] bg-white p-4 shadow-[0_24px_54px_rgba(8,18,37,0.08)]">
        <ProductPreview active={active} />
      </div>
    </section>
  );
}

function ProductPreview({
  active,
  compact = false
}: {
  active: (typeof featureTabs)[number];
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid overflow-hidden rounded-xl border border-[#e7ebf1] bg-[#fbfcff]",
        compact
          ? "min-h-[430px] lg:grid-cols-[168px_minmax(0,1fr)]"
          : "min-h-[410px] lg:grid-cols-[180px_minmax(0,1fr)]"
      )}
    >
      <aside className="border-b border-[#e7ebf1] bg-white p-4 lg:border-b-0 lg:border-r">
        <p className="text-xs font-bold text-[#8b94ad]">ClinicFlow</p>
        <div className="mt-5 grid gap-2">
          {active.sidebar.map((item, index) => (
            <div
              className={cn(
                "rounded-md px-3 py-2 font-bold",
                compact ? "text-xs" : "text-sm",
                index === 0 ? "bg-[#f5f8ff] text-[#2563ff]" : "text-[#5f6c8f]"
              )}
              key={item}
            >
              {item}
            </div>
          ))}
        </div>
      </aside>
      <div className={cn("grid content-start gap-4", compact ? "p-4" : "p-5")}>
        <div className="flex items-start justify-between gap-4 border-b border-[#e7ebf1] pb-4">
          <div>
            <p className="text-sm font-bold text-[#8b94ad]">{active.label}</p>
            <h3
              className={cn(
                "mt-2 font-bold text-[#081225]",
                compact ? "text-xl" : "text-2xl"
              )}
            >
              작업 보드
            </h3>
          </div>
          <span className="rounded-md bg-[#f5f8ff] px-3 py-2 text-sm font-bold text-[#2563ff]">
            {active.status}
          </span>
        </div>

        <div className="grid gap-2">
          {active.rows.map(([title, meta, action]) => (
            <div
              className={cn(
                "grid gap-3 rounded-lg border border-[#e7ebf1] bg-white md:grid-cols-[minmax(0,1fr)_auto] md:items-center",
                compact ? "px-3 py-3" : "px-4 py-4"
              )}
              key={`${active.key}-${title}`}
            >
              <div className="min-w-0">
                <p
                  className={cn(
                    "truncate font-bold text-[#081225]",
                    compact ? "text-sm" : "text-base"
                  )}
                >
                  {title}
                </p>
                <p className="mt-1 truncate text-xs font-semibold text-[#5f6c8f]">
                  {meta}
                </p>
              </div>
              <span className="w-fit rounded-md border border-[#e7ebf1] px-3 py-2 text-xs font-bold text-[#081225]">
                {action}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

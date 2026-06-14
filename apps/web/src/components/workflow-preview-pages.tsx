import Link from "next/link";
import type { ReactNode } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  FileText,
  FolderOpen,
  GraduationCap,
  ListChecks,
  MessageSquareText,
  Settings,
  ShieldCheck,
  Upload,
  UserRound
} from "lucide-react";

type Tone = "blue" | "green" | "amber" | "neutral" | "dark";

const flowSteps = [
  "슈퍼바이저 찾기",
  "세션 선택",
  "일정 선택",
  "사례자료 업로드",
  "확인·결제",
  "수락 대기",
  "슈퍼비전·검토",
  "피드백 확인",
  "학습 기록"
];

const supervisors = [
  {
    name: "이민서",
    field: "성인 평가 · 보고서 피드백",
    license: "임상심리전문가 · 정신건강임상심리사 1급",
    intro: "검사 결과를 상담 장면에서 바로 쓸 수 있는 문장으로 정리합니다.",
    initials: "이",
    tone: "blue" as Tone
  },
  {
    name: "박준",
    field: "아동·청소년 평가 · 부모 상담",
    license: "임상심리전문가",
    intro: "보호자 설명, 학교 의뢰, 추가 검사 판단을 함께 점검합니다.",
    initials: "박",
    tone: "green" as Tone
  },
  {
    name: "최유나",
    field: "상담 구조화 · 위기 사례",
    license: "상담심리전문가 · 슈퍼바이저",
    intro: "회기 목표와 다음 상담 질문을 짧고 실행 가능한 형태로 정리합니다.",
    initials: "최",
    tone: "amber" as Tone
  }
];

const featuredSupervisor = supervisors[0] ?? {
  name: "이민서",
  field: "성인 평가 · 보고서 피드백",
  license: "임상심리전문가 · 정신건강임상심리사 1급",
  intro: "검사 결과를 상담 장면에서 바로 쓸 수 있는 문장으로 정리합니다.",
  initials: "이",
  tone: "blue" as Tone
};

export function PreviewNotice() {
  return null;
}

export function DemoRequestsPreview() {
  return (
    <TechShell active="requests">
      <HeroBlock
        eyebrow="내 의뢰"
        title="내 슈퍼비전 현황을 확인합니다"
        subtitle="진행 중인 의뢰, 필요한 자료, 도착한 피드백을 먼저 보여줍니다."
        action={<TechButton href="/supervisors">새 슈퍼비전 시작</TechButton>}
        visual={<RequestMiniCard />}
      />
      <WorkflowBar current="사례자료 업로드" />
      <Section title="지금 처리할 일">
        <div className="grid gap-4">
          {[
            {
              status: "추가자료 요청",
              title: "종합심리평가 보고서",
              body: "검사 원자료와 보호자 면담 요약을 보완하면 검토가 이어집니다.",
              action: "자료 업로드",
              href: "/requests/demo-additional-info"
            },
            {
              status: "검토 진행 중",
              title: "초기 상담 구조화",
              body: "슈퍼바이저가 피드백 초안을 작성하고 있습니다.",
              action: "진행 보기",
              href: "/requests/demo-additional-info"
            },
            {
              status: "이수 기록 발급",
              title: "위기 사례 의사소통",
              body: "완료 기록과 피드백이 학습 기록에 저장되었습니다.",
              action: "기록 보기",
              href: "/case-archive"
            }
          ].map((item) => (
            <ActionRow key={item.title} {...item} />
          ))}
        </div>
      </Section>
    </TechShell>
  );
}

export function DemoNewRequestPreview() {
  return (
    <TechShell active="requests">
      <HeroBlock
        eyebrow="초안 작성"
        title="새 슈퍼비전 의뢰"
        subtitle="한 번에 한 단계만 선택합니다. 선택 내용은 오른쪽 요약에 바로 쌓입니다."
        action={<TechButton href="#material-upload">자료 업로드하기</TechButton>}
        visual={<SelectionSummary />}
      />
      <WorkflowBar current="사례자료 업로드" />
      <Section title="선택한 내용">
        <div className="grid gap-4 lg:grid-cols-4">
          <StepCard step="1" title="슈퍼바이저" body="이민서 · 성인 평가" done />
          <StepCard step="2" title="세션" body="사례 개념화 50분" done />
          <StepCard step="3" title="일정" body="6월 18일 목요일 19:00" done />
          <StepCard step="4" title="사례자료 업로드" body="주호소, 의뢰 사유, 첨부 문서" active />
        </div>
      </Section>
      <MaterialUploadPanel />
    </TechShell>
  );
}

export function DemoRequestDetailPreview() {
  return (
    <TechShell active="requests">
      <HeroBlock
        eyebrow="추가자료 요청"
        title="의뢰 상세"
        subtitle="REQ-1042 · 필요한 자료를 먼저 보완하세요."
        action={<TechButton href="#upload">추가자료 업로드</TechButton>}
        visual={<RequestStateCard />}
      />
      <WorkflowBar current="사례자료 업로드" />
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 pb-24 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="grid gap-5">
          <DarkPanel
            eyebrow="다음 행동"
            title="지금 해야 할 일"
            body="슈퍼바이저가 검사 원자료와 보호자 면담 요약을 추가로 요청했습니다."
          />
          <Surface id="upload">
            <div className="flex items-center gap-3">
              <FileText aria-hidden className="text-[#2563ff]" size={22} />
              <h2 className="text-xl font-bold tracking-[-0.02em] text-[#081124]">
                업로드 자료
              </h2>
            </div>
            <div className="mt-5 grid gap-3">
              <MaterialRow title="사례요약 1건" detail="6월 14일 업로드" status="제출 완료" />
              <MaterialRow title="검사결과 PDF 2건" detail="K-WISC-V, CBCL 확인됨" status="제출 완료" />
              <MaterialRow
                title="보호자 면담 요약"
                detail="요청일 6월 14일 · 제출 기한 6월 17일"
                status="추가자료 요청"
                action="파일 추가"
              />
            </div>
          </Surface>
          <Surface>
            <h2 className="text-xl font-bold tracking-[-0.02em] text-[#081124]">
              최근 피드백
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#516070]">
              요청 사유: 진단 가설은 유지하되, 면담 기록을 보완한 뒤 개입
              우선순위를 다시 정리해야 합니다.
            </p>
          </Surface>
        </section>
        <SideSummary
          title="의뢰 요약"
          rows={[
            ["상태", "추가자료 요청"],
            ["슈퍼바이저", "이민서"],
            ["세션", "사례 개념화 50분"],
            ["일정", "6월 18일 19:00"]
          ]}
        />
      </div>
    </TechShell>
  );
}

export function DemoPaymentsPreview() {
  return (
    <TechShell active="payments">
      <HeroBlock
        eyebrow="최종 확인"
        title="선택 내용을 확인하고 결제합니다"
        subtitle="슈퍼바이저, 세션, 일정, 자료를 한 번 더 확인한 뒤 신청을 확정합니다."
        action={<TechButton href="/payments/demo-receipt">결제하고 신청 완료</TechButton>}
        visual={<PaymentCard />}
      />
      <WorkflowBar current="확인·결제" />
      <Section title="결제 전 확인">
        <div className="grid gap-4 lg:grid-cols-3">
          <InfoCard title="이민서 슈퍼바이저" body="사례 개념화 50분 · 6월 18일 19:00" />
          <InfoCard title="보고서 초안 외 2건" body="검사 결과, 면담 요약, 질문을 함께 제출합니다." />
          <InfoCard title="결제 후 진행" body="슈퍼바이저가 일정과 자료를 확인합니다." />
        </div>
      </Section>
    </TechShell>
  );
}

export function DemoPaymentDetailPreview() {
  return (
    <TechShell active="payments">
      <HeroBlock
        eyebrow="수락 대기"
        title="슈퍼바이저 확인을 기다립니다"
        subtitle="결제와 자료 제출이 끝났습니다. 수락되거나 보완 요청이 오면 의뢰 상세에서 바로 확인합니다."
        action={<TechButton href="/requests/demo-additional-info">의뢰 상태 보기</TechButton>}
        visual={<WaitingCard />}
      />
      <WorkflowBar current="수락 대기" />
      <Section title="신청 요약">
        <div className="grid gap-4 lg:grid-cols-3">
          <InfoCard title="결제 완료" body="120,000원 · 사례 개념화 50분" />
          <InfoCard title="자료 3건 제출" body="보고서 초안, 검사 결과, 면담 요약" />
          <InfoCard title="다음 알림" body="수락 또는 보완 요청이 도착하면 알려드립니다." />
        </div>
      </Section>
    </TechShell>
  );
}

export function DemoCaseArchivePreview() {
  return (
    <TechShell active="case-archive">
      <HeroBlock
        eyebrow="학습 기록"
        title="완료된 슈퍼비전은 폴더처럼 남습니다"
        subtitle="슈퍼바이저 폴더를 열고, 그 아래 사례별 피드백과 완료 기록을 바로 확인합니다."
        action={<TechButton href="/supervisors">새 슈퍼비전 시작</TechButton>}
        visual={<ArchivePreview />}
      />
      <WorkflowBar current="학습 기록" />
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 pb-24 lg:grid-cols-[minmax(0,1fr)_330px]">
        <Surface>
          <h2 className="text-xl font-bold tracking-[-0.02em] text-[#081124]">
            슈퍼비전 노트
          </h2>
          <div className="mt-5 grid gap-3">
            <RecordFolder
              title="이민서 슈퍼바이저"
              records={[
                ["김OO", "최종 피드백 완료", "종합심리평가 보고서", ["보고서 문장 피드백", "검사 해석 보완점", "완료 기록"]],
                ["이OO", "학습기록 발급", "초기 상담 구조화", ["회기 목표", "질문 순서", "다음 상담 준비"]],
                ["최OO", "보완 자료 있음", "평가 면담 요약", ["보호자 면담 요약", "해석 가설 메모"]]
              ]}
            />
            <RecordFolder
              title="최유나 슈퍼바이저"
              records={[
                ["박OO", "검토 완료", "아동 평가 보고서", ["행동관찰 기록", "보호자 설명 문장"]],
                ["정OO", "복습 필요", "발달 평가 자문", ["추가 검사 선택", "의뢰 문장 예시"]]
              ]}
            />
            <RecordFolder
              title="한지우 슈퍼바이저"
              records={[
                ["윤OO", "완료", "위기 사례 의사소통", ["위험도 판단", "기관 공유 문장"]]
              ]}
            />
          </div>
        </Surface>
        <SideSummary
          title="선택한 기록"
          rows={[
            ["사례", "김OO"],
            ["주제", "종합심리평가 보고서"],
            ["저장된 항목", "핵심 피드백, 보완 자료, 이수 기록"],
            ["최근 정리", "6월 20일"]
          ]}
        />
      </div>
    </TechShell>
  );
}

export function DemoSettingsPreview() {
  return (
    <TechShell active="settings">
      <HeroBlock
        eyebrow="계정 설정"
        title="업무에 필요한 정보만 정리합니다"
        subtitle="소속, 직무, 관심 영역, 슈퍼바이저 신청 상태를 한 화면에서 관리합니다."
        action={<TechButton href="/supervisor/profile" variant="secondary">슈퍼바이저 프로필 보기</TechButton>}
        visual={<SettingsPreview />}
      />
      <Section title="프로필">
        <div className="grid gap-4 lg:grid-cols-2">
          <InfoCard title="기본 계정" body="clinician@example.com · OO병원 정신건강의학과" />
          <InfoCard title="관심 영역" body="아동 평가, 부모 상담, 보고서 피드백" />
        </div>
      </Section>
    </TechShell>
  );
}

export function DemoNotificationsPreview() {
  return (
    <TechShell active="notifications">
      <HeroBlock
        eyebrow="알림"
        title="필요한 행동만 놓치지 않습니다"
        subtitle="자료 요청, 피드백 도착, 이수 기록 발급처럼 다음 행동이 있는 알림만 먼저 보여줍니다."
        visual={<NotificationPreview />}
      />
      <Section title="최근 알림">
        <div className="grid gap-3">
          <ActionRow status="추가자료 요청" title="REQ-1042" body="보호자 면담 요약이 필요합니다." action="자료 업로드" href="/requests/demo-additional-info" />
          <ActionRow status="피드백 도착" title="초기 상담 구조화" body="슈퍼바이저 피드백을 확인할 수 있습니다." action="피드백 보기" href="/requests/demo-additional-info" />
          <ActionRow status="이수 기록 발급" title="위기 사례 의사소통" body="완료 기록이 학습 기록에 저장되었습니다." action="기록 보기" href="/case-archive" />
        </div>
      </Section>
    </TechShell>
  );
}

export function DemoSupervisorHomePreview() {
  return (
    <TechShell active="supervisor">
      <HeroBlock
        eyebrow="요청 목록"
        title="검토할 의뢰"
        subtitle="새 자료가 도착했거나 수락 판단이 필요한 요청을 먼저 보여줍니다."
        action={<TechButton href="/supervisor/requests">첫 요청 열기</TechButton>}
        visual={<SupervisorQueuePreview />}
      />
      <Section title="오늘 처리할 요청">
        <QueueList />
      </Section>
    </TechShell>
  );
}

export function DemoSupervisorRequestsPreview() {
  return (
    <TechShell active="supervisor">
      <HeroBlock
        eyebrow="의뢰 큐"
        title="새 자료, 수락 대기, 초안을 한 줄로 봅니다"
        subtitle="처리 순서가 필요한 요청만 모아 보여줍니다."
        action={<TechButton href="/supervisor/requests/demo-review">첫 요청 열기</TechButton>}
        visual={<SupervisorQueuePreview />}
      />
      <Section title="검토 목록">
        <QueueList />
      </Section>
    </TechShell>
  );
}

export function DemoSupervisorRequestDetailPreview() {
  return (
    <TechShell active="supervisor">
      <HeroBlock
        eyebrow="검토 진행 중"
        title="사례 검토"
        subtitle="사례 자료를 보며 피드백을 작성합니다."
        action={<TechButton href="#feedback">피드백 제출</TechButton>}
        visual={<ReviewSummary />}
      />
      <WorkflowBar current="슈퍼비전·검토" />
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 pb-24 lg:grid-cols-[300px_minmax(0,1fr)_320px]">
        <SideSummary
          title="사례 요약"
          rows={[
            ["세션", "사례 개념화 50분"],
            ["예약", "6월 18일 19:00"],
            ["자료", "보고서 초안 외 2건"],
            ["요청", "진단 가설, 추가 질문, 문장 수정"]
          ]}
        />
        <Surface>
          <div className="flex items-center gap-3">
            <FolderOpen aria-hidden className="text-[#2563ff]" size={22} />
            <h2 className="text-xl font-bold tracking-[-0.02em] text-[#081124]">
              사례 자료
            </h2>
          </div>
          <div className="mt-5 grid gap-3">
            <MaterialRow title="사례요약.pdf" detail="핵심 정보 확인됨" status="확인 완료" action="열람" />
            <MaterialRow title="검사결과.pdf" detail="원자료 추가 확인 필요" status="보완 필요" action="열람" />
            <MaterialRow title="보호자면담요약.docx" detail="새로 도착한 자료" status="미열람" action="열람" />
          </div>
          <div id="feedback" className="mt-6 rounded-[16px] border border-[#e3e8ef] bg-[#f7f9fc] p-5">
            <h3 className="font-bold text-[#081124]">피드백 초안</h3>
            <p className="mt-2 text-sm leading-7 text-[#516070]">
              강점, 보완 자료, 다음 상담에서 확인할 질문을 3개 항목으로 정리합니다.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {["강점", "보완 자료", "다음 상담 질문", "위험·주의 사항 없음"].map((item) => (
                <CheckItem key={item}>{item}</CheckItem>
              ))}
            </div>
          </div>
        </Surface>
        <DarkPanel
          eyebrow="다음 행동"
          title="면담 요약을 읽고 피드백을 마무리하세요"
          body="자료 확인 후 피드백을 제출하거나 보완 요청을 남깁니다."
        />
      </div>
    </TechShell>
  );
}

export function DemoSupervisorProfilePreview() {
  return (
    <TechShell active="supervisor">
      <HeroBlock
        eyebrow="공개 프로필"
        title="사진, 자격, 전문분야, 자기소개를 관리합니다"
        subtitle="사용자가 슈퍼바이저를 선택할 때 필요한 정보만 또렷하게 보여줍니다."
        action={<TechButton href="/supervisors">공개 화면 보기</TechButton>}
        visual={<SupervisorCard supervisor={featuredSupervisor} />}
      />
      <Section title="프로필 입력">
        <div className="grid gap-4 lg:grid-cols-2">
          <InfoCard title="자격" body="임상심리전문가 · 정신건강임상심리사 1급" />
          <InfoCard title="전문 분야" body="성인 평가, 보고서 피드백, 사례 개념화" />
        </div>
      </Section>
    </TechShell>
  );
}

export function DemoSupervisorAvailabilityPreview() {
  return (
    <TechShell active="supervisor">
      <HeroBlock
        eyebrow="가능 일정"
        title="예약 가능한 시간을 정리합니다"
        subtitle="신청자가 무리 없는 일정으로 선택할 수 있게 실제 가능한 시간만 열어둡니다."
        action={<TechButton href="/supervisor/availability" variant="secondary">저장</TechButton>}
        visual={<CalendarPreview />}
      />
      <Section title="이번 주 가능 시간">
        <div className="grid gap-4 lg:grid-cols-3">
          <InfoCard title="월 19:00" body="온라인 50분 세션 가능" />
          <InfoCard title="수 20:00" body="보고서 피드백 가능" />
          <InfoCard title="토 10:00" body="아동 평가 자문 가능" />
        </div>
      </Section>
    </TechShell>
  );
}

export function DemoSupervisorProductsPreview() {
  return (
    <TechShell active="supervisor">
      <HeroBlock
        eyebrow="제공 항목"
        title="슈퍼비전 방식을 명확히 보여줍니다"
        subtitle="사용자가 무엇을 받을 수 있는지 시간, 범위, 비용을 함께 확인합니다."
        action={<TechButton href="/supervisor/products" variant="secondary">항목 추가</TechButton>}
        visual={<ProductPreview />}
      />
      <Section title="제공 중인 세션">
        <div className="grid gap-4 lg:grid-cols-3">
          <InfoCard title="사례 개념화" body="50분 · 120,000원" />
          <InfoCard title="보고서 피드백" body="문서 검토 · 90,000원" />
          <InfoCard title="부모 상담 준비" body="50분 · 110,000원" />
        </div>
      </Section>
    </TechShell>
  );
}

export function DemoSupervisorMemoryPreview() {
  return (
    <TechShell active="supervisor">
      <HeroBlock
        eyebrow="슈퍼비전 노트"
        title="반복되는 피드백 맥락을 사례별로 정리합니다"
        subtitle="검토 중 자주 쓰는 문장, 질문, 보완 기준을 업무 노트처럼 보관합니다."
        visual={<ArchivePreview />}
      />
      <Section title="저장된 노트">
        <div className="grid gap-3">
          <RecordFolder title="평가 보고서 피드백" records={[["진단 가설", "문장 정리", "보호자 설명", ["표현 예시", "주의 문장", "추가 질문"]]]} />
          <RecordFolder title="초기 상담 구조화" records={[["회기 목표", "질문 순서", "다음 상담 준비", ["목표 합의", "위험도 확인", "숙제 제안"]]]} />
        </div>
      </Section>
    </TechShell>
  );
}

export function DemoSupervisorPayoutsPreview() {
  return (
    <TechShell active="supervisor">
      <HeroBlock
        eyebrow="정산"
        title="완료된 슈퍼비전의 정산 상태를 확인합니다"
        subtitle="금액, 예정일, 지급 완료 여부를 한 줄로 확인합니다."
        visual={<PayoutPreview />}
      />
      <Section title="정산 내역">
        <div className="grid gap-3">
          <ActionRow status="정산 예정" title="종합심리평가 보고서" body="6월 28일 지급 예정 · 120,000원" action="상세 보기" href="/supervisor/payouts" />
          <ActionRow status="정산 완료" title="초기 상담 구조화" body="6월 12일 지급 완료 · 90,000원" action="영수증 보기" href="/supervisor/payouts" />
        </div>
      </Section>
    </TechShell>
  );
}

export function DemoSupervisorQualificationsPreview() {
  return (
    <TechShell active="supervisor">
      <HeroBlock
        eyebrow="자격 심사"
        title="공개 목록에 필요한 자격 자료를 정리합니다"
        subtitle="자격, 전문분야, 소개 문구가 제출 증빙과 맞는지 확인합니다."
        action={<TechButton href="/supervisor/profile">프로필 수정</TechButton>}
        visual={<QualificationPreview />}
      />
      <Section title="제출 자료">
        <div className="grid gap-4 lg:grid-cols-2">
          <InfoCard title="임상심리전문가 증빙" body="자격번호, 발급기관, 공개 문구 확인 필요" />
          <InfoCard title="정신건강임상심리사 1급" body="증빙 파일과 전문분야 일치 여부 확인" />
        </div>
      </Section>
    </TechShell>
  );
}

function TechShell({
  active,
  children
}: {
  active?: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f7f9fc] text-[#081124]">
      <header className="sticky top-0 z-40 border-b border-[#e5eaf1]/90 bg-white/92 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link className="flex items-center gap-3 text-sm font-black text-[#081124]" href="/">
            <span className="h-4 w-4 rounded-full bg-[#07142f]" />
            ClinicFlow
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <HeaderGroup label="서비스" active={active === "guide"}>
              <HeaderLink href="/guide">진행 방식</HeaderLink>
              <HeaderLink href="/resources">가이드·자료</HeaderLink>
              <HeaderLink href="/security">보안 안내</HeaderLink>
            </HeaderGroup>
            <HeaderGroup label="슈퍼바이저" active={active === "supervisors"}>
              <HeaderLink href="/supervisors">슈퍼바이저 찾기</HeaderLink>
              <HeaderLink href="/supervisors/demo">프로필 예시</HeaderLink>
            </HeaderGroup>
            <HeaderGroup label="내 의뢰" active={active === "requests" || active === "payments" || active === "case-archive"}>
              <HeaderLink href="/requests">의뢰 현황</HeaderLink>
              <HeaderLink href="/requests/new">새 의뢰</HeaderLink>
              <HeaderLink href="/case-archive">학습 기록</HeaderLink>
            </HeaderGroup>
            <HeaderGroup label="업무" active={active === "supervisor"}>
              <HeaderLink href="/supervisor">슈퍼바이저 업무</HeaderLink>
              <HeaderLink href="/supervisor/requests">의뢰 큐</HeaderLink>
              <HeaderLink href="/supervisor/profile">공개 프로필</HeaderLink>
            </HeaderGroup>
          </nav>
          <div className="flex items-center gap-2">
            <Link className="hidden rounded-[12px] px-4 py-2 text-xs font-bold text-[#516070] hover:bg-[#f2f5f9] sm:inline-flex" href="/login">
              로그인
            </Link>
            <Link className="rounded-[14px] bg-[#2563ff] px-4 py-2 text-xs font-bold text-white shadow-[0_10px_22px_rgba(37,99,255,0.22)]" href="/supervisors">
              시작하기
            </Link>
          </div>
        </div>
      </header>
      {children}
    </main>
  );
}

function HeaderGroup({
  active,
  children,
  label
}: {
  active?: boolean;
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="group relative">
      <button
        className={`rounded-[12px] px-3 py-2 text-xs font-bold transition ${
          active ? "bg-[#eef4ff] text-[#2563ff]" : "text-[#516070] hover:bg-[#f2f5f9]"
        }`}
        type="button"
      >
        {label}
      </button>
      <div className="invisible absolute left-0 top-full w-52 pt-3 opacity-0 transition group-hover:visible group-hover:opacity-100">
        <div className="grid gap-1 rounded-[16px] border border-[#e3e8ef] bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
          {children}
        </div>
      </div>
    </div>
  );
}

function HeaderLink({ children, href }: { children: ReactNode; href: string }) {
  return (
    <Link className="rounded-[10px] px-3 py-2 text-xs font-bold text-[#516070] hover:bg-[#f7f9fc] hover:text-[#081124]" href={href as never}>
      {children}
    </Link>
  );
}

function HeroBlock({
  action,
  eyebrow,
  subtitle,
  title,
  visual
}: {
  action?: ReactNode;
  eyebrow: string;
  subtitle: string;
  title: string;
  visual?: ReactNode;
}) {
  return (
    <section className="mx-auto grid min-h-[560px] max-w-7xl items-center gap-14 px-5 py-20 lg:grid-cols-[1.02fr_0.98fr]">
      <div>
        <Pill tone="blue">{eyebrow}</Pill>
        <h1 className="mt-7 max-w-3xl text-[clamp(42px,5.4vw,72px)] font-black leading-[0.98] tracking-[-0.055em] text-[#081124]">
          {title}
        </h1>
        <p className="mt-6 max-w-xl text-[15px] leading-8 text-[#516070]">{subtitle}</p>
        {action ? <div className="mt-8">{action}</div> : null}
      </div>
      {visual ? <div className="relative">{visual}</div> : null}
    </section>
  );
}

function Section({
  children,
  eyebrow,
  title
}: {
  children: ReactNode;
  eyebrow?: string;
  title: string;
}) {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-14">
      {eyebrow ? <Pill tone="blue">{eyebrow}</Pill> : null}
      <h2 className="mb-8 text-[clamp(30px,4vw,48px)] font-black leading-tight tracking-[-0.04em] text-[#081124]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function TechButton({
  children,
  href,
  variant = "primary"
}: {
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary";
}) {
  const className =
    variant === "primary"
      ? "inline-flex min-h-11 items-center gap-2 rounded-[14px] bg-[#2563ff] px-5 text-sm font-black text-white shadow-[0_10px_22px_rgba(37,99,255,0.22)]"
      : "inline-flex min-h-11 items-center gap-2 rounded-[14px] border border-[#dce3ec] bg-white px-5 text-sm font-black text-[#344054]";
  return (
    <Link className={className} href={href as never}>
      {children}
      <ChevronRight aria-hidden size={16} />
    </Link>
  );
}

function WorkflowBar({ current }: { current: string }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-10">
      <div className="overflow-hidden rounded-[999px] border border-[#dfe6ef] bg-white p-1 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
        <div className="grid min-w-[920px] grid-cols-9 gap-1">
          {flowSteps.map((step) => (
            <div
              className={`rounded-[999px] px-3 py-2 text-center text-[11px] font-black ${
                step === current ? "bg-[#2563ff] text-white" : "text-[#64748b]"
              }`}
              key={step}
            >
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Surface({
  children,
  id
}: {
  children: ReactNode;
  id?: string;
}) {
  return (
    <div id={id} className="rounded-[18px] border border-[#e3e8ef] bg-white p-6 shadow-[0_12px_26px_rgba(15,23,42,0.06)]">
      {children}
    </div>
  );
}

function DarkPanel({
  body,
  eyebrow,
  title
}: {
  body: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="rounded-[18px] bg-[#081630] p-7 text-white shadow-[0_18px_34px_rgba(8,22,48,0.18)]">
      <Pill tone="blue">{eyebrow}</Pill>
      <h2 className="mt-5 text-2xl font-black tracking-[-0.03em]">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-[#c8d5e6]">{body}</p>
    </div>
  );
}

function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  const styles: Record<Tone, string> = {
    blue: "bg-[#eef4ff] text-[#2563ff]",
    green: "bg-[#ecfdf3] text-[#027a48]",
    amber: "bg-[#fff7e6] text-[#b54708]",
    neutral: "bg-[#f2f5f9] text-[#516070]",
    dark: "bg-[#101d36] text-white"
  };
  return (
    <span className={`inline-flex rounded-[999px] px-3 py-1 text-[11px] font-black ${styles[tone]}`}>
      {children}
    </span>
  );
}

function StepCard({
  active,
  body,
  done,
  step,
  title
}: {
  active?: boolean;
  body: string;
  done?: boolean;
  step: string;
  title: string;
}) {
  return (
    <Surface>
      <div className="flex items-start justify-between gap-4">
        <Pill tone={active ? "blue" : done ? "green" : "neutral"}>{done ? "완료" : active ? "작성 중" : step}</Pill>
        <span className="text-xs font-black text-[#94a3b8]">{step}</span>
      </div>
      <h3 className="mt-4 text-xl font-black tracking-[-0.03em] text-[#081124]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#516070]">{body}</p>
    </Surface>
  );
}

function ActionRow({
  action,
  body,
  href,
  status,
  title
}: {
  action: string;
  body: string;
  href: string;
  status: string;
  title: string;
}) {
  return (
    <div className="grid gap-4 rounded-[18px] border border-[#e3e8ef] bg-white p-5 shadow-[0_10px_22px_rgba(15,23,42,0.04)] md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <Pill tone={status.includes("완료") ? "green" : status.includes("요청") ? "amber" : "blue"}>{status}</Pill>
        <h3 className="mt-3 text-xl font-black tracking-[-0.03em] text-[#081124]">{title}</h3>
        <p className="mt-2 text-sm leading-7 text-[#516070]">{body}</p>
      </div>
      <TechButton href={href} variant="secondary">{action}</TechButton>
    </div>
  );
}

function InfoCard({ body, title }: { body: string; title: string }) {
  return (
    <Surface>
      <h3 className="text-xl font-black tracking-[-0.03em] text-[#081124]">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[#516070]">{body}</p>
    </Surface>
  );
}

function SideSummary({ rows, title }: { rows: Array<[string, string]>; title: string }) {
  return (
    <Surface>
      <h2 className="text-xl font-black tracking-[-0.03em] text-[#081124]">{title}</h2>
      <dl className="mt-5 grid gap-4 text-sm">
        {rows.map(([label, value]) => (
          <div className="flex items-start justify-between gap-5 border-b border-[#edf1f6] pb-3 last:border-0 last:pb-0" key={label}>
            <dt className="font-bold text-[#667085]">{label}</dt>
            <dd className="max-w-[64%] text-right font-black text-[#081124]">{value}</dd>
          </div>
        ))}
      </dl>
    </Surface>
  );
}

function MaterialRow({
  action,
  detail,
  status,
  title
}: {
  action?: string;
  detail: string;
  status: string;
  title: string;
}) {
  return (
    <div className="grid gap-3 rounded-[14px] border border-[#e3e8ef] bg-[#f7f9fc] p-4 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <h3 className="font-black text-[#081124]">{title}</h3>
        <p className="mt-1 text-xs font-bold text-[#667085]">{detail}</p>
      </div>
      <div className="flex items-center gap-2">
        <Pill tone={status.includes("보완") || status.includes("요청") ? "amber" : status.includes("미열람") ? "neutral" : "green"}>
          {status}
        </Pill>
        {action ? (
          <button className="rounded-[12px] border border-[#dce3ec] bg-white px-3 py-2 text-xs font-black text-[#344054]" type="button">
            {action}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function MaterialUploadPanel() {
  return (
    <section id="material-upload" className="mx-auto w-full max-w-6xl px-5 pb-24">
      <div className="grid gap-6 rounded-[22px] border border-[#e3e8ef] bg-white p-6 shadow-[0_16px_34px_rgba(15,23,42,0.07)] lg:grid-cols-[minmax(0,1fr)_330px]">
        <div>
          <Pill tone="blue">자료 업로드</Pill>
          <h2 className="mt-5 text-[clamp(30px,4vw,48px)] font-black leading-tight tracking-[-0.04em] text-[#081124]">
            질문과 자료를 같은 화면에서 정리합니다
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#516070]">
            보고서 초안, 검사 결과, 면담 요약을 올리고 이번 슈퍼비전에서 꼭
            확인받고 싶은 질문을 함께 남깁니다.
          </p>
          <div className="mt-6 grid place-items-center gap-3 rounded-[18px] border border-dashed border-[#a9bdfd] bg-[#f7f9fc] p-9 text-center">
            <Upload aria-hidden className="text-[#2563ff]" size={30} />
            <h3 className="text-xl font-black tracking-[-0.03em]">자료 파일을 선택하세요</h3>
            <p className="max-w-md text-sm leading-7 text-[#516070]">
              PDF, 이미지, HWP/HWPX, DOCX/XLSX를 올릴 수 있습니다. 실행파일과 압축파일은 받지 않습니다.
            </p>
            <button className="rounded-[14px] bg-[#2563ff] px-5 py-3 text-sm font-black text-white" type="button">
              파일 선택
            </button>
          </div>
        </div>
        <div className="grid content-start gap-4">
          <SideSummary
            title="제출 전 체크"
            rows={[
              ["사례 요약", "필수"],
              ["검사 결과", "필수"],
              ["질문", "필수"],
              ["보호자 면담", "선택"]
            ]}
          />
          <TechButton href="/payments">최종 확인하기</TechButton>
        </div>
      </div>
    </section>
  );
}

function RecordFolder({
  records,
  title
}: {
  records: Array<[string, string, string, string[]]>;
  title: string;
}) {
  const count = records.reduce((sum, [, , , leaves]) => sum + leaves.length, 0);
  return (
    <details className="overflow-hidden rounded-[16px] border border-[#e3e8ef] bg-white" open>
      <summary className="grid cursor-pointer list-none grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4">
        <FolderOpen aria-hidden className="text-[#2563ff]" size={20} />
        <span className="font-black text-[#081124]">{title}</span>
        <span className="text-xs font-black text-[#667085]">{records.length}건 · 기록 {count}개</span>
      </summary>
      <div className="grid gap-3 border-t border-[#edf1f6] bg-[#f7f9fc] p-4">
        {records.map(([person, status, topic, leaves]) => (
          <details className="rounded-[14px] border border-[#e3e8ef] bg-white p-4" key={`${title}-${person}-${topic}`} open>
            <summary className="cursor-pointer list-none">
              <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <h3 className="font-black text-[#081124]">{person} · {topic}</h3>
                  <p className="mt-1 text-xs font-bold text-[#667085]">{status}</p>
                </div>
                <Pill tone="neutral">{leaves.length}개 기록</Pill>
              </div>
            </summary>
            <div className="mt-3 grid gap-2 border-l border-[#dfe6ef] pl-4">
              {leaves.map((leaf) => (
                <Link className="flex items-center justify-between rounded-[12px] bg-[#f7f9fc] px-3 py-2 text-sm font-bold text-[#344054]" href="/requests/demo-additional-info" key={leaf}>
                  <span className="flex items-center gap-2">
                    <FileText aria-hidden size={15} />
                    {leaf}
                  </span>
                  <span className="text-xs text-[#667085]">열기</span>
                </Link>
              ))}
            </div>
          </details>
        ))}
      </div>
    </details>
  );
}

function QueueList() {
  const items = [
    {
      status: "자료 도착",
      title: "종합심리평가 보고서",
      body: "검사결과가 추가되었습니다. 새 자료를 확인한 뒤 피드백 초안을 이어 씁니다.",
      meta: "마지막 변경 12분 전",
      action: "자료 확인"
    },
    {
      status: "수락 대기",
      title: "아동 평가 자문",
      body: "새 신청이 들어왔습니다. 일정과 자료 범위를 보고 수락 여부를 결정합니다.",
      meta: "마지막 변경 35분 전",
      action: "수락 확인"
    },
    {
      status: "초안 저장",
      title: "초기 상담 구조화",
      body: "피드백 초안이 저장되어 있습니다. 작성 중인 의견을 열어 마무리합니다.",
      meta: "오늘 18:00 전 제출",
      action: "이어 쓰기"
    }
  ];
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div className="grid gap-4 rounded-[18px] border border-[#e3e8ef] bg-white p-5 shadow-[0_10px_22px_rgba(15,23,42,0.04)] md:grid-cols-[1fr_auto] md:items-center" key={item.title}>
          <div>
            <Pill tone="blue">{item.status}</Pill>
            <h3 className="mt-3 text-xl font-black tracking-[-0.03em] text-[#081124]">{item.title}</h3>
            <p className="mt-2 text-sm leading-7 text-[#516070]">{item.body}</p>
            <p className="mt-2 text-xs font-black text-[#667085]">{item.meta}</p>
          </div>
          <TechButton href="/supervisor/requests/demo-review" variant="secondary">{item.action}</TechButton>
        </div>
      ))}
    </div>
  );
}

function CheckItem({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-[12px] border border-[#e3e8ef] bg-white px-3 py-2 text-sm font-bold text-[#344054]">
      <CheckCircle2 aria-hidden className="text-[#2563ff]" size={16} />
      {children}
    </div>
  );
}

function SupervisorCard({ supervisor }: { supervisor: (typeof supervisors)[number] }) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-[#e3e8ef] bg-white shadow-[0_12px_26px_rgba(15,23,42,0.06)]">
      <div className={`grid h-56 place-items-center ${supervisor.tone === "green" ? "bg-[#ecfdf3]" : supervisor.tone === "amber" ? "bg-[#fff7e6]" : "bg-[#eef4ff]"}`}>
        <div className="grid h-28 w-28 place-items-center rounded-[28px] bg-white text-5xl font-black text-[#081124] shadow-[0_14px_30px_rgba(15,23,42,0.10)]">
          {supervisor.initials}
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-2xl font-black tracking-[-0.03em] text-[#081124]">{supervisor.name}</h3>
        <p className="mt-2 text-sm font-bold text-[#2563ff]">{supervisor.field}</p>
        <p className="mt-2 text-sm leading-7 text-[#516070]">{supervisor.license}</p>
        <p className="mt-3 text-sm leading-7 text-[#344054]">{supervisor.intro}</p>
      </div>
    </div>
  );
}

function RequestMiniCard() {
  return (
    <div className="relative mx-auto max-w-md">
      <Surface>
        <div className="flex items-start justify-between gap-4">
          <div>
            <Pill tone="blue">자료 제출 중</Pill>
            <h3 className="mt-4 text-2xl font-black tracking-[-0.03em]">REQ-1042</h3>
          </div>
          <ListChecks aria-hidden className="text-[#2563ff]" />
        </div>
        <p className="mt-5 text-sm leading-7 text-[#516070]">
          성인 평가 · 사례 개념화 50분 · 6월 18일 19:00
        </p>
        <div className="mt-5 grid gap-3">
          {["슈퍼바이저 선택", "자료 업로드", "피드백 확인", "학습 기록"].map((item, index) => (
            <div className="flex items-center gap-3 rounded-[12px] bg-[#f7f9fc] px-3 py-2 text-sm font-bold text-[#344054]" key={item}>
              <span className={`h-2.5 w-2.5 rounded-full ${index < 2 ? "bg-[#2563ff]" : "bg-[#d7dee8]"}`} />
              {item}
            </div>
          ))}
        </div>
      </Surface>
    </div>
  );
}

function SelectionSummary() {
  return (
    <Surface>
      <h3 className="text-xl font-black tracking-[-0.03em]">선택 요약</h3>
      <SideRows
        rows={[
          ["슈퍼바이저", "이민서"],
          ["세션", "사례 개념화 50분"],
          ["일정", "6월 18일 19:00"],
          ["다음 단계", "자료 업로드"]
        ]}
      />
    </Surface>
  );
}

function RequestStateCard() {
  return (
    <DarkPanel
      eyebrow="현재 상태"
      title="자료를 보완하면 검토가 이어집니다"
      body="요청받은 자료와 최근 피드백을 같은 화면에서 확인하고 바로 파일을 추가합니다."
    />
  );
}

function PaymentCard() {
  return (
    <Surface>
      <CreditCard aria-hidden className="text-[#2563ff]" />
      <h3 className="mt-4 text-3xl font-black tracking-[-0.04em]">120,000원</h3>
      <p className="mt-3 text-sm leading-7 text-[#516070]">
        이민서 슈퍼바이저 · 사례 개념화 50분
      </p>
      <SideRows rows={[["자료", "3건"], ["일정", "6월 18일 19:00"], ["상태", "결제 예정"]]} />
    </Surface>
  );
}

function WaitingCard() {
  return (
    <DarkPanel
      eyebrow="현재 상태"
      title="지금은 추가 입력이 없습니다"
      body="슈퍼바이저가 일정과 자료를 확인하면 다음 단계로 이동합니다."
    />
  );
}

function ArchivePreview() {
  return (
    <Surface>
      <FolderOpen aria-hidden className="text-[#2563ff]" />
      <h3 className="mt-4 text-2xl font-black tracking-[-0.03em]">이민서 슈퍼바이저</h3>
      <div className="mt-5 grid gap-2 text-sm font-bold text-[#344054]">
        <div className="rounded-[12px] bg-[#f7f9fc] px-3 py-2">김OO · 종합심리평가 보고서</div>
        <div className="rounded-[12px] bg-[#f7f9fc] px-3 py-2">이OO · 초기 상담 구조화</div>
      </div>
    </Surface>
  );
}

function SettingsPreview() {
  return (
    <Surface>
      <Settings aria-hidden className="text-[#2563ff]" />
      <h3 className="mt-4 text-2xl font-black tracking-[-0.03em]">김민준</h3>
      <p className="mt-3 text-sm leading-7 text-[#516070]">
        OO병원 정신건강의학과 · 임상심리사
      </p>
    </Surface>
  );
}

function NotificationPreview() {
  return (
    <Surface>
      <MessageSquareText aria-hidden className="text-[#2563ff]" />
      <h3 className="mt-4 text-2xl font-black tracking-[-0.03em]">추가자료 요청</h3>
      <p className="mt-3 text-sm leading-7 text-[#516070]">
        REQ-1042에 보호자 면담 요약이 필요합니다.
      </p>
    </Surface>
  );
}

function SupervisorQueuePreview() {
  return (
    <Surface>
      <div className="flex flex-wrap gap-2">
        <Pill tone="blue">전체 3</Pill>
        <Pill tone="amber">자료 도착 1</Pill>
        <Pill tone="neutral">수락 대기 1</Pill>
      </div>
      <h3 className="mt-5 text-2xl font-black tracking-[-0.03em]">추가자료가 도착했습니다</h3>
      <p className="mt-3 text-sm leading-7 text-[#516070]">
        새 자료를 확인한 뒤 피드백 초안을 이어 씁니다.
      </p>
    </Surface>
  );
}

function ReviewSummary() {
  return (
    <Surface>
      <UserRound aria-hidden className="text-[#2563ff]" />
      <h3 className="mt-4 text-2xl font-black tracking-[-0.03em]">성인 우울 평가</h3>
      <p className="mt-3 text-sm leading-7 text-[#516070]">
        MMPI-2, BDI 포함 · 진단 가설과 보고서 문장 수정 요청
      </p>
    </Surface>
  );
}

function CalendarPreview() {
  return (
    <Surface>
      <CalendarDays aria-hidden className="text-[#2563ff]" />
      <div className="mt-5 grid gap-2">
        {["월 19:00", "수 20:00", "토 10:00"].map((slot) => (
          <div className="rounded-[12px] bg-[#f7f9fc] px-3 py-2 text-sm font-black text-[#344054]" key={slot}>
            {slot}
          </div>
        ))}
      </div>
    </Surface>
  );
}

function ProductPreview() {
  return (
    <Surface>
      <GraduationCap aria-hidden className="text-[#2563ff]" />
      <h3 className="mt-4 text-2xl font-black tracking-[-0.03em]">사례 개념화</h3>
      <p className="mt-3 text-sm leading-7 text-[#516070]">50분 · 120,000원</p>
    </Surface>
  );
}

function PayoutPreview() {
  return (
    <Surface>
      <Clock3 aria-hidden className="text-[#2563ff]" />
      <h3 className="mt-4 text-2xl font-black tracking-[-0.03em]">정산 예정</h3>
      <p className="mt-3 text-sm leading-7 text-[#516070]">6월 28일 · 120,000원</p>
    </Surface>
  );
}

function QualificationPreview() {
  return (
    <Surface>
      <ShieldCheck aria-hidden className="text-[#2563ff]" />
      <h3 className="mt-4 text-2xl font-black tracking-[-0.03em]">임상심리전문가 증빙</h3>
      <p className="mt-3 text-sm leading-7 text-[#516070]">
        자격번호, 발급기관, 공개 문구 확인 필요
      </p>
    </Surface>
  );
}

function SideRows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <dl className="mt-5 grid gap-3 text-sm">
      {rows.map(([label, value]) => (
        <div className="flex items-start justify-between gap-4 border-b border-[#edf1f6] pb-3 last:border-0 last:pb-0" key={label}>
          <dt className="font-bold text-[#667085]">{label}</dt>
          <dd className="text-right font-black text-[#081124]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
